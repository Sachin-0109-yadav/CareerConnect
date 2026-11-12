
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        CareerConnect
      </Link>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/jobs">Find Jobs</NavLink>

        {isAuthenticated && role === "candidate" && (
          <>
            <NavLink to="/candidate/profile">My Profile</NavLink>
            <NavLink to="/candidate/applications">My Applications</NavLink>
          </>
        )}

        {isAuthenticated && role === "recruiter" && (
          <>
            <NavLink to="/recruiter/dashboard">Dashboard</NavLink>
            <NavLink to="/recruiter/profile">Company Profile</NavLink>
          </>
        )}

        {isAuthenticated && role === "admin" && (
          <>
            <NavLink to="/admin/dashboard">Admin Dashboard</NavLink>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/companies">Companies</NavLink>
            <NavLink to="/admin/jobs">Manage Jobs</NavLink>
            <NavLink to="/admin/reports">Reports</NavLink>
          </>
        )}
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <span className="navbar-user">
              {user?.full_name || user?.name || user?.email}
            </span>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-login">Login</Link>
            <Link to="/register" className="navbar-register">Register</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
