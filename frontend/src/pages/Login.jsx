
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(formData);
      const role = response.user.role?.toLowerCase();

      if (role === "candidate") {
        navigate("/candidate/profile");
      } else if (role === "recruiter") {
        navigate("/recruiter/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background-shape login-shape-one" />
      <div className="login-background-shape login-shape-two" />

      <Link to="/" className="login-brand">
        <span className="login-brand-icon">
          <BriefcaseBusiness size={23} />
        </span>
        <span>CareerConnect</span>
      </Link>

      <section className="login-container">
        <div className="login-card">
          <div className="login-card-heading">
            <span className="login-welcome-icon">
              <Lock size={23} />
            </span>

            <span className="login-eyebrow">
              WELCOME BACK
            </span>

            <h1>Welcome Back</h1>
            <p>
              Login to your CareerConnect account.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="login-input-wrapper">
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">
                <Lock size={19} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login to Account"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="login-register-link">
            Don't have an account?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </div>
        </div>

        <Link to="/" className="login-back-link">
          ← Back to Home
        </Link>

        <p className="login-footer">
          © {new Date().getFullYear()} CareerConnect. All rights reserved.
        </p>
      </section>
    </main>
  );
}

export default Login;
