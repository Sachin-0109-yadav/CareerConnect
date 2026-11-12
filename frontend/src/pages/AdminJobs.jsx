
import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  MapPin,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import {
  getAdminJobs,
  updateJobModeration,
} from "../api/adminApi";

import "./AdminJobs.css";

const STATUSES = ["draft", "published", "closed", "archived"];

function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        limit: 100,
        offset: 0,
      };

      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const response = await getAdminJobs(params);

      const list = Array.isArray(response)
        ? response
        : response.items ||
          response.jobs ||
          response.results ||
          [];

      setJobs(list);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs, refreshKey]);

  const handleModeration = async (job, newStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to change "${job.title}" to ${newStatus}?`
    );

    if (!confirmed) return;

    setUpdatingId(job.id);
    setError("");

    try {
      await updateJobModeration(job.id, newStatus);

      setJobs((previous) =>
        previous.map((item) =>
          item.id === job.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update job moderation status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    total: jobs.length,
    draft: jobs.filter((job) => job.status === "draft").length,
    published: jobs.filter((job) => job.status === "published").length,
    closed: jobs.filter((job) => job.status === "closed").length,
    archived: jobs.filter((job) => job.status === "archived").length,
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const companyName = (job) =>
    job.company?.name ||
    job.company_name ||
    "Company not available";

  return (
    <div className="admin-jobs-page">
      <header className="admin-jobs-header">
        <div>
          <span className="admin-jobs-eyebrow">
            ADMINISTRATION
          </span>
          <h1>Job Moderation</h1>
          <p>
            Review job listings and manage their publication status.
          </p>
        </div>

        <button
          className="admin-jobs-refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="admin-jobs-stats">
        {[
          ["Total loaded", counts.total],
          ["Draft", counts.draft],
          ["Published", counts.published],
          ["Closed", counts.closed],
          ["Archived", counts.archived],
        ].map(([label, value]) => (
          <div className="admin-jobs-stat" key={label}>
            <BriefcaseBusiness size={21} />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-jobs-toolbar">
        <div className="admin-jobs-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search job title or keyword..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All job statuses</option>
          {STATUSES.map((item) => (
            <option value={item} key={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="admin-jobs-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="admin-jobs-table-card">
        <div className="admin-jobs-table-heading">
          <div>
            <h2>Platform Job Listings</h2>
            <p>Moderate jobs posted by registered companies.</p>
          </div>
          <span>{jobs.length} loaded</span>
        </div>

        {loading ? (
          <div className="admin-jobs-empty">
            <RefreshCw className="admin-jobs-spin" />
            <p>Loading job listings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="admin-jobs-empty">
            <BriefcaseBusiness size={36} />
            <h3>No jobs found</h3>
            <p>Try changing your search or status filter.</p>
          </div>
        ) : (
          <div className="admin-jobs-table-scroll">
            <table className="admin-jobs-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th>Moderation</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="admin-job-title">
                        <strong>{job.title}</strong>
                        <small>
                          {job.job_type?.replaceAll("_", " ") || "—"}
                          {" · "}
                          {job.experience_level?.replaceAll("_", " ") || "—"}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span className="admin-job-company">
                        <Building2 size={15} />
                        {companyName(job)}
                      </span>
                    </td>

                    <td>
                      <span className="admin-job-location">
                        <MapPin size={14} />
                        {job.location || job.city || "Not specified"}
                      </span>
                    </td>

                    <td>
                      <span className="admin-job-date">
                        <CalendarDays size={14} />
                        {formatDate(job.created_at)}
                      </span>
                    </td>

                    <td>
                      <span className={`admin-job-status ${job.status || "unknown"}`}>
                        {job.status || "Unknown"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-job-actions">
                        {job.status !== "published" && (
                          <button
                            className="admin-job-publish"
                            disabled={updatingId === job.id}
                            onClick={() =>
                              handleModeration(job, "published")
                            }
                          >
                            {updatingId === job.id
                              ? "Updating..."
                              : "Publish"}
                          </button>
                        )}

                        {job.status !== "closed" && (
                          <button
                            className="admin-job-close"
                            disabled={updatingId === job.id}
                            onClick={() =>
                              handleModeration(job, "closed")
                            }
                          >
                            Close
                          </button>
                        )}

                        {job.status !== "archived" && (
                          <button
                            className="admin-job-archive"
                            disabled={updatingId === job.id}
                            onClick={() =>
                              handleModeration(job, "archived")
                            }
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="admin-jobs-note">
        <ShieldCheck size={17} />
        Publishing is subject to backend company verification and job expiry checks.
      </div>
    </div>
  );
}

export default AdminJobs;
