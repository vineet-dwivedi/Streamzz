import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createAdminMovie,
  deleteAdminMovie,
  deleteAdminUser,
  fetchAdminMovies,
  fetchAdminUsers,
  selectAdminError,
  selectAdminMovieActionStatus,
  selectAdminMovies,
  selectAdminMoviesStatus,
  selectAdminUserActionStatus,
  selectAdminUsers,
  selectAdminUsersStatus,
  toggleAdminUserBan,
  updateAdminMovie,
} from "@/features/admin/model/adminSlice";

const movieFormInitial = {
  movieId: "",
  title: "",
  posterUrl: "",
  description: "",
  releaseDate: "",
  trailerYoutubeLink: "",
  genre: "",
  category: "movie",
};

const toSafeDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

function AdminDashboardPage() {
  const dispatch = useDispatch();

  const movies = useSelector(selectAdminMovies);
  const users = useSelector(selectAdminUsers);
  const moviesStatus = useSelector(selectAdminMoviesStatus);
  const usersStatus = useSelector(selectAdminUsersStatus);
  const movieActionStatus = useSelector(selectAdminMovieActionStatus);
  const userActionStatus = useSelector(selectAdminUserActionStatus);
  const adminError = useSelector(selectAdminError);

  const [activeTab, setActiveTab] = useState("catalog");
  const [formData, setFormData] = useState(movieFormInitial);
  const [editingMovieId, setEditingMovieId] = useState("");

  const isCreatingMovie = movieActionStatus.create === "loading";
  const isUpdatingMovie = editingMovieId ? movieActionStatus[editingMovieId] === "loading" : false;
  const isSubmittingMovie = isCreatingMovie || isUpdatingMovie;

  const bannedUserCount = useMemo(() => users.filter((user) => user.isBanned).length, [users]);

  useEffect(() => {
    if (moviesStatus === "idle") {
      dispatch(fetchAdminMovies());
    }
    if (usersStatus === "idle") {
      dispatch(fetchAdminUsers());
    }
  }, [dispatch, moviesStatus, usersStatus]);

  const handleReloadAll = () => {
    dispatch(fetchAdminMovies());
    dispatch(fetchAdminUsers());
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartEditMovie = (movie) => {
    setActiveTab("catalog");
    setEditingMovieId(movie._id);
    setFormData({
      movieId: movie.movieId || "",
      title: movie.title || "",
      posterUrl: movie.posterUrl || "",
      description: movie.description || "",
      releaseDate: toSafeDateInput(movie.releaseDate),
      trailerYoutubeLink: movie.trailerYoutubeLink || "",
      genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : "",
      category: movie.category || "movie",
    });
  };

  const handleCancelEditMovie = () => {
    setEditingMovieId("");
    setFormData(movieFormInitial);
  };

  const handleSubmitMovie = async (event) => {
    event.preventDefault();

    const payload = {
      movieId: formData.movieId.trim(),
      title: formData.title.trim(),
      posterUrl: formData.posterUrl.trim(),
      description: formData.description.trim() || "Description not available",
      releaseDate: formData.releaseDate,
      trailerYoutubeLink: formData.trailerYoutubeLink.trim(),
      genre: formData.genre,
      category: formData.category,
    };

    try {
      if (editingMovieId) {
        await dispatch(updateAdminMovie({ id: editingMovieId, payload })).unwrap();
      } else {
        await dispatch(createAdminMovie(payload)).unwrap();
      }

      setEditingMovieId("");
      setFormData(movieFormInitial);
    } catch (error) {
      // Error is already handled in slice state and displayed in UI.
    }
  };

  const handleDeleteMovie = async (movieId, title) => {
    const shouldDelete = window.confirm(`Delete "${title}" from catalog?`);
    if (!shouldDelete) return;
    dispatch(deleteAdminMovie(movieId));
  };

  const handleToggleBan = (user) => {
    dispatch(
      toggleAdminUserBan({
        id: user.id,
        isBanned: !user.isBanned,
      })
    );
  };

  const handleDeleteUser = (user) => {
    const shouldDelete = window.confirm(`Delete user "${user.name}"? This will remove favorites and history.`);
    if (!shouldDelete) return;
    dispatch(deleteAdminUser(user.id));
  };

  return (
    <section className="stream-page">
      <header className="stream-hero stream-hero-admin glass-heavy">
        <div className="stream-hero-overlay" />
        <div className="stream-hero-content">
          <p className="stream-kicker">Studio Mode</p>
          <h2 className="stream-title">Admin Command Center</h2>
          <p className="stream-copy">
            Full control panel for your custom catalog and user moderation. Create and manage titles, then handle user access in one place.
          </p>
          <div className="stream-hero-actions">
            <button type="button" className="stream-btn stream-btn-primary" onClick={() => setActiveTab("catalog")}>
              Catalog Panel
            </button>
            <button type="button" className="stream-btn stream-btn-glass" onClick={() => setActiveTab("users")}>
              User Panel
            </button>
            <button type="button" className="stream-btn stream-btn-glass" onClick={handleReloadAll}>
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      <section className="stream-dashboard-grid">
        <article className="stream-stat glass-subtle">
          <span>Catalog Size</span>
          <strong>{movies.length}</strong>
          <small>{moviesStatus === "loading" ? "Loading catalog..." : "Custom studio titles"}</small>
        </article>

        <article className="stream-stat glass-heavy">
          <span>Total Users</span>
          <strong>{users.length}</strong>
          <small>{usersStatus === "loading" ? "Loading users..." : "Registered accounts"}</small>
        </article>

        <article className="stream-stat glass-subtle">
          <span>Banned Users</span>
          <strong>{bannedUserCount}</strong>
          <small>Restricted profiles</small>
        </article>
      </section>

      {adminError ? <p className="stream-error">{adminError}</p> : null}

      <section className="studio-panel glass-heavy">
        <div className="studio-panel-head">
          <h3>{activeTab === "catalog" ? "Studio Catalog Panel" : "User Moderation Panel"}</h3>
          <div className="studio-tab-switch glass-subtle">
            <button type="button" className={activeTab === "catalog" ? "is-active" : ""} onClick={() => setActiveTab("catalog")}>
              Catalog
            </button>
            <button type="button" className={activeTab === "users" ? "is-active" : ""} onClick={() => setActiveTab("users")}>
              Users
            </button>
          </div>
        </div>

        {activeTab === "catalog" ? (
          <div className="studio-catalog-grid">
            <form className="studio-form glass-subtle" onSubmit={handleSubmitMovie}>
              <h4>{editingMovieId ? "Edit Movie" : "Create Movie"}</h4>

              <label className="studio-field">
                <span>Movie ID</span>
                <input name="movieId" value={formData.movieId} onChange={handleInputChange} placeholder="MOV-1001" required />
              </label>

              <label className="studio-field">
                <span>Title</span>
                <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Movie title" required />
              </label>

              <label className="studio-field">
                <span>Poster URL</span>
                <input name="posterUrl" value={formData.posterUrl} onChange={handleInputChange} placeholder="https://..." />
              </label>

              <label className="studio-field">
                <span>Release Date</span>
                <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} />
              </label>

              <div className="studio-field-row">
                <label className="studio-field">
                  <span>Category</span>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="movie">Movie</option>
                    <option value="tv">TV</option>
                  </select>
                </label>

                <label className="studio-field">
                  <span>Genres (comma separated)</span>
                  <input name="genre" value={formData.genre} onChange={handleInputChange} placeholder="Action, Sci-Fi" />
                </label>
              </div>

              <label className="studio-field">
                <span>Trailer YouTube Link</span>
                <input
                  name="trailerYoutubeLink"
                  value={formData.trailerYoutubeLink}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>

              <label className="studio-field">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description not available"
                />
              </label>

              <div className="studio-form-actions">
                <button type="submit" className="stream-btn stream-btn-primary" disabled={isSubmittingMovie}>
                  {isSubmittingMovie ? "Saving..." : editingMovieId ? "Update Movie" : "Create Movie"}
                </button>

                {editingMovieId ? (
                  <button type="button" className="stream-btn stream-btn-glass" onClick={handleCancelEditMovie}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="studio-movie-list">
              {moviesStatus === "loading" ? <p className="stream-copy">Loading catalog...</p> : null}
              {moviesStatus === "succeeded" && movies.length === 0 ? <p className="stream-copy">No movies added yet.</p> : null}

              {movies.map((movie) => {
                const actionLoading = movieActionStatus[movie._id] === "loading";

                return (
                  <article key={movie._id} className="studio-movie-card glass-subtle">
                    <div className="studio-movie-poster">
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
                      ) : (
                        <div className="studio-poster-empty">No Poster</div>
                      )}
                    </div>

                    <div className="studio-movie-body">
                      <strong>{movie.title}</strong>
                      <p>
                        {movie.category?.toUpperCase() || "MOVIE"} | {movie.releaseDate || "No date"}
                      </p>
                      <small>{movie.movieId}</small>

                      {Array.isArray(movie.genre) && movie.genre.length > 0 ? (
                        <div className="studio-genre-row">
                          {movie.genre.map((item) => (
                            <span key={`${movie._id}-${item}`} className="studio-chip">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="stream-card-actions">
                        <button type="button" className="stream-mini-btn" onClick={() => handleStartEditMovie(movie)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="stream-mini-btn"
                          disabled={actionLoading}
                          onClick={() => handleDeleteMovie(movie._id, movie.title)}
                        >
                          {actionLoading ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="studio-user-list">
            {usersStatus === "loading" ? <p className="stream-copy">Loading users...</p> : null}
            {usersStatus === "succeeded" && users.length === 0 ? <p className="stream-copy">No users found.</p> : null}

            {users.map((user) => {
              const actionLoading = userActionStatus[user.id] === "loading";
              const tone = user.isBanned ? "tone-warm" : "tone-cool";

              return (
                <article key={user.id} className={`studio-user-card glass-subtle ${tone}`}>
                  <div className="studio-user-info">
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                    <small>
                      Role: {user.role} | Status: {user.isBanned ? "Banned" : "Active"}
                    </small>
                  </div>

                  <div className="studio-user-actions">
                    <button type="button" className="stream-mini-btn" disabled={actionLoading} onClick={() => handleToggleBan(user)}>
                      {actionLoading ? "Please wait..." : user.isBanned ? "Unban" : "Ban"}
                    </button>
                    <button type="button" className="stream-mini-btn" disabled={actionLoading} onClick={() => handleDeleteUser(user)}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminDashboardPage;

