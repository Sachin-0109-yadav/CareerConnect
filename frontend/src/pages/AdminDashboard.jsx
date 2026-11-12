
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  BriefcaseBusiness,
  FileText,
  ShieldAlert,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { getAdminDashboardStats } from "../api/adminApi";
import "./AdminDashboard.css";

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        <Icon size={23} />
      </div>

      <div>
        <p>{title}</p>
        <h2>{value ?? 0}</h2>
        <span>{description}</span>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load admin dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <RefreshCw className="admin-spin" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <p>{error}</p>
        <button onClick={loadDashboard}>Try Again</button>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.users?.total,
      icon: Users,
      description: `${stats?.users?.active ?? 0} active accounts`,
    },
    {
      title: "Companies",
      value: stats?.companies?.total,
      icon: Building2,
      description: `${stats?.companies?.verified ?? 0} verified`,
    },
    {
      title: "Total Jobs",
      value: stats?.jobs?.total,
      icon: BriefcaseBusiness,
      description: `${stats?.jobs?.by_status?.published ?? 0} published`,
    },
    {
      title: "Applications",
      value: stats?.applications?.total,
      icon: FileText,
      description: "Platform applications",
    },
    {
      title: "Job Reports",
      value: stats?.reports?.total,
      icon: ShieldAlert,
      description: `${stats?.reports?.pending ?? 0} pending review`,
    },
    {
      title: "Pending Companies",
      value: stats?.companies?.pending,
      icon: Clock,
      description: "Awaiting verification",
    },
  ];

  const registrations = stats?.registrations_last_7_days ?? [];
  const maxRegistrations = Math.max(
    1,
    ...registrations.map((item) => item.count)
  );

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-eyebrow">CAREERCONNECT ADMIN</span>
          <h1>Dashboard Overview</h1>
          <p>Monitor and manage your recruitment platform.</p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadDashboard}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="admin-stats-grid">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-panel">
          <h2>Platform Overview</h2>

          <div className="admin-overview-row">
            <span><Users size={17} /> Candidates</span>
            <strong>{stats?.users?.candidates ?? 0}</strong>
          </div>

          <div className="admin-overview-row">
            <span><BriefcaseBusiness size={17} /> Recruiters</span>
            <strong>{stats?.users?.recruiters ?? 0}</strong>
          </div>

          <div className="admin-overview-row">
            <span><CheckCircle size={17} /> Verified Companies</span>
            <strong>{stats?.companies?.verified ?? 0}</strong>
          </div>

          <div className="admin-overview-row">
            <span><XCircle size={17} /> Rejected Companies</span>
            <strong>{stats?.companies?.rejected ?? 0}</strong>
          </div>

          <div className="admin-overview-row">
            <span><Clock size={17} /> Inactive Users</span>
            <strong>{stats?.users?.inactive ?? 0}</strong>
          </div>
        </div>

        <div className="admin-panel">
          <h2>Registrations — Last 7 Days</h2>

          {registrations.length === 0 ? (
            <p className="admin-empty">
              No registration activity available yet.
            </p>
          ) : (
            <div className="admin-registration-chart">
              {registrations.map((item) => (
                <div
                  className="admin-chart-column"
                  key={item.date}
                >
                  <strong>{item.count}</strong>

                  <div className="admin-chart-track">
                    <div
                      className="admin-chart-bar"
                      style={{
                        height: `${
                          (item.count / maxRegistrations) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <span>
                    {new Date(item.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="admin-panel admin-quick-actions">
        <h2>Administration</h2>

        <div className="admin-action-links">
          <Link to="/admin/users">
            <Users size={19} />
            Manage Users
            <ArrowRight size={17} />
          </Link>

          <Link to="/admin/companies">
            <Building2 size={19} />
            Verify Companies
            <ArrowRight size={17} />
          </Link>

          <Link to="/admin/jobs">
            <BriefcaseBusiness size={19} />
            Moderate Jobs
            <ArrowRight size={17} />
          </Link>

          <Link to="/admin/reports">
            <ShieldAlert size={19} />
            Review Reports
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
