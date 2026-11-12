
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  Building2,
  Globe,
  Users,
  CalendarDays,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
} from "lucide-react";

import { getJobDetails } from "../api/jobsApi";
import { applyForJob } from "../api/applicationsApi";
import { useAuth } from "../context/AuthContext";
import "./JobDetails.css";

function formatLabel(value) {
  if (!value) return "Not specified";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not specified";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isCandidate } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getJobDetails(jobId);
      setJob(data);
    } catch (err) {
      console.error("Job details error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load this job. It may no longer be available."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/jobs/${jobId}` },
      });
      return;
    }

    if (!isCandidate) {
      setApplyError(
        "Only candidate accounts can apply for jobs. Please log in with a candidate account."
      );
      return;
    }

    setApplyError("");
    setShowApplyForm(true);
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();

    try {
      setApplying(true);
      setApplyError("");

      await applyForJob(jobId, {
        resume_id: null,
        cover_letter: coverLetter.trim() || null,
      });

      setApplySuccess(true);
      setShowApplyForm(false);
    } catch (err) {
      const message = err.response?.data?.detail;

      if (err.response?.status === 409) {
        setApplyError("You have already applied for this job.");
      } else if (err.response?.status === 400) {
        setApplyError(
          message || "Please complete your candidate profile before applying."
        );
      } else if (err.response?.status === 401) {
        setApplyError("Your session has expired. Please log in again.");
      } else {
        setApplyError(
          message || "Unable to submit your application. Please try again."
        );
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <main className="detail-state">
        <div className="detail-loader" />
        <p>Loading job details...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="detail-state">
        <AlertCircle size={42} />
        <h2>Job unavailable</h2>
        <p>{error || "This job could not be found."}</p>
        <div className="detail-state-actions">
          <button onClick={loadJob}>Try again</button>
          <Link to="/jobs">Browse jobs</Link>
        </div>
      </main>
    );
  }

  const company = job.company || {};

  const salary =
    job.min_salary != null || job.max_salary != null
      ? `${job.min_salary != null ? Number(job.min_salary).toLocaleString("en-IN") : "Not specified"} - ${job.max_salary != null ? Number(job.max_salary).toLocaleString("en-IN") : "Not specified"} ${job.currency || "INR"}`
      : "Salary not disclosed";

  return (
    <main className="job-detail-page">
      <header className="detail-header">
        <Link to="/" className="detail-brand">
          Career<span>Connect</span>
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/jobs">Browse Jobs</Link>

          {isAuthenticated ? (
            <span>{user?.email}</span>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>

      <div className="detail-container">
        <Link to="/jobs" className="detail-back">
          <ArrowLeft size={17} />
          Back to jobs
        </Link>

        <section className="detail-hero">
          <div className="detail-company-logo">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.name || "Company"} logo`}
              />
            ) : (
              <Building2 size={32} />
            )}
          </div>

          <div className="detail-title-area">
            {job.is_featured && (
              <span className="detail-featured">Featured opportunity</span>
            )}

            <h1>{job.title}</h1>

            <p className="detail-company-name">
              {company.name || "Company"}
            </p>

            <div className="detail-quick-meta">
              <span><MapPin size={16} /> {job.location || "Location not specified"}</span>
              <span><Briefcase size={16} /> {formatLabel(job.job_type)}</span>
              <span><Clock size={16} /> {formatLabel(job.experience_level)}</span>
            </div>
          </div>
        </section>

        {applySuccess && (
          <div className="application-success">
            <CheckCircle2 size={22} />
            <div>
              <strong>Application submitted successfully!</strong>
              <p>Your application has been sent to the recruiter.</p>
              <Link to="/candidate/applications">View my applications</Link>
            </div>
          </div>
        )}

        {applyError && (
          <div className="application-error">
            <AlertCircle size={20} />
            <span>{applyError}</span>
            <button
              type="button"
              onClick={() => setApplyError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {showApplyForm && (
          <section className="application-form-card">
            <div className="application-form-heading">
              <div>
                <h2>Apply for this position</h2>
                <p>{job.title} at {company.name || "Company"}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                aria-label="Close application form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleApplicationSubmit}>
              <label htmlFor="coverLetter">Cover letter (optional)</label>

              <textarea
                id="coverLetter"
                rows="6"
                maxLength="10000"
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                placeholder="Introduce yourself and explain why you are interested in this role..."
              />

              <div className="application-form-footer">
                <span>{coverLetter.length}/10000 characters</span>

                <button type="submit" disabled={applying}>
                  <Send size={17} />
                  {applying ? "Submitting..." : "Submit application"}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="detail-layout">
          <div className="detail-main">
            <section className="detail-card">
              <h2>Job overview</h2>

              <div className="detail-overview-grid">
                <div>
                  <IndianRupee size={20} />
                  <span>Salary</span>
                  <strong>{salary}</strong>
                </div>

                <div>
                  <Briefcase size={20} />
                  <span>Work mode</span>
                  <strong>{formatLabel(job.work_mode)}</strong>
                </div>

                <div>
                  <Users size={20} />
                  <span>Openings</span>
                  <strong>{job.openings}</strong>
                </div>

                <div>
                  <CalendarDays size={20} />
                  <span>Published</span>
                  <strong>{formatDate(job.published_at)}</strong>
                </div>
              </div>
            </section>

            <section className="detail-card">
              <h2>About this role</h2>
              <p className="detail-description">{job.description}</p>
            </section>

            {job.responsibilities && (
              <section className="detail-card">
                <h2>Responsibilities</h2>
                <p className="detail-description">{job.responsibilities}</p>
              </section>
            )}

            {job.requirements && (
              <section className="detail-card">
                <h2>Requirements</h2>
                <p className="detail-description">{job.requirements}</p>
              </section>
            )}

            <section className="detail-card">
              <h2>Required skills</h2>

              {job.skills?.length > 0 ? (
                <div className="detail-skills">
                  {job.skills.map((skill) => (
                    <span key={skill.id}>{skill.name}</span>
                  ))}
                </div>
              ) : (
                <p className="detail-muted">
                  No specific skills listed.
                </p>
              )}
            </section>
          </div>

          <aside className="detail-sidebar">
            <section className="detail-card company-card">
              <h2>About the company</h2>

              <div className="company-heading">
                <div className="company-small-logo">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="" />
                  ) : (
                    <Building2 size={24} />
                  )}
                </div>
                <strong>{company.name || "Company"}</strong>
              </div>

              {company.description && (
                <p className="company-description">
                  {company.description}
                </p>
              )}

              {company.industry && (
                <p className="company-info">
                  <Building2 size={16} />
                  {company.industry}
                </p>
              )}

              {company.company_size && (
                <p className="company-info">
                  <Users size={16} />
                  {company.company_size}
                </p>
              )}

              {company.headquarters && (
                <p className="company-info">
                  <MapPin size={16} />
                  {company.headquarters}
                </p>
              )}

              {company.website && (
                <a
                  className="company-website"
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit company website
                  <ExternalLink size={15} />
                </a>
              )}

              {company.website && (
                <p className="company-website-icon">
                  <Globe size={15} /> Official website
                </p>
              )}
            </section>

            <section className="detail-card">
              <h2>Job information</h2>

              <div className="detail-information">
                <span>Job type</span>
                <strong>{formatLabel(job.job_type)}</strong>

                <span>Experience</span>
                <strong>{formatLabel(job.experience_level)}</strong>

                <span>Work arrangement</span>
                <strong>{formatLabel(job.work_mode)}</strong>

                <span>Last date</span>
                <strong>{formatDate(job.expires_at)}</strong>
              </div>
            </section>

            {applySuccess ? (
              <button className="detail-apply-button" disabled>
                <CheckCircle2 size={18} />
                Application submitted
              </button>
            ) : (
              <button
                type="button"
                className="detail-apply-button"
                onClick={handleApplyClick}
              >
                Apply Now
              </button>
            )}

            {!isAuthenticated && (
              <p className="detail-muted">
                Log in or create a candidate account to apply.
              </p>
            )}

            {isAuthenticated && !isCandidate && (
              <p className="detail-muted">
                Recruiter accounts cannot apply for jobs.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default JobDetails;
