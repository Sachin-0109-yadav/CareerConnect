
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Globe,
} from "lucide-react";

import {
  getAdminCompanies,
  updateCompanyVerification,
} from "../api/adminApi";

import "./AdminCompanies.css";

function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        limit: 100,
        offset: 0,
      };

      if (search.trim()) params.search = search.trim();
      if (status) params.verification_status = status;

      const response = await getAdminCompanies(params);

      const list = Array.isArray(response)
        ? response
        : response.items ||
          response.companies ||
          response.results ||
          [];

      setCompanies(list);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load companies."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies, refreshKey]);

  const handleVerification = async (company, newStatus) => {
    const action = newStatus === "verified" ? "verify" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${company.name}?`
      )
    ) {
      return;
    }

    setUpdatingId(company.id);
    setError("");

    try {
      await updateCompanyVerification(company.id, newStatus);

      setCompanies((previous) =>
        previous.map((item) =>
          item.id === company.id
            ? { ...item, verification_status: newStatus }
            : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update company verification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = companies.filter(
    (company) => company.verification_status === "pending"
  ).length;

  const verified = companies.filter(
    (company) => company.verification_status === "verified"
  ).length;

  const rejected = companies.filter(
    (company) => company.verification_status === "rejected"
  ).length;

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusLabel = (value) => {
    if (!value) return "Unknown";
    return value.replaceAll("_", " ");
  };

  return (
    <div className="admin-companies-page">
      <header className="admin-companies-header">
        <div>
          <span className="admin-company-eyebrow">
            ADMINISTRATION
          </span>
          <h1>Company Management</h1>
          <p>
            Review company registrations and manage verification.
          </p>
        </div>

        <button
          className="admin-company-refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="admin-company-stats">
        <div className="admin-company-stat">
          <Building2 />
          <div>
            <span>Companies loaded</span>
            <strong>{companies.length}</strong>
          </div>
        </div>

        <div className="admin-company-stat">
          <Clock />
          <div>
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
        </div>

        <div className="admin-company-stat">
          <CheckCircle />
          <div>
            <span>Verified</span>
            <strong>{verified}</strong>
          </div>
        </div>

        <div className="admin-company-stat">
          <XCircle />
          <div>
            <span>Rejected</span>
            <strong>{rejected}</strong>
          </div>
        </div>
      </section>

      <section className="admin-company-toolbar">
        <div className="admin-company-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search company name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All verification statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </section>

      {error && (
        <div className="admin-company-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="admin-company-table-card">
        <div className="admin-company-table-heading">
          <div>
            <h2>Registered Companies</h2>
            <p>Review and manage company verification requests.</p>
          </div>
          <span>{companies.length} loaded</span>
        </div>

        {loading ? (
          <div className="admin-company-empty">
            <RefreshCw className="admin-company-spin" />
            <p>Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="admin-company-empty">
            <Building2 size={36} />
            <h3>No companies found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="admin-company-table-scroll">
            <table className="admin-company-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Website</th>
                  <th>Registered</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="admin-company-identity">
                        <div className="admin-company-avatar">
                          {company.name?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div>
                          <strong>{company.name || "Unnamed company"}</strong>
                          <small>{company.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>{company.industry || "—"}</td>

                    <td>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Globe size={14} />
                          Visit
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>{formatDate(company.created_at)}</td>

                    <td>
                      <span
                        className={`admin-company-status ${company.verification_status || "unknown"}`}
                      >
                        {statusLabel(company.verification_status)}
                      </span>
                    </td>

                    <td>
                      <div className="admin-company-actions">
                        <button
                          className="admin-company-verify"
                          disabled={
                            updatingId === company.id ||
                            company.verification_status === "verified"
                          }
                          onClick={() =>
                            handleVerification(company, "verified")
                          }
                        >
                          {updatingId === company.id
                            ? "Updating..."
                            : "Verify"}
                        </button>

                        <button
                          className="admin-company-reject"
                          disabled={
                            updatingId === company.id ||
                            company.verification_status === "rejected"
                          }
                          onClick={() =>
                            handleVerification(company, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminCompanies;
