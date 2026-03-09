import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHistoryItems, removeHistoryItem, selectHistory, selectHistoryActionStatus } from "@/features/history/model/historySlice";
import { useEditorialMotion } from "@/shared/lib/animation/useEditorialMotion";
import "./HistoryPage.scss";

const imageBaseUrl = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";

const getPosterUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${imageBaseUrl}${path}`;
};

const getTone = (item) => {
  return item.mediaType === "tv" ? "cool" : "warm";
};

const formatAction = (action) => {
  return action === "trailer" ? "Trailer Watched" : "Opened Details";
};

const formatTime = (value) => {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
};

function HistoryPage() {
  const dispatch = useDispatch();
  const rootRef = useRef(null);
  const { items, status, error } = useSelector(selectHistory);
  const actionStatus = useSelector(selectHistoryActionStatus);

  useEditorialMotion(rootRef, [items.length]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchHistoryItems());
    }
  }, [dispatch, status]);

  return (
    <section ref={rootRef} className="stream-page">
      <header className="stream-hero stream-hero-history glass-heavy">
        <div className="stream-hero-overlay" />
        <div className="stream-hero-content">
          <p className="stream-kicker">Playback Log</p>
          <h2 className="stream-title">Recently Watched</h2>
          <p className="stream-copy">
            Real backend watch history is shown below. Entries are captured when you click Open or Trailer actions from the browse page.
          </p>
          <div className="stream-hero-actions">
            <button type="button" className="stream-btn stream-btn-primary" onClick={() => dispatch(fetchHistoryItems())}>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="stream-section stream-rail">
        <div className="stream-rail-head">
          <h3>History Timeline</h3>
          <span>{items.length} entries</span>
        </div>

        {error ? <p className="stream-error">{error}</p> : null}

        <div className="stream-grid">
          {items.map((item) => (
            <article key={item.contentKey} className={`stream-card movie-card stream-card-grid history-entry glass-subtle tone-${getTone(item)}`}>
              <div className="stream-poster">
                {item.posterPath ? (
                  <img className="stream-poster-img" src={getPosterUrl(item.posterPath)} alt={item.title} loading="lazy" />
                ) : (
                  <div className="stream-poster-fallback">No Poster</div>
                )}
              </div>
              <div className="stream-card-body">
                <strong>{item.title}</strong>
                <p>{formatAction(item.action)}</p>
                <small>{formatTime(item.updatedAt || item.createdAt)}</small>

                <div className="stream-card-actions">
                  <button
                    type="button"
                    className="stream-mini-btn is-danger"
                    onClick={() => dispatch(removeHistoryItem(item.contentKey))}
                    disabled={actionStatus[item.contentKey] === "loading"}
                  >
                    {actionStatus[item.contentKey] === "loading" ? "..." : "Remove"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {status === "loading" && items.length === 0 ? <p className="stream-empty">Loading history...</p> : null}
        {status !== "loading" && items.length === 0 ? <p className="stream-empty">No history yet. Open or trailer-watch a title from Browse page.</p> : null}
      </section>
    </section>
  );
}

export default HistoryPage;
