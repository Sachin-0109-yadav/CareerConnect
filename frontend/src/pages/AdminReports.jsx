
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  getAdminReports,
  getAdminReportSummary,
  updateAdminReportStatus,
} from "../api/adminReportsApi";

import "./AdminReports.css";

const STATUSES = [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
];

function formatStatus(status = "") {
  return status.replaceAll("_", " ");
}

function getReportArray(data) {
  if (Array.isArray(data)) return data;
  return data?.items || data?.reports || data?.results || [];
}

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { limit: 100, offset: 0 };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const [reportsData, summaryData] = await Promise.all([
        getAdminReports(params),
        getAdminReportSummary(),
      ]);

      setReports(getReportArray(reportsData));
      setSummary(summaryData || {});
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (reportId, status) => {
    setUpdatingId(reportId);
    setError("");

    try {
      await updateAdminReportStatus(reportId, status);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update report status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = [
    {
      label: "Total Reports",
      value: summary.total ?? summary.total_reports ?? 0,
      icon: FileText,
      color: "blue",
    },
    {
      label: "Pending",
      value: summary.pending ?? 0,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Under Review",
      value: summary.under_review ?? 0,
      icon: AlertCircle,
      color: "purple",
    },
    {
      label: "Resolved",
      value: summary.resolved ?? 0,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Dismissed",
      value: summary.dismissed ?? 0,
      icon: XCircle,
      color: "red",
    },
  ];

  return (
    <main className="admin-reports-page">
      <header className="admin-reports-header">
        <div>
          <span className="admin-eyebrow">
            <ShieldCheck size={15} /> ADMINISTRATION
          </span>
          <h1>Job Reports</h1>
          <p>Review reported jobs and manage moderation decisions.</p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="admin-report-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="admin-stat-card" key={stat.label}>
              <div className={`admin-stat-icon ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-reports-panel">
        <div className="admin-reports-toolbar">
          <div>
            <h2>Reported Jobs</h2>
            <p>Investigate reports submitted by users.</p>
          </div>

          <div className="admin-report-filters">
            <div className="admin-search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search reports..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option value={status} key={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="admin-error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-reports-message">
            <RefreshCw className="admin-spin" size={22} />
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="admin-reports-message">
            <FileText size={30} />
            <h3>No reports found</h3>
            <p>There are no reports matching your filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-reports-table">
              <thead>
                <tr>
                  <th>Reported Job</th>
                  <th>Reported By</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => {
                  const job = report.job || {};
                  const reporter = report.reported_by_user || {};

                  return (
                    <tr key={report.id}>
                      <td>
                        <strong>
                          {job.title || report.job_title || "Job unavailable"}
                        </strong>
                        <small>
                          {job.company?.name || report.company_name || "—"}
                        </small>
                      </td>

                      <td>
                        {reporter.full_name ||
                          reporter.name ||
                          reporter.email ||
                          report.reported_by_email ||
                          "—"}
                      </td>

                      <td>
                        <span className="admin-reason">
                          {report.reason || "Not specified"}
                        </span>
                        {report.description && (
                          <small className="admin-report-description">
                            {report.description}
                          </small>
                        )}
                      </td>

                      <td>
                        {report.created_at
                          ? new Date(report.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge ${report.status}`}
                        >
                          {formatStatus(report.status)}
                        </span>
                      </td>

                      <td>
                        <select
                          value={report.status || "pending"}
                          disabled={updatingId === report.id}
                          onChange={(event) =>
                            handleStatusChange(
                              report.id,
                              event.target.value
                            )
                          }
                        >
                          {STATUSES.map((status) => (
                            <option value={status} key={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>

                        {updatingId === report.id && (
                          <small>Updating...</small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminReports;
