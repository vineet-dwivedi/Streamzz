import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authApi } from "@/features/auth/api/authApi";
import { clearError, selectAuth, setCredentials, setError, setLoading } from "@/features/auth/model/authSlice";

const getErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

function SignupForm({ onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
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

    if (form.password !== form.confirmPassword) {
      dispatch(setError("Password and confirm password must match"));
      return;
    }

    dispatch(setLoading("loading"));

    try {
      const response = await authApi.signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const { token, user } = response.data || {};

      if (!token || !user) {
        throw new Error("Invalid response from signup API");
      }

      dispatch(setCredentials({ token, user }));
      dispatch(setLoading("succeeded"));

      if (onSuccess) {
        onSuccess(user);
      }
    } catch (apiError) {
      dispatch(setLoading("failed"));
      dispatch(setError(getErrorMessage(apiError, "Signup failed")));
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label className="auth-label" htmlFor="signup-name">
          Full Name
        </label>
        <input
          id="signup-name"
          className="auth-input"
          name="name"
          type="text"
          placeholder="Your full name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
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
        <label className="auth-label" htmlFor="signup-password">
          Password
        </label>
        <input
          id="signup-password"
          className="auth-input"
          name="password"
          type="password"
          placeholder="Create password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="signup-confirm-password">
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          className="auth-input"
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}

export default SignupForm;
