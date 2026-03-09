import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { addFavoriteItem, fetchFavorites, removeFavoriteItem, selectFavoriteActionStatus, selectFavoriteError, selectFavoriteItems, selectFavoriteKeySet, selectFavoriteStatus } from "@/features/favorites/model/favoritesSlice";
import { addHistoryItem } from "@/features/history/model/historySlice";
import { tmdbApi } from "@/features/movies/api/tmdbApi";
import { clearSearch, fetchPopular, fetchTrending, searchTitles, selectMovies } from "@/features/movies/model/moviesSlice";
import { useEditorialMotion } from "@/shared/lib/animation/useEditorialMotion";
import "./FavoritesPage.scss";

const imageBaseUrl = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";
const backdropBaseUrl = import.meta.env.VITE_TMDB_BACKDROP_BASE_URL || "https://image.tmdb.org/t/p/original";

const genreLookup = {
  12: "Adventure",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Sci-Fi",
  10749: "Romance",
  10751: "Family",
  10765: "Fantasy",
};

const genreFilters = [
  { id: "all", label: "All Titles", ids: [] },
  { id: "drama", label: "Drama", ids: [18] },
  { id: "thriller", label: "Thriller", ids: [53, 80] },
  { id: "sci-fi", label: "Sci-Fi", ids: [878, 10765] },
  { id: "animation", label: "Animation", ids: [16, 10751] },
  { id: "romance", label: "Romance", ids: [10749] },
];

const getPosterUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${imageBaseUrl}${path}`;
};

const getBackdropUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${backdropBaseUrl}${path}`;
};

const getYear = (dateValue) => {
  if (!dateValue) return "N/A";
  return String(dateValue).slice(0, 4);
};

const getRatingBand = (voteAverage) => {
  const score = Number(voteAverage);
  if (!Number.isFinite(score)) return "low";
  if (score >= 7.5) return "high";
  if (score >= 5) return "medium";
  return "low";
};

const getTone = (item) => {
  return item.mediaType === "tv" ? "cool" : "warm";
};

const getGenreNames = (item) => {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres;
  }

  if (!Array.isArray(item.genreIds)) {
    return [];
  }

  return item.genreIds.map((genreId) => genreLookup[genreId]).filter(Boolean);
};

const getPrimaryGenre = (item) => {
  return getGenreNames(item)[0] || (item.mediaType === "tv" ? "Series" : "Feature");
};

const toContentKey = (item) => {
  if (item.contentKey) return item.contentKey;
  return `${item.mediaType}-${item.tmdbId}`;
};

const toBackendPayload = (item) => {
  return {
    contentKey: toContentKey(item),
    title: item.title,
    posterPath: item.posterPath || "",
    mediaType: item.mediaType || "movie",
    releaseDate: item.releaseDate || "",
    source: "tmdb",
  };
};

const getPreviewTrailerUrl = (trailerUrl, isMuted = true) => {
  if (!trailerUrl) return "";
  const separator = trailerUrl.includes("?") ? "&" : "?";
  const muteValue = isMuted ? 1 : 0;
  return `${trailerUrl}${separator}autoplay=1&mute=${muteValue}&controls=0&modestbranding=1&playsinline=1&rel=0`;
};

const getTmdbIdFromContentKey = (contentKey) => {
  if (!contentKey) return null;
  const parts = String(contentKey).split("-");
  const lastPart = Number(parts[parts.length - 1]);
  return Number.isFinite(lastPart) ? lastPart : null;
};

const normalizeSavedItem = (item) => {
  const fallbackMediaType = item.mediaType === "tv" || item.mediaType === "movie" ? item.mediaType : "movie";
  const tmdbId = getTmdbIdFromContentKey(item.contentKey);

  return {
    id: item.contentKey,
    tmdbId,
    mediaType: fallbackMediaType,
    title: item.title,
    overview: "",
    posterPath: item.posterPath || "",
    backdropPath: "",
    releaseDate: item.releaseDate || "",
    voteAverage: null,
    contentKey: item.contentKey,
  };
};

function FavoritesPage() {
  const dispatch = useDispatch();
  const { trending, popular, search } = useSelector(selectMovies);
  const favoriteItems = useSelector(selectFavoriteItems);
  const favoriteStatus = useSelector(selectFavoriteStatus);
  const favoriteError = useSelector(selectFavoriteError);
  const favoriteKeySet = useSelector(selectFavoriteKeySet);
  const favoriteActionStatus = useSelector(selectFavoriteActionStatus);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [previewMode, setPreviewMode] = useState("details");
  const [previewData, setPreviewData] = useState(null);
  const [previewStatus, setPreviewStatus] = useState("idle");
  const [previewError, setPreviewError] = useState("");
  const [isTrailerFullscreen, setIsTrailerFullscreen] = useState(false);
  const [canHoverPreview, setCanHoverPreview] = useState(false);
  const [hoveredCardKey, setHoveredCardKey] = useState("");
  const [activePreviewKey, setActivePreviewKey] = useState("");
  const [hoverLoadingKey, setHoverLoadingKey] = useState("");
  const [hoverTrailerMap, setHoverTrailerMap] = useState({});
  const [hoverMuteMap, setHoverMuteMap] = useState({});
  const [activeGenre, setActiveGenre] = useState("all");
  const rootRef = useRef(null);
  const modalRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const clearActivePreviewTimerRef = useRef(null);
  const hoveredCardKeyRef = useRef("");

  const isSearching = debouncedSearch.length > 0;
  const primaryFeed = isSearching ? search : popular;

  const canLoadMore = useMemo(() => {
    if (primaryFeed.status === "loading") return false;
    return primaryFeed.page < primaryFeed.totalPages;
  }, [primaryFeed.page, primaryFeed.status, primaryFeed.totalPages]);

  const featuredItem = isSearching ? search.items[0] || trending.items[0] || popular.items[0] : trending.items[0] || popular.items[0];
  const spotlightItem = trending.items[1] || popular.items[1] || featuredItem;
  const filteredPrimaryItems = useMemo(() => {
    const selectedFilter = genreFilters.find((filter) => filter.id === activeGenre);
    if (!selectedFilter || selectedFilter.id === "all") {
      return primaryFeed.items;
    }

    return primaryFeed.items.filter((item) => {
      if (!Array.isArray(item.genreIds) || item.genreIds.length === 0) {
        return false;
      }

      return selectedFilter.ids.some((genreId) => item.genreIds.includes(genreId));
    });
  }, [activeGenre, primaryFeed.items]);

  const topTenItems = useMemo(() => trending.items.slice(0, 10), [trending.items]);

  useEditorialMotion(rootRef, [featuredItem?.id, filteredPrimaryItems.length, topTenItems.length, favoriteItems.length], {
    hero: Boolean(featuredItem),
    parallax: Boolean(featuredItem),
  });

  useEffect(() => {
    if (trending.status === "idle") {
      dispatch(fetchTrending(1));
    }

    if (popular.status === "idle") {
      dispatch(fetchPopular(1));
    }

    if (favoriteStatus === "idle") {
      dispatch(fetchFavorites());
    }
  }, [dispatch, favoriteStatus, popular.status, trending.status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!debouncedSearch) {
      dispatch(clearSearch());
      return;
    }

    dispatch(searchTitles({ query: debouncedSearch, page: 1 }));
  }, [debouncedSearch, dispatch]);

  useEffect(() => {
    if (isSearching) {
      setActiveGenre("all");
    }
  }, [isSearching]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverSupport = () => setCanHoverPreview(mediaQuery.matches);

    updateHoverSupport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateHoverSupport);
      return () => mediaQuery.removeEventListener("change", updateHoverSupport);
    }

    mediaQuery.addListener(updateHoverSupport);
    return () => mediaQuery.removeListener(updateHoverSupport);
  }, []);

  useEffect(() => {
    if (!canHoverPreview) {
      hoveredCardKeyRef.current = "";
      setHoveredCardKey("");
      setActivePreviewKey("");
      setHoverLoadingKey("");
    }
  }, [canHoverPreview]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (clearActivePreviewTimerRef.current) {
        clearTimeout(clearActivePreviewTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!previewItem) return undefined;

    const canFetchDetails =
      Number.isFinite(Number(previewItem.tmdbId)) && (previewItem.mediaType === "movie" || previewItem.mediaType === "tv");

    if (!canFetchDetails) {
      setPreviewStatus("succeeded");
      setPreviewData({
        ...previewItem,
        overview: previewItem.overview || "Description not available",
        genres: [],
        runtime: null,
        status: "",
        originalLanguage: "",
        tagline: "",
        trailerUrl: "",
        cast: [],
        similar: [],
      });
      return undefined;
    }

    let isCancelled = false;

    const loadDetails = async () => {
      setPreviewStatus("loading");
      setPreviewError("");

      try {
        const details = await tmdbApi.getDetails(previewItem.mediaType, previewItem.tmdbId);
        if (isCancelled) return;

        setPreviewData(details);
        setPreviewStatus("succeeded");
      } catch (error) {
        if (isCancelled) return;

        setPreviewStatus("failed");
        setPreviewError(error?.message || "Failed to load movie details");
      }
    };

    loadDetails();

    return () => {
      isCancelled = true;
    };
  }, [previewItem]);

  useEffect(() => {
    if (!previewItem) {
      setIsTrailerFullscreen(false);
      setActivePreviewKey("");
    }
  }, [previewItem]);

  useEffect(() => {
    if (!previewItem || !modalRef.current) {
      return;
    }

    modalRef.current.scrollTop = 0;
  }, [previewItem, previewMode]);

  useEffect(() => {
    if (previewMode !== "trailer") {
      setIsTrailerFullscreen(false);
    }
  }, [previewMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    if (!previewItem && !isTrailerFullscreen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [previewItem, isTrailerFullscreen]);

  useEffect(() => {
    if (!previewItem) return undefined;

    const closeOnEsc = (event) => {
      if (event.key === "Escape") {
        if (isTrailerFullscreen) {
          setIsTrailerFullscreen(false);
          return;
        }
        setPreviewItem(null);
      }
    };

    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [isTrailerFullscreen, previewItem]);

  const handleToggleFavorite = (item) => {
    const contentKey = toContentKey(item);
    if (favoriteKeySet.has(contentKey)) {
      dispatch(removeFavoriteItem(contentKey));
      return;
    }

    dispatch(addFavoriteItem(toBackendPayload(item)));
  };

  const handleOpenPreview = (item, action = "details") => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    if (clearActivePreviewTimerRef.current) {
      clearTimeout(clearActivePreviewTimerRef.current);
    }
    hoveredCardKeyRef.current = "";
    setHoveredCardKey("");
    setActivePreviewKey("");
    setPreviewMode(action === "trailer" ? "trailer" : "details");
    setPreviewError("");
    setPreviewData(null);
    setPreviewItem(item);

    dispatch(
      addHistoryItem({
        ...toBackendPayload(item),
        action: action === "trailer" ? "trailer" : "open",
      })
    );
  };

  const handleOpenSimilar = (item) => {
    handleOpenPreview(
      {
        ...item,
        contentKey: `${item.mediaType}-${item.tmdbId}`,
      },
      "details"
    );
  };

  const loadHoverTrailer = async (item) => {
    const contentKey = toContentKey(item);

    if (hoverTrailerMap[contentKey] !== undefined) {
      return hoverTrailerMap[contentKey];
    }

    if (!Number.isFinite(Number(item.tmdbId)) || (item.mediaType !== "movie" && item.mediaType !== "tv")) {
      setHoverTrailerMap((prev) => ({ ...prev, [contentKey]: null }));
      return null;
    }

    setHoverLoadingKey(contentKey);

    try {
      const trailerUrl = await tmdbApi.getTrailer(item.mediaType, item.tmdbId);
      setHoverTrailerMap((prev) => ({ ...prev, [contentKey]: trailerUrl || null }));
      return trailerUrl || null;
    } catch (error) {
      setHoverTrailerMap((prev) => ({ ...prev, [contentKey]: null }));
      return null;
    } finally {
      setHoverLoadingKey((current) => (current === contentKey ? "" : current));
    }
  };

  const handleCardMouseEnter = (item) => {
    if (!canHoverPreview) return;
    const contentKey = toContentKey(item);
    hoveredCardKeyRef.current = contentKey;
    setHoveredCardKey(contentKey);
    setHoverMuteMap((prev) => ({ ...prev, [contentKey]: true }));

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    if (clearActivePreviewTimerRef.current) {
      clearTimeout(clearActivePreviewTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(async () => {
      const trailerUrl = await loadHoverTrailer(item);
      if (hoveredCardKeyRef.current === contentKey && trailerUrl) {
        setActivePreviewKey(contentKey);
      }
    }, 420);
  };

  const handleCardMouseLeave = (contentKey) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    if (hoveredCardKeyRef.current === contentKey) {
      hoveredCardKeyRef.current = "";
    }
    setHoverLoadingKey((current) => (current === contentKey ? "" : current));
    setHoveredCardKey((current) => (current === contentKey ? "" : current));

    if (activePreviewKey === contentKey) {
      if (clearActivePreviewTimerRef.current) {
        clearTimeout(clearActivePreviewTimerRef.current);
      }

      clearActivePreviewTimerRef.current = setTimeout(() => {
        setActivePreviewKey((current) => (current === contentKey ? "" : current));
      }, 280);
    }
  };

  const handleToggleHoverMute = (contentKey) => {
    setHoverMuteMap((prev) => {
      const current = prev[contentKey] ?? true;
      return {
        ...prev,
        [contentKey]: !current,
      };
    });
  };

  const renderSkeletonCards = (count = 8) => {
    return Array.from({ length: count }, (_, index) => (
      <article key={`skeleton-${index}`} className="stream-card stream-card-grid glass-subtle skeleton-card">
        <div className="stream-poster skeleton-shimmer" />
        <div className="stream-card-body">
          <div className="skeleton-line skeleton-shimmer" />
          <div className="skeleton-line short skeleton-shimmer" />
          <div className="skeleton-line tiny skeleton-shimmer" />
        </div>
      </article>
    ));
  };

  const renderHeroTitle = (title) => {
    return String(title || "Featured Title")
      .split("")
      .map((character, index) => (
        <span key={`${character}-${index}`} className="char">
          {character === " " ? "\u00A0" : character}
        </span>
      ));
  };

  const renderSectionHead = (label, title, actionLabel, actionHandler) => {
    return (
      <div className="section-header">
        <div>
          <p className="section-label">{label}</p>
          <h3 className="section-title">{title}</h3>
        </div>
        {actionLabel && actionHandler ? (
          <button type="button" className="btn-slide section-action" onClick={actionHandler}>
            <span className="btn-track">
              <span className="btn-text">{actionLabel}</span>
              <span className="btn-arrow">{"->"}</span>
              <span className="btn-text btn-clone" aria-hidden="true">
                {actionLabel}
              </span>
              <span className="btn-arrow btn-clone" aria-hidden="true">
                {"->"}
              </span>
            </span>
          </button>
        ) : null}
      </div>
    );
  };

  const handleLoadMore = () => {
    if (!canLoadMore || primaryFeed.status === "loading") {
      return;
    }

    if (isSearching) {
      dispatch(searchTitles({ query: debouncedSearch, page: search.page + 1 }));
      return;
    }

    dispatch(fetchPopular(popular.page + 1));
  };

  const renderMovieCard = (item, variant = "default") => {
    const contentKey = toContentKey(item);
    const isFavorite = favoriteKeySet.has(contentKey);
    const isActionLoading = favoriteActionStatus[contentKey] === "loading";
    const trailerUrl = hoverTrailerMap[contentKey];
    const isHoverMuted = hoverMuteMap[contentKey] ?? true;
    const showHoverPreview = canHoverPreview && activePreviewKey === contentKey && Boolean(trailerUrl);
    const showHoverLoading = canHoverPreview && hoveredCardKey === contentKey && hoverLoadingKey === contentKey;

    return (
      <article
        key={contentKey}
        className={`stream-card movie-card ${variant === "grid" ? "stream-card-grid" : ""} glass-subtle tone-${getTone(item)}`}
        onMouseEnter={() => handleCardMouseEnter(item)}
        onMouseLeave={() => handleCardMouseLeave(contentKey)}
      >
        <div className="stream-poster card-media">
          <div className="stream-poster-shadow card-overlay" />
          <span className="genre-chip stream-type-chip">{item.mediaType || "movie"}</span>
          <span className="rating-badge" data-score={getRatingBand(item.voteAverage)}>
            {item.voteAverage ? Number(item.voteAverage).toFixed(1) : "N/A"}
          </span>

          {item.posterPath ? (
            <img className="stream-poster-img" src={getPosterUrl(item.posterPath)} alt={item.title} loading="lazy" />
          ) : (
            <div className="stream-poster-fallback">No Poster</div>
          )}

          {showHoverLoading ? <div className="stream-hover-loading">Loading preview...</div> : null}

          {showHoverPreview ? (
            <div className="stream-hover-preview">
              <iframe
                className="stream-hover-preview-frame"
                src={getPreviewTrailerUrl(trailerUrl, isHoverMuted)}
                title={`${item.title} hover preview`}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              <button
                type="button"
                className="stream-hover-audio-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleHoverMute(contentKey);
                }}
              >
                {isHoverMuted ? "Unmute" : "Mute"}
              </button>
              <div className="stream-hover-hint">Hover Preview</div>
            </div>
          ) : null}
        </div>
        <div className="stream-card-body card-body">
          <strong className="card-title">{item.title}</strong>
          <p className="card-meta">
            {getYear(item.releaseDate)} · {getPrimaryGenre(item)} · {item.mediaType.toUpperCase()}
          </p>
          <small>{item.voteAverage ? `Score ${item.voteAverage}` : "Score unavailable"}</small>

          <div className="stream-card-actions card-action-row">
            <button
              type="button"
              className={`stream-mini-btn ${isFavorite ? "is-active" : ""}`}
              onClick={() => handleToggleFavorite(item)}
              disabled={isActionLoading}
            >
              {isActionLoading ? "..." : isFavorite ? "Saved" : "Save"}
            </button>
            <button type="button" className="stream-mini-btn" onClick={() => handleOpenPreview(item, "details")}>
              Open
            </button>
            <button type="button" className="stream-mini-btn" onClick={() => handleOpenPreview(item, "trailer")}>
              Trailer
            </button>
          </div>
        </div>
      </article>
    );
  };

  const previewModalMarkup = previewItem ? (
    <div className="movie-modal-backdrop" onClick={() => setPreviewItem(null)}>
      <div ref={modalRef} className="movie-modal glass-heavy" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="movie-modal-close" onClick={() => setPreviewItem(null)}>
          Close
        </button>

        <div className="movie-modal-head">
          <button
            type="button"
            className={`stream-mini-btn ${previewMode === "details" ? "is-active" : ""}`}
            onClick={() => setPreviewMode("details")}
          >
            Details
          </button>
          <button
            type="button"
            className={`stream-mini-btn ${previewMode === "trailer" ? "is-active" : ""}`}
            onClick={() => setPreviewMode("trailer")}
          >
            Trailer
          </button>
        </div>

        {previewStatus === "loading" ? <p className="stream-empty">Loading movie info...</p> : null}
        {previewStatus === "failed" ? <p className="stream-error">{previewError}</p> : null}

        {previewStatus === "succeeded" && previewData ? (
          <div className="movie-modal-body">
            {previewMode === "trailer" ? (
              <>
                <div className="movie-trailer-toolbar">
                  <button
                    type="button"
                    className="stream-mini-btn"
                    onClick={() => setIsTrailerFullscreen(true)}
                    disabled={!previewData.trailerUrl}
                  >
                    Fullscreen
                  </button>
                </div>
                {previewData.trailerUrl ? (
                  <div className="movie-trailer-wrap">
                    <iframe
                      className="movie-trailer-frame"
                      src={previewData.trailerUrl}
                      title={`${previewData.title} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="stream-empty">Trailer for this movie is currently unavailable.</p>
                )}
              </>
            ) : (
              <>
                <div className="movie-detail-grid">
                  <div className="movie-detail-poster">
                    {previewData.posterPath ? (
                      <img className="stream-poster-img" src={getPosterUrl(previewData.posterPath)} alt={previewData.title} />
                    ) : (
                      <div className="stream-poster-fallback">No Poster</div>
                    )}
                  </div>
                  <div className="movie-detail-content">
                    <h3>{previewData.title}</h3>
                    {previewData.tagline ? <p className="movie-tagline">{previewData.tagline}</p> : null}
                    <p>{previewData.overview || "Description not available"}</p>
                    <div className="movie-detail-meta">
                      <span>{previewData.releaseDate ? `Release: ${previewData.releaseDate}` : "Release: N/A"}</span>
                      <span>{previewData.voteAverage ? `Rating: ${previewData.voteAverage}` : "Rating: N/A"}</span>
                      <span>{previewData.runtime ? `Runtime: ${previewData.runtime} min` : "Runtime: N/A"}</span>
                      <span>{previewData.originalLanguage ? `Language: ${previewData.originalLanguage.toUpperCase()}` : "Language: N/A"}</span>
                      <span>{previewData.status ? `Status: ${previewData.status}` : "Status: N/A"}</span>
                    </div>
                    {previewData.genres?.length ? (
                      <div className="movie-detail-genres">
                        {previewData.genres.map((genre) => (
                          <span key={genre} className="stream-mini-btn">
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {previewData.cast?.length ? (
                  <div className="movie-subsection">
                    <h4 className="movie-subsection-title">Cast</h4>
                    <div className="movie-cast-list">
                      {previewData.cast.map((person) => (
                        <div key={person.id} className="movie-cast-chip glass-subtle">
                          <strong>{person.name}</strong>
                          <span>{person.character || "Cast"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {previewData.similar?.length ? (
                  <div className="movie-subsection">
                    <h4 className="movie-subsection-title">Similar Titles</h4>
                    <div className="movie-similar-row">
                      {previewData.similar.map((similarItem) => (
                        <article key={similarItem.id} className="movie-similar-card glass-subtle">
                          <div className="movie-similar-poster">
                            {similarItem.posterPath ? (
                              <img className="stream-poster-img" src={getPosterUrl(similarItem.posterPath)} alt={similarItem.title} />
                            ) : (
                              <div className="stream-poster-fallback">No Poster</div>
                            )}
                          </div>
                          <div className="movie-similar-content">
                            <strong>{similarItem.title}</strong>
                            <span>{getYear(similarItem.releaseDate)}</span>
                            <button type="button" className="stream-mini-btn" onClick={() => handleOpenSimilar(similarItem)}>
                              Open
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  const trailerFullscreenMarkup = isTrailerFullscreen && previewData?.trailerUrl ? (
    <div className="movie-trailer-fullscreen-backdrop" onClick={() => setIsTrailerFullscreen(false)}>
      <div className="movie-trailer-fullscreen-wrap" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="movie-modal-close" onClick={() => setIsTrailerFullscreen(false)}>
          Exit Fullscreen
        </button>
        <div className="movie-trailer-fullscreen-frame">
          <iframe
            className="movie-trailer-frame"
            src={previewData.trailerUrl}
            title={`${previewData.title} trailer fullscreen`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section ref={rootRef} className="stream-page stream-page-browse">
      <header className="stream-hero hero-cinematic">
        <div className="hero-backdrop">
          {featuredItem?.backdropPath || featuredItem?.posterPath ? (
            <img
              src={getBackdropUrl(featuredItem?.backdropPath || featuredItem?.posterPath)}
              alt={featuredItem?.title || "Featured title"}
            />
          ) : null}
        </div>
        <div className="stream-hero-overlay" />
        <div className="stream-hero-content hero-content-wrap">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            <span className="hero-eyebrow-text">{isSearching ? "Search Selection" : "Featured Film"}</span>
          </div>

          <h2 className="stream-title hero-title">{renderHeroTitle(featuredItem?.title || "Obsidian Picks")}</h2>
          <p className="hero-tagline">{featuredItem?.overview || "A quiet collection of cinema, motion, and detail."}</p>

          <div className="hero-meta">
            <span className="hero-meta-item">{getYear(featuredItem?.releaseDate)}</span>
            <span className="hero-meta-item">{featuredItem?.mediaType === "tv" ? "Series" : "Film"}</span>
            <span className="hero-meta-item">{getPrimaryGenre(featuredItem || {})}</span>
            <span className="hero-meta-item">{featuredItem?.voteAverage ? `* ${featuredItem.voteAverage}` : "Curated"}</span>
          </div>

          <div className="hero-cta-row">
            {featuredItem ? (
              <>
                <button type="button" className="stream-btn stream-btn-primary" onClick={() => handleOpenPreview(featuredItem, "trailer")}>
                  <span>Watch Trailer</span>
                </button>
                <button type="button" className="stream-btn stream-btn-glass" onClick={() => handleOpenPreview(featuredItem, "details")}>
                  <span>Open Details</span>
                </button>
                <button
                  type="button"
                  className={`stream-btn stream-btn-glass ${favoriteKeySet.has(toContentKey(featuredItem)) ? "is-active" : ""}`}
                  onClick={() => handleToggleFavorite(featuredItem)}
                >
                  <span>{favoriteKeySet.has(toContentKey(featuredItem)) ? "Saved" : "Save Title"}</span>
                </button>
              </>
            ) : null}
          </div>

          <div className="browse-search">
            <input
              className="browse-search-input"
              type="text"
              placeholder="What are you looking for..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <div className="browse-search-meta">
              <span>{isSearching ? `${search.items.length} results` : `${popular.items.length} titles loaded`}</span>
              <span>{primaryFeed.status === "loading" ? "Loading..." : "Ready"}</span>
            </div>
          </div>

          <div className="scroll-hint">Scroll for curated sections</div>
        </div>
      </header>

      <section className="stream-section stats-strip glass-subtle">
        <article className="stream-stat">
          <span>Saved</span>
          <strong>{favoriteItems.length}</strong>
          <small>Your personal shelf</small>
        </article>
        <article className="stream-stat">
          <span>Trending</span>
          <strong>{trending.items.length}</strong>
          <small>Live daily pulse</small>
        </article>
        <article className="stream-stat">
          <span>Library</span>
          <strong>{primaryFeed.items.length}</strong>
          <small>{isSearching ? "Search archive" : "Popular selection"}</small>
        </article>
        <article className="stream-stat">
          <span>Pages</span>
          <strong>{primaryFeed.totalPages || 1}</strong>
          <small>TMDB feed depth</small>
        </article>
      </section>

      <section className="stream-section stream-rail">
        {renderSectionHead("Personal Shelf", "Saved for Later", "Browse All", () => window.scrollTo({ top: 0, behavior: "smooth" }))}

        {favoriteError ? <p className="stream-error">{favoriteError}</p> : null}

        <div className="stream-row">
          {favoriteItems.length > 0 ? (
            favoriteItems.map((item) => renderMovieCard(normalizeSavedItem(item)))
          ) : (
            <p className="stream-empty">No favorites yet. Save titles from the grid below.</p>
          )}
        </div>
      </section>

      {!isSearching ? (
        <section className="stream-section stream-rail">
          {renderSectionHead("Daily Current", "Trending Now", "View Chart", () => window.scrollTo({ top: 0, behavior: "smooth" }))}
          <div className="stream-row">{trending.items.slice(0, 12).map((item) => renderMovieCard(item))}</div>
        </section>
      ) : null}

      {!isSearching ? (
        <section className="stream-section">
          {renderSectionHead("Refine the Shelf", "Genre Explorer")}
          <div className="genre-bar">
            {genreFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`genre-pill ${activeGenre === filter.id ? "active" : ""}`}
                onClick={() => setActiveGenre(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="stream-section stream-rail">
        {renderSectionHead(
          isSearching ? "Search Archive" : "Popular Index",
          isSearching ? `Results for "${debouncedSearch}"` : "Popular Now",
          canLoadMore ? "Load More" : null,
          canLoadMore ? handleLoadMore : null
        )}

        {primaryFeed.error ? <p className="stream-error">{primaryFeed.error}</p> : null}

        <div className="stream-grid">{filteredPrimaryItems.map((item) => renderMovieCard(item, "grid"))}</div>

        {primaryFeed.status === "loading" && primaryFeed.items.length === 0 ? renderSkeletonCards(10) : null}

        {primaryFeed.status !== "loading" && filteredPrimaryItems.length === 0 ? (
          <p className="stream-empty">{isSearching ? "No results found. Try another keyword." : "No titles matched this genre."}</p>
        ) : null}

        <div className="stream-sentinel">
          {canLoadMore ? (
            <button type="button" className="stream-btn stream-btn-glass stream-load-more-btn" onClick={handleLoadMore}>
              {primaryFeed.status === "loading" ? "Loading..." : "Load More"}
            </button>
          ) : (
            "End of list"
          )}
        </div>
      </section>

      {!isSearching && topTenItems.length > 0 ? (
        <section className="stream-section top-ten-section">
          {renderSectionHead("Chart", "Top 10 of the Day")}

          <div className="top-ten-list">
            {topTenItems.map((item, index) => (
              <article key={item.id} className="top-ten-row glass-subtle">
                <div className="top-ten-rank">{String(index + 1).padStart(2, "0")}</div>
                <div className="top-ten-poster">
                  {item.posterPath ? <img className="stream-poster-img" src={getPosterUrl(item.posterPath)} alt={item.title} loading="lazy" /> : <div className="stream-poster-fallback">No Poster</div>}
                </div>
                <div className="top-ten-content">
                  <strong>{item.title}</strong>
                  <p>
                    {getYear(item.releaseDate)} · {getPrimaryGenre(item)} · {item.mediaType.toUpperCase()}
                  </p>
                </div>
                <div className="top-ten-score">
                  <span>{item.voteAverage ? item.voteAverage.toFixed(1) : "N/A"}</span>
                  <button type="button" className="stream-mini-btn" onClick={() => handleOpenPreview(item, "details")}>
                    Open
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!isSearching && spotlightItem ? (
        <section className="stream-section spotlight glass-heavy">
          <div className="spotlight-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${getBackdropUrl(spotlightItem.backdropPath || spotlightItem.posterPath)})` }} />
          <div className="spotlight-poster">
            {spotlightItem.posterPath ? (
              <img className="stream-poster-img" src={getPosterUrl(spotlightItem.posterPath)} alt={spotlightItem.title} loading="lazy" />
            ) : (
              <div className="stream-poster-fallback">No Poster</div>
            )}
          </div>
          <div className="spotlight-content">
            <p className="section-label">Spotlight Selection</p>
            <h3 className="section-title">{spotlightItem.title}</h3>
            <p className="stream-copy">{spotlightItem.overview || "Selected for atmosphere, detail, and presence."}</p>
            <div className="hero-meta">
              <span className="hero-meta-item">{getYear(spotlightItem.releaseDate)}</span>
              <span className="hero-meta-item">{getPrimaryGenre(spotlightItem)}</span>
              <span className="hero-meta-item">{spotlightItem.voteAverage ? `${spotlightItem.voteAverage} / 10` : "Curated"}</span>
            </div>
            <div className="hero-cta-row">
              <button type="button" className="stream-btn stream-btn-primary" onClick={() => handleOpenPreview(spotlightItem, "details")}>
                <span>Read Details</span>
              </button>
              <button type="button" className="stream-btn stream-btn-glass" onClick={() => handleOpenPreview(spotlightItem, "trailer")}>
                <span>Watch Trailer</span>
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {typeof document !== "undefined" && previewModalMarkup ? createPortal(previewModalMarkup, document.body) : null}
      {typeof document !== "undefined" && trailerFullscreenMarkup ? createPortal(trailerFullscreenMarkup, document.body) : null}
    </section>
  );
}

export default FavoritesPage;
