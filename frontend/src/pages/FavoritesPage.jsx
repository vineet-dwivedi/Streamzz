import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addFavoriteItem, fetchFavorites, removeFavoriteItem, selectFavoriteActionStatus, selectFavoriteError, selectFavoriteItems, selectFavoriteKeySet, selectFavoriteStatus } from "@/features/favorites/model/favoritesSlice";
import { addHistoryItem } from "@/features/history/model/historySlice";
import { tmdbApi } from "@/features/movies/api/tmdbApi";
import { clearSearch, fetchPopular, fetchTrending, searchTitles, selectMovies } from "@/features/movies/model/moviesSlice";

const imageBaseUrl = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";

const getPosterUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${imageBaseUrl}${path}`;
};

const getYear = (dateValue) => {
  if (!dateValue) return "N/A";
  return String(dateValue).slice(0, 4);
};

const getTone = (item) => {
  return item.mediaType === "tv" ? "cool" : "warm";
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
  const hoverTimerRef = useRef(null);
  const clearActivePreviewTimerRef = useRef(null);
  const hoveredCardKeyRef = useRef("");

  const isSearching = debouncedSearch.length > 0;
  const primaryFeed = isSearching ? search : popular;

  const canLoadMore = useMemo(() => {
    if (primaryFeed.status === "loading") return false;
    return primaryFeed.page < primaryFeed.totalPages;
  }, [primaryFeed.page, primaryFeed.status, primaryFeed.totalPages]);

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
    if (previewMode !== "trailer") {
      setIsTrailerFullscreen(false);
    }
  }, [previewMode]);

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
        className={`stream-card ${variant === "grid" ? "stream-card-grid" : ""} glass-subtle tone-${getTone(item)}`}
        onMouseEnter={() => handleCardMouseEnter(item)}
        onMouseLeave={() => handleCardMouseLeave(contentKey)}
      >
        <div className="stream-poster">
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
        <div className="stream-card-body">
          <strong>{item.title}</strong>
          <p>
            {item.mediaType.toUpperCase()} | {getYear(item.releaseDate)}
          </p>
          <small>{item.voteAverage ? `Rating ${item.voteAverage}` : "No rating yet"}</small>

          <div className="stream-card-actions">
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

  return (
    <section className="stream-page">
      <header className="stream-hero stream-hero-favorites glass-heavy">
        <div className="stream-hero-overlay" />
        <div className="stream-hero-content">
          <p className="stream-kicker">Browse Library</p>
          <h2 className="stream-title">{isSearching ? "Search Results" : "Trending Universe"}</h2>
          <p className="stream-copy">
            Explore live TMDB data with instant search, smooth loading, and endless discovery rails.
          </p>

          <div className="browse-search glass-subtle">
            <input
              className="browse-search-input"
              type="text"
              placeholder="Search movies, TV shows, or people"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <div className="browse-search-meta">
              <span>{isSearching ? `${search.items.length} results` : `${popular.items.length} popular titles loaded`}</span>
              <span>{primaryFeed.status === "loading" ? "Loading..." : "Ready"}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="stream-rail">
        <div className="stream-rail-head">
          <h3>My Saved Favorites</h3>
          <span>{favoriteItems.length} items</span>
        </div>

        {favoriteError ? <p className="stream-error">{favoriteError}</p> : null}

        <div className="stream-row">
          {favoriteItems.length > 0 ? (
            favoriteItems.map((item) => renderMovieCard(normalizeSavedItem(item)))
          ) : (
            <p className="stream-empty">No favorites yet. Press Save on any title.</p>
          )}
        </div>
      </section>

      {!isSearching ? (
        <section className="stream-rail">
          <div className="stream-rail-head">
            <h3>Trending Today</h3>
            <span>{trending.items.length} live</span>
          </div>
          <div className="stream-row">{trending.items.slice(0, 20).map((item) => renderMovieCard(item))}</div>
        </section>
      ) : null}

      <section className="stream-rail">
        <div className="stream-rail-head">
          <h3>{isSearching ? `Search: "${debouncedSearch}"` : "Popular Now"}</h3>
          <span>{primaryFeed.items.length} titles</span>
        </div>

        {primaryFeed.error ? <p className="stream-error">{primaryFeed.error}</p> : null}

        <div className="stream-grid">{primaryFeed.items.map((item) => renderMovieCard(item, "grid"))}</div>

        {primaryFeed.status === "loading" && primaryFeed.items.length === 0 ? (
          <p className="stream-empty">Loading titles...</p>
        ) : null}

        {primaryFeed.status !== "loading" && primaryFeed.items.length === 0 ? (
          <p className="stream-empty">No results found. Try another keyword.</p>
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

      {previewItem ? (
        <div className="movie-modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div className="movie-modal glass-heavy" onClick={(event) => event.stopPropagation()}>
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
      ) : null}

      {isTrailerFullscreen && previewData?.trailerUrl ? (
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
      ) : null}
    </section>
  );
}

export default FavoritesPage;
