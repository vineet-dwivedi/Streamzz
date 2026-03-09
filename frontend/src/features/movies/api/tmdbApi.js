import axios from "axios";

const tmdbBaseUrl = import.meta.env.VITE_TMDB_BASE_URL || "https://api.themoviedb.org/3";
const tmdbAccessToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

const tmdbClient = axios.create({
  baseURL: tmdbBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

tmdbClient.interceptors.request.use((config) => {
  if (!tmdbAccessToken) {
    throw new Error("TMDB access token missing. Add VITE_TMDB_ACCESS_TOKEN in frontend/.env");
  }

  config.headers.Authorization = `Bearer ${tmdbAccessToken}`;
  return config;
});

const normalizeMediaItem = (item) => {
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");

  return {
    id: `${mediaType}-${item.id}`,
    tmdbId: item.id,
    mediaType,
    title: item.title || item.name || "Untitled",
    originalTitle: item.original_title || item.original_name || item.title || item.name || "Untitled",
    overview: item.overview || "",
    posterPath: item.poster_path || item.profile_path || "",
    backdropPath: item.backdrop_path || "",
    releaseDate: item.release_date || item.first_air_date || "",
    voteAverage: typeof item.vote_average === "number" ? Number(item.vote_average.toFixed(1)) : null,
    genreIds: Array.isArray(item.genre_ids) ? item.genre_ids : [],
  };
};

const normalizeListResponse = (response) => {
  const list = response?.data?.results || [];

  return {
    page: response?.data?.page || 1,
    totalPages: response?.data?.total_pages || 1,
    items: list.map(normalizeMediaItem),
  };
};

const getBestTrailerUrl = (videos = []) => {
  if (!Array.isArray(videos) || videos.length === 0) return "";

  const youtubeVideos = videos.filter((video) => video?.site === "YouTube" && video?.key);
  if (youtubeVideos.length === 0) return "";

  const officialTrailer =
    youtubeVideos.find((video) => video.official && video.type === "Trailer") ||
    youtubeVideos.find((video) => video.type === "Trailer") ||
    youtubeVideos.find((video) => video.type === "Teaser") ||
    youtubeVideos[0];

  return officialTrailer?.key ? `https://www.youtube.com/embed/${officialTrailer.key}` : "";
};

const normalizeDetailsResponse = (item, mediaType) => {
  const runtime = item.runtime || (Array.isArray(item.episode_run_time) ? item.episode_run_time[0] : null) || null;
  const genres = Array.isArray(item.genres) ? item.genres.map((genre) => genre.name).filter(Boolean) : [];
  const trailerUrl = getBestTrailerUrl(item?.videos?.results || []);
  const cast = Array.isArray(item?.credits?.cast)
    ? item.credits.cast.slice(0, 10).map((person) => ({
        id: `cast-${person.id}`,
        name: person.name || person.original_name || "Unknown",
        character: person.character || "",
        profilePath: person.profile_path || "",
      }))
    : [];

  const similar = Array.isArray(item?.similar?.results)
    ? item.similar.results.slice(0, 12).map((similarItem) => ({
      id: `${mediaType}-${similarItem.id}`,
      tmdbId: similarItem.id,
      mediaType,
      title: similarItem.title || similarItem.name || "Untitled",
      originalTitle: similarItem.original_title || similarItem.original_name || similarItem.title || similarItem.name || "Untitled",
      posterPath: similarItem.poster_path || "",
      releaseDate: similarItem.release_date || similarItem.first_air_date || "",
      voteAverage: typeof similarItem.vote_average === "number" ? Number(similarItem.vote_average.toFixed(1)) : null,
      genreIds: Array.isArray(similarItem.genre_ids) ? similarItem.genre_ids : [],
    }))
    : [];

  return {
    id: `${mediaType}-${item.id}`,
    tmdbId: item.id,
    mediaType,
    title: item.title || item.name || "Untitled",
    originalTitle: item.original_title || item.original_name || item.title || item.name || "Untitled",
    overview: item.overview || "Description not available",
    posterPath: item.poster_path || "",
    backdropPath: item.backdrop_path || "",
    releaseDate: item.release_date || item.first_air_date || "",
    voteAverage: typeof item.vote_average === "number" ? Number(item.vote_average.toFixed(1)) : null,
    genres,
    genreIds: Array.isArray(item.genre_ids) ? item.genre_ids : [],
    runtime,
    status: item.status || "",
    originalLanguage: item.original_language || "",
    tagline: item.tagline || "",
    trailerUrl,
    cast,
    similar,
  };
};

export const tmdbApi = {
  async getTrending(page = 1) {
    const response = await tmdbClient.get("/trending/all/day", {
      params: { page },
    });

    return normalizeListResponse(response);
  },

  async getPopular(page = 1) {
    const response = await tmdbClient.get("/movie/popular", {
      params: { page },
    });

    return normalizeListResponse(response);
  },

  async search(query, page = 1) {
    const response = await tmdbClient.get("/search/multi", {
      params: {
        query,
        page,
        include_adult: false,
      },
    });

    return normalizeListResponse(response);
  },

  async getDetails(mediaType, tmdbId) {
    const safeMediaType = mediaType === "tv" ? "tv" : "movie";
    const response = await tmdbClient.get(`/${safeMediaType}/${tmdbId}`, {
      params: {
        append_to_response: "videos,credits,similar",
      },
    });

    return normalizeDetailsResponse(response.data, safeMediaType);
  },

  async getTrailer(mediaType, tmdbId) {
    const safeMediaType = mediaType === "tv" ? "tv" : "movie";
    const response = await tmdbClient.get(`/${safeMediaType}/${tmdbId}/videos`);
    return getBestTrailerUrl(response?.data?.results || []);
  },
};
