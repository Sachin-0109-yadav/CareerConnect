
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Calendar, FileText, RefreshCw } from "lucide-react";
import { getMyApplications } from "../api/applicationsApi";
import "./MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load your applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusClass = (status) =>
    `application-status status-${String(status || "applied").toLowerCase()}`;

  if (loading) {
    return <div className="applications-message">Loading your applications...</div>;
  }

  return (
    <main className="my-applications-page">
      <div className="applications-header">
        <div>
          <h1>My Applications</h1>
          <p>Track and manage your job applications.</p>
        </div>
        <button className="refresh-applications" onClick={loadApplications}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="applications-error">{error}</div>}

      {!error && applications.length === 0 && (
        <div className="empty-applications">
          <Briefcase size={42} />
          <h2>No applications yet</h2>
          <p>Explore jobs and submit your first application.</p>
          <Link to="/jobs" className="browse-jobs-link">Browse Jobs</Link>
        </div>
      )}

      <div className="applications-list">
        {applications.map((application) => (
          <article className="application-card" key={application.id}>
            <div className="application-card-top">
              <div className="application-icon">
                <Briefcase size={22} />
              </div>
              <span className={statusClass(application.status)}>
                {String(application.status || "applied")
                  .replaceAll("_", " ")}
              </span>
            </div>

            <h2>{application.job_title}</h2>
            <h3>{application.company_name}</h3>

            <div className="application-meta">
              <span><MapPin size={15} /> {application.job_location || "Location not specified"}</span>
              <span><Calendar size={15} /> Applied: {formatDate(application.applied_at)}</span>
            </div>

            <div className="application-card-footer">
              <span><FileText size={15} /> Application submitted</span>
              <Link to={`/jobs/${application.job_id}`}>View Job</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default MyApplications;
