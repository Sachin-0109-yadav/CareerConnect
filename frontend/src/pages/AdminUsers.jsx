
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import {
  getAdminUsers,
  updateAdminUserStatus,
} from "../api/adminApi";

import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        limit: 100,
        offset: 0,
      };

      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (status !== "") params.is_active = status === "active";

      const response = await getAdminUsers(params);

      const userList = Array.isArray(response)
        ? response
        : response.items ||
          response.users ||
          response.results ||
          [];

      setUsers(userList);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  const handleStatusChange = async (user) => {
    const userId = user.id;
    const newStatus = !user.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        newStatus ? "activate" : "deactivate"
      } this account?`
    );

    if (!confirmed) return;

    setUpdatingId(userId);
    setError("");

    try {
      await updateAdminUserStatus(userId, newStatus);

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.id === userId
            ? { ...item, is_active: newStatus }
            : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update this user's status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;

  const getDisplayName = (user) => {
    if (user.full_name) return user.full_name;

    const name = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");

    return name || user.name || "Not provided";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <span className="admin-eyebrow">ADMINISTRATION</span>
          <h1>User Management</h1>
          <p>Manage registered candidates, recruiters and administrators.</p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="admin-user-stats">
        <div className="admin-user-stat-card">
          <Users size={22} />
          <div>
            <span>Total users loaded</span>
            <strong>{totalUsers}</strong>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <UserCheck size={22} />
          <div>
            <span>Active users</span>
            <strong>{activeUsers}</strong>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <UserX size={22} />
          <div>
            <span>Inactive users</span>
            <strong>{inactiveUsers}</strong>
          </div>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-user-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">All roles</option>
          <option value="candidate">Candidate</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="admin-users-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="admin-users-table-wrapper">
        <div className="admin-users-table-heading">
          <div>
            <h2>Registered Users</h2>
            <p>Review and manage platform accounts.</p>
          </div>
          <span>{totalUsers} users loaded</span>
        </div>

        {loading ? (
          <div className="admin-users-loading">
            <RefreshCw className="admin-spin" size={25} />
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-users-empty">
            <Users size={35} />
            <h3>No users found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="admin-users-table-scroll">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-identity">
                        <div className="admin-user-avatar">
                          {getDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{getDisplayName(user)}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`admin-role-badge ${user.role}`}>
                        {user.role || "Unknown"}
                      </span>
                    </td>

                    <td>{formatDate(user.created_at)}</td>

                    <td>
                      <span
                        className={
                          user.is_verified
                            ? "admin-verified"
                            : "admin-unverified"
                        }
                      >
                        {user.is_verified ? (
                          <>
                            <ShieldCheck size={14} /> Verified
                          </>
                        ) : (
                          "Not verified"
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.is_active
                            ? "admin-status-active"
                            : "admin-status-inactive"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        className={
                          user.is_active
                            ? "admin-deactivate-btn"
                            : "admin-activate-btn"
                        }
                        onClick={() => handleStatusChange(user)}
                        disabled={
                          updatingId === user.id ||
                          user.role === "admin"
                        }
                        title={
                          user.role === "admin"
                            ? "Admin accounts cannot be changed here"
                            : ""
                        }
                      >
                        {updatingId === user.id
                          ? "Updating..."
                          : user.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
