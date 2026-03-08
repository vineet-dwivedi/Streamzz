import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authApi } from "@/features/auth/api/authApi";
import { clearError, selectAuth, setCredentials, setError, setLoading } from "@/features/auth/model/authSlice";

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

function LoginForm({ onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const { status, error } = useSelector(selectAuth);
  const isSubmitting = status === "loading";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearError());
    dispatch(setLoading("loading"));

    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });
      const { token, user } = response.data || {};

      if (!token || !user) {
        throw new Error("Invalid response from login API");
      }

      dispatch(setCredentials({ token, user }));
      dispatch(setLoading("succeeded"));

      if (onSuccess) {
        onSuccess(user);
      }
    } catch (apiError) {
      dispatch(setLoading("failed"));
      dispatch(setError(getErrorMessage(apiError, "Login failed")));
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label className="auth-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="auth-input"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="auth-input"
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </div>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing In..." : "Enter Portal"}
      </button>
    </form>
  );
}

export default LoginForm;
