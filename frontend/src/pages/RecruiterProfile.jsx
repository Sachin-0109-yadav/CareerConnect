
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../components/Profile.css";
import {
  getRecruiterProfile,
  updateRecruiterProfile,
} from "../api/profileApi";


function RecruiterProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    phone: "",
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


  // Load recruiter profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getRecruiterProfile();

        setFormData({
          full_name: profile.full_name || "",
          job_title: profile.job_title || "",
          phone: profile.phone || "",
        });

      } catch (err) {
        if (err.response?.status !== 404) {
          setError(
            err.response?.data?.detail ||
              "Unable to load your recruiter profile."
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


  // Save recruiter profile
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateRecruiterProfile(formData);

      setMessage("Recruiter profile updated successfully!");

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update your recruiter profile."
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <p>Loading your recruiter profile...</p>;
  }


  return (
    <div className="recruiter-profile-page">

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


      {/* Recruiter Profile Content */}
      <main className="profile-container">

        <div className="profile-heading">
          <h1>Recruiter Profile</h1>

          <p>
            Manage your professional recruiter information.
          </p>
        </div>


        {/* Messages */}
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


        {/* Recruiter Form */}
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
            Job Title

            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              maxLength={150}
              placeholder="e.g. Talent Acquisition Specialist"
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

export default RecruiterProfile;
