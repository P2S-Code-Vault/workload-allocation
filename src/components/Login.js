import React, { useState } from "react";
import { UserService } from "../services/UserService";
import headerLogo from "../P2S_Legence_Logo_White.png";
import "./Login.css";

const Login = ({ onLogin }) => {
  // Define state variables
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Call the login service
      const userData = await UserService.login(email);

      // Call the parent component's onLogin function with all required data
      onLogin(userData.name, email, userData.scheduled_hours || 40);
    } catch (err) {
      // Handle login error
      console.error("Login failed:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <header className="header">
        <img src={headerLogo} alt="Logo" className="header-logo" />
        <h1 className="header-title">Workload Projection</h1>
      </header>

      <main className="main-content">
        <div className="login-container">
          <div className="login-card">
            <h2>Login</h2>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email-input">Email</label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-left">
          <div className="tooltip-container">
            <span className="footer-text">About</span>
            <div className="tooltip">
              Our P2S Workload Projection app was developed by Anvit Patil, Nilay Nagar, Chad
              Peterson, and Jonathan Herrera.
            </div>
          </div>
        </div>

        <div className="footer-right">
          <a
            href="https://www.p2sinc.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.p2sinc.com
          </a>
          <span> | © {new Date().getFullYear()} P2S All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
