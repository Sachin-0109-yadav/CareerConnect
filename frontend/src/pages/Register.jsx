
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "candidate",
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
      const response = await register(formData);
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
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-background-shape register-shape-one" />
      <div className="register-background-shape register-shape-two" />

      <Link to="/" className="register-brand">
        <span className="register-brand-icon">
          <BriefcaseBusiness size={23} />
        </span>
        <span>CareerConnect</span>
      </Link>

      <section className="register-container">
        <div className="register-card">
          <div className="register-card-heading">
            <span className="register-welcome-icon">
              <UserRound size={24} />
            </span>

            <span className="register-eyebrow">
              GET STARTED TODAY
            </span>

            <h1>Create Your Account</h1>
            <p>Join CareerConnect and discover new opportunities.</p>
          </div>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="register-input-wrapper">
                <Mail size={19} />

                <input
                  id="register-email"
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

            <div className="register-field">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="register-input-wrapper">
                <Lock size={19} />

                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
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

              <span className="register-hint">
                Use at least 8 characters.
              </span>
            </div>

            <div className="register-field">
              <label htmlFor="register-role">
                Account Type
              </label>

              <div className="register-input-wrapper">
                <UserRound size={19} />

                <select
                  id="register-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="candidate">
                    Candidate — Looking for a job
                  </option>

                  <option value="recruiter">
                    Recruiter — Hiring candidates
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="register-login-link">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </div>
        </div>

        <Link to="/" className="register-back-link">
          ← Back to Home
        </Link>

        <p className="register-footer">
          © {new Date().getFullYear()} CareerConnect. All rights reserved.
        </p>
      </section>
    </main>
  );
}

export default Register;
