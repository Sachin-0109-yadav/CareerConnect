
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";

// Candidate pages
import CandidateProfile from "./pages/CandidateProfile";
import MyApplications from "./pages/MyApplications";

// Recruiter pages
import CreateJob from "./pages/CreateJob";
import EditJob from "./pages/EditJob";
import RecruiterProfile from "./pages/RecruiterProfile";
import RecruiterApplicants from "./pages/RecruiterApplicants";
import RecruiterDashboard from "./pages/RecruiterDashboard";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCompanies from "./pages/AdminCompanies";
import AdminJobs from "./pages/AdminJobs";
import AdminReports from "./pages/AdminReports";

// 404 Page
function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        textAlign: "center",
      }}
    >
      <h1>404 - Page Not Found</h1>

      <p>
        The page you are looking for does not exist.
      </p>

      <Link to="/">
        Go to Homepage
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route path="/" element={<Home />} />

        <Route path="/jobs" element={<Jobs />} />

        <Route
          path="/jobs/:jobId"
          element={<JobDetails />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            CANDIDATE PROTECTED ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["candidate"]} />
          }
        >
          <Route
            path="/candidate/profile"
            element={<CandidateProfile />}
          />

          <Route
            path="/candidate/applications"
            element={<MyApplications />}
          />
        </Route>

        {/* =========================
            RECRUITER PROTECTED ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["recruiter"]} />
          }
        >
          <Route
            path="/recruiter/dashboard"
            element={<RecruiterDashboard />}
          />

          <Route
            path="/recruiter/profile"
            element={<RecruiterProfile />}
          />

          <Route
            path="/recruiter/jobs/new"
            element={<CreateJob />}
          />

          <Route
            path="/recruiter/jobs/:jobId/edit"
            element={<EditJob />}
          />

          <Route
            path="/recruiter/jobs/:jobId/applicants"
            element={<RecruiterApplicants />}
          />
        </Route>

        {/* =========================
            ADMIN PROTECTED ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]} />
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />

          <Route
            path="/admin/companies"
            element={<AdminCompanies />}
          />

          <Route
            path="/admin/jobs"
            element={<AdminJobs />}
          />

          <Route
            path="/admin/reports"
            element={<AdminReports />}
          />
        </Route>

        {/* =========================
            404 ROUTE
        ========================= */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
