
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../components/Profile.css";
import {
  getCandidateProfile,
  updateCandidateProfile,
} from "../api/profileApi";


function CandidateProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    phone: "",
    location: "",
    bio: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };


  // Load candidate profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCandidateProfile();

        setFormData({
          full_name: profile.full_name || "",
          headline: profile.headline || "",
          phone: profile.phone || "",
          location: profile.location || "",
          bio: profile.bio || "",
          linkedin_url: profile.linkedin_url || "",
          github_url: profile.github_url || "",
          portfolio_url: profile.portfolio_url || "",
        });

      } catch (err) {
        if (err.response?.status !== 404) {
          setError(
            err.response?.data?.detail ||
              "Unable to load your profile."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);


  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // Save candidate profile
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateCandidateProfile(formData);

      setMessage("Profile updated successfully!");

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <p>Loading your profile...</p>;
  }


  return (
    <div className="candidate-profile-page">

      {/* Navigation Bar */}
      <header className="profile-navbar">

        <h2 className="brand">
          <Link to="/">
            CareerConnect
          </Link>
        </h2>

        <nav className="profile-nav-links">

          <Link to="/">
            Home
          </Link>

          <span className="user-email">
            {user?.email}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>

        </nav>

      </header>


      {/* Profile Content */}
      <main className="profile-container">

        <div className="profile-heading">
          <h1>My Candidate Profile</h1>

          <p>
            Manage your professional information and
            help recruiters discover your profile.
          </p>
        </div>


        {/* Success and Error Messages */}
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}


        {/* Candidate Profile Form */}
        <form
          onSubmit={handleSubmit}
          className="profile-form"
        >

          <label>
            Full Name

            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              maxLength={150}
              placeholder="Enter your full name"
            />
          </label>


          <label>
            Professional Headline

            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g. Python Developer"
            />
          </label>


          <label>
            Phone Number

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={20}
              placeholder="Enter your phone number"
            />
          </label>


          <label>
            Location

            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              maxLength={150}
              placeholder="City, State"
            />
          </label>


          <label>
            About Me

            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write a short professional introduction"
              rows={5}
            />
          </label>


          <label>
            LinkedIn URL

            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              maxLength={500}
              placeholder="https://linkedin.com/in/..."
            />
          </label>


          <label>
            GitHub URL

            <input
              type="url"
              name="github_url"
              value={formData.github_url}
              onChange={handleChange}
              maxLength={500}
              placeholder="https://github.com/..."
            />
          </label>


          <label>
            Portfolio URL

            <input
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              maxLength={500}
              placeholder="https://yourportfolio.com"
            />
          </label>


          <button
            type="submit"
            disabled={saving}
            className="save-profile-button"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

        </form>

      </main>

    </div>
  );
}

export default CandidateProfile;
