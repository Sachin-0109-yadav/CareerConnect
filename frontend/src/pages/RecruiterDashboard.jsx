
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  BriefcaseBusiness,
  Users,
  Plus,
  Eye,
  RefreshCw,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  XCircle,
  Trash2,
  Pencil,
} from "lucide-react";

import { getMyCompanies } from "../api/companyApi";
import {
  getCompanyJobs,
  updateJobStatus,
  deleteJob,
} from "../api/jobsApi";
import { getJobApplicants } from "../api/applicationsApi";

import "./RecruiterDashboard.css";

function RecruiterDashboard() {
  const location = useLocation();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.success || "");
  const [processingJob, setProcessingJob] = useState(null);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      setError("");

      const companies = await getMyCompanies();

      if (!companies || companies.length === 0) {
        setCompany(null);
        setJobs([]);
        setApplicantCounts({});
        setError(
          "No company found. Please create or join a company first."
        );
        return;
      }

      const selectedCompany = companies[0];
      setCompany(selectedCompany);

      const companyJobs = await getCompanyJobs(selectedCompany.id);
      const jobList = Array.isArray(companyJobs) ? companyJobs : [];

      setJobs(jobList);

      const countResults = await Promise.all(
        jobList.map(async (job) => {
          try {
            const applicants = await getJobApplicants(job.id);

            const count = Array.isArray(applicants)
              ? applicants.length
              : Array.isArray(applicants?.items)
                ? applicants.items.length
                : null;

            return [job.id, count];
          } catch (err) {
            console.error(
              `Could not load applicants for ${job.title}`,
              err
            );
            return [job.id, null];
          }
        })
      );

      setApplicantCounts(Object.fromEntries(countResults));
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load recruiter dashboard. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (job, newStatus) => {
    const action = newStatus === "published" ? "publish" : "close";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${job.title}"?`
    );

    if (!confirmed) return;

    try {
      setProcessingJob(job.id);
      setError("");
      setSuccess("");

      await updateJobStatus(job.id, newStatus);

      setJobs((currentJobs) =>
        currentJobs.map((item) =>
          item.id === job.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSuccess(
        newStatus === "published"
          ? "Job published successfully."
          : "Job closed successfully."
      );
    } catch (err) {
      console.error("Job status update error:", err);

      setError(
        err.response?.data?.detail ||
          `Unable to ${action} this job. Please try again.`
      );
    } finally {
      setProcessingJob(null);
    }
  };

  const handleDeleteJob = async (job) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${job.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setProcessingJob(job.id);
      setError("");
      setSuccess("");

      await deleteJob(job.id);

      setJobs((currentJobs) =>
        currentJobs.filter((item) => item.id !== job.id)
      );

      setApplicantCounts((currentCounts) => {
        const updated = { ...currentCounts };
        delete updated[job.id];
        return updated;
      });

      setSuccess("Job deleted successfully.");
    } catch (err) {
      console.error("Job deletion error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete this job. Please try again."
      );
    } finally {
      setProcessingJob(null);
    }
  };

  const publishedJobs = jobs.filter(
    (job) => job.status === "published"
  ).length;

  const draftJobs = jobs.filter(
    (job) => job.status === "draft"
  ).length;

  const closedJobs = jobs.filter(
    (job) => job.status === "closed"
  ).length;

  const totalApplicants = Object.values(applicantCounts)
    .filter((count) => count !== null)
    .reduce((total, count) => total + count, 0);

  if (loading) {
    return (
      <div className="recruiter-dashboard-loading">
        <RefreshCw className="spin" size={28} />
        <p>Loading recruiter dashboard...</p>
      </div>
    );
  }

  return (
    <main className="recruiter-dashboard">
      <header className="recruiter-dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            RECRUITER WORKSPACE
          </span>
          <h1>Recruiter Dashboard</h1>
          <p>Manage your jobs and track applicants.</p>
        </div>

        <div className="dashboard-header-actions">
          <button
            className="dashboard-refresh-button"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            to="/recruiter/jobs/new"
            className="dashboard-create-button"
          >
            <Plus size={18} />
            Create Job
          </Link>
        </div>
      </header>

      {success && (
        <div className="dashboard-success">
          <CheckCircle2 size={19} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {company && (
        <>
          <section className="dashboard-company-card">
            <div className="dashboard-company-icon">
              <Building2 size={26} />
            </div>

            <div>
              <span>YOUR COMPANY</span>
              <h2>{company.name}</h2>
              <p>
                {company.industry || "Company"}
                {company.headquarters
                  ? ` · ${company.headquarters}`
                  : ""}
              </p>
            </div>
          </section>

          <section className="dashboard-stats">
            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon purple">
                <BriefcaseBusiness size={22} />
              </div>
              <div>
                <span>Total Jobs</span>
                <strong>{jobs.length}</strong>
              </div>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon green">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <span>Published Jobs</span>
                <strong>{publishedJobs}</strong>
              </div>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon orange">
                <Users size={22} />
              </div>
              <div>
                <span>Total Applicants</span>
                <strong>{totalApplicants}</strong>
              </div>
            </article>
          </section>

          <section className="dashboard-jobs-section">
            <div className="dashboard-section-heading">
              <div>
                <h2>Your Job Listings</h2>
                <p>
                  Manage your company's recruitment activity.
                </p>
              </div>

              <span>{jobs.length} jobs</span>
            </div>

            {jobs.length === 0 ? (
              <div className="dashboard-empty">
                <BriefcaseBusiness size={38} />
                <h3>No jobs posted yet</h3>
                <p>
                  Start hiring by creating your first job listing.
                </p>

                <Link
                  to="/recruiter/jobs/new"
                  className="dashboard-create-button"
                >
                  <Plus size={17} />
                  Create Your First Job
                </Link>
              </div>
            ) : (
              <div className="dashboard-jobs-list">
                {jobs.map((job) => {
                  const isProcessing =
                    processingJob === job.id;

                  return (
                    <article
                      className="dashboard-job-card"
                      key={job.id}
                    >
                      <div className="dashboard-job-main">
                        <h3>{job.title}</h3>

                        <div className="dashboard-job-meta">
                          <span>
                            <MapPin size={15} />
                            {job.location}
                          </span>

                          <span>
                            <BriefcaseBusiness size={15} />
                            {String(job.job_type).replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                          <span>
                            <Clock size={15} />
                            {String(job.experience_level).replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </div>

                        <div className="dashboard-job-footer">
                          <span
                            className={`dashboard-status ${job.status}`}
                          >
                            {String(job.status).replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                          {job.status === "draft" && (
                            <span className="dashboard-draft-note">
                              Not visible in public job search
                            </span>
                          )}

                          <span className="dashboard-applicant-count">
                            <Users size={16} />
                            {applicantCounts[job.id] === null
                              ? "Unavailable"
                              : applicantCounts[job.id] ?? "Loading..."}
                            {" "}applicants
                          </span>
                        </div>
                      </div>

                      <div className="dashboard-job-actions">
                        <Link
                          to={`/recruiter/jobs/${job.id}/applicants`}
                          className="dashboard-applicants-button"
                        >
                          <Eye size={16} />
                          Applicants
                        </Link>

                        <Link
                          to={`/recruiter/jobs/${job.id}/edit`}
                          className="dashboard-action-button edit"
                        >
                          <Pencil size={15} />
                          Edit
                        </Link>

                        {job.status === "draft" && (
                          <button
                            className="dashboard-action-button publish"
                            onClick={() =>
                              handleStatusChange(
                                job,
                                "published"
                              )
                            }
                            disabled={isProcessing}
                          >
                            <Send size={15} />
                            {isProcessing
                              ? "Please wait..."
                              : "Publish"}
                          </button>
                        )}

                        {job.status === "published" && (
                          <button
                            className="dashboard-action-button close"
                            onClick={() =>
                              handleStatusChange(job, "closed")
                            }
                            disabled={isProcessing}
                          >
                            <XCircle size={15} />
                            {isProcessing
                              ? "Please wait..."
                              : "Close"}
                          </button>
                        )}

                        {job.status === "closed" && (
                          <button
                            className="dashboard-action-button publish"
                            onClick={() =>
                              handleStatusChange(
                                job,
                                "published"
                              )
                            }
                            disabled={isProcessing}
                          >
                            <Send size={15} />
                            {isProcessing
                              ? "Please wait..."
                              : "Reopen"}
                          </button>
                        )}

                        <button
                          className="dashboard-action-button delete"
                          onClick={() => handleDeleteJob(job)}
                          disabled={isProcessing}
                        >
                          <Trash2 size={15} />
                          {isProcessing ? "Please wait..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {draftJobs > 0 && (
            <div className="dashboard-draft-summary">
              <AlertCircle size={18} />
              <p>
                You have <strong>{draftJobs}</strong> draft job
                {draftJobs > 1 ? "s" : ""}. Publish them when they
                are ready to appear in public job search.
              </p>
            </div>
          )}

          {closedJobs > 0 && (
            <div className="dashboard-draft-summary">
              <AlertCircle size={18} />
              <p>
                You have <strong>{closedJobs}</strong> closed job
                {closedJobs > 1 ? "s" : ""}.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default RecruiterDashboard;
