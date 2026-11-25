
import React, { useState } from "react";
import "./Auth.css";
import { login } from "../services/authService";

function Login({ onSwitch, onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (!data.token || !data.user) {
        throw new Error("The server did not return a valid login session.");
      }
      onLogin(data.token, data.user);
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Find<span>It.</span></h1>
        <h2>Welcome Back!</h2>
        <p>Login to continue to FindIt.</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p className="auth-message" role="alert">{message}</p>}

        <p className="auth-switch">
          Don't have an account?
          <button type="button" onClick={onSwitch}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
