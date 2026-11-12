
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Users,
  MapPin,
  Mail,
  FileText,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import {
  getJobApplicants,
  updateApplicationStatus,
} from "../api/applicationsApi";
import "./RecruiterApplicants.css";

const statuses = [
  "under_review",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
];

function RecruiterApplicants() {
  const { jobId } = useParams();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadApplicants = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getJobApplicants(jobId);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load applicants."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [jobId]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      setUpdatingId(applicationId);
      setMessage("");

      await updateApplicationStatus(
        applicationId,
        status,
        "Application status updated by recruiter."
      );

      setMessage("Application status updated successfully.");
      await loadApplicants();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="recruiter-applicants-message">
        Loading applicants...
      </div>
    );
  }

  return (
    <main className="recruiter-applicants-page">
      <header className="recruiter-applicants-header">
        <div>
          <span className="recruiter-page-label">
            RECRUITER DASHBOARD
          </span>
          <h1>Job Applicants</h1>
          <p>Review candidates and manage their applications.</p>
        </div>

        <button
          className="applicants-refresh"
          onClick={loadApplicants}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="applicants-error">{error}</div>
      )}

      {message && (
        <div className="applicants-success">
          <CheckCircle size={17} />
          {message}
        </div>
      )}

      <div className="applicants-summary">
        <Users size={22} />
        <div>
          <strong>{applicants.length}</strong>
          <span>Total Applicants</span>
        </div>
      </div>

      {!error && applicants.length === 0 && (
        <div className="no-applicants">
          <Users size={42} />
          <h2>No applicants yet</h2>
          <p>Applications for this job will appear here.</p>
        </div>
      )}

      <section className="recruiter-applicants-list">
        {applicants.map((applicant) => (
          <article
            className="recruiter-applicant-card"
            key={applicant.id}
          >
            <div className="applicant-card-header">
              <div className="applicant-avatar">
                {(applicant.candidate_name || "C")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="applicant-heading">
                <h2>
                  {applicant.candidate_name || "Candidate"}
                </h2>
                <span>
                  {applicant.status?.replaceAll("_", " ")}
                </span>
              </div>
            </div>

            <div className="applicant-details">
              <p>
                <Mail size={16} />
                {applicant.candidate_email}
              </p>

              <p>
                <MapPin size={16} />
                {applicant.candidate_location || "Location not provided"}
              </p>

              <p>
                <FileText size={16} />
                {applicant.resume_filename || "No resume attached"}
              </p>
            </div>

            {applicant.cover_letter && (
              <div className="applicant-cover-letter">
                <strong>Cover Letter</strong>
                <p>{applicant.cover_letter}</p>
              </div>
            )}

            <div className="applicant-status-control">
              <label htmlFor={`status-${applicant.id}`}>
                Update application status
              </label>

              <select
                id={`status-${applicant.id}`}
                value={applicant.status}
                disabled={updatingId === applicant.id}
                onChange={(event) =>
                  handleStatusChange(
                    applicant.id,
                    event.target.value
                  )
                }
              >
                <option value="applied">Applied</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              {updatingId === applicant.id && (
                <span>Updating...</span>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default RecruiterApplicants;
