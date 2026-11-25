
import React, { useState } from "react";
import "./Auth.css";
import { register } from "../services/authService";

function Signup({ onSwitch }) {
  const [formData, setFormData] = useState({
    name: "",
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      setMessage("Account created successfully! Please login.");
      setFormData({
        name: "",
        email: "",
        password: ""
      });
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Find<span>It.</span></h1>
        <h2>Create Account</h2>
        <p>Join FindIt and help reunite lost belongings.</p>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

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
            placeholder="Password (minimum 8 characters)"
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            maxLength={72}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && <p className="auth-message" role="alert">{message}</p>}

        <p className="auth-switch">
          Already have an account?
          <button type="button" onClick={onSwitch}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
