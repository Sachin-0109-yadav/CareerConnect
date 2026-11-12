
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
} from "lucide-react";

import { searchJobs } from "../api/jobsApi";
import "./Jobs.css";

function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState(
    searchParams.get("search") || ""
  );
  const [location, setLocation] = useState(
    searchParams.get("location") || ""
  );
  const [jobType, setJobType] = useState(
    searchParams.get("job_type") || ""
  );
  const [workMode, setWorkMode] = useState(
    searchParams.get("work_mode") || ""
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch jobs whenever URL search filters change.
  useEffect(() => {
    const filters = {
      keyword: searchParams.get("search") || "",
      location: searchParams.get("location") || "",
      job_type: searchParams.get("job_type") || "",
      work_mode: searchParams.get("work_mode") || "",
    };

    setKeyword(filters.keyword);
    setLocation(filters.location);
    setJobType(filters.job_type);
    setWorkMode(filters.work_mode);

    let cancelled = false;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value.trim() !== ""
          )
        );

        const data = await searchJobs(cleanFilters);

        if (cancelled) return;

        const results = Array.isArray(data)
          ? data
          : data.items || data.results || data.jobs || [];

        setJobs(results);
      } catch (err) {
        if (cancelled) return;

        console.error("Jobs API error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load jobs. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Submit search and update URL.
  const handleSearch = (event) => {
    event.preventDefault();

    const params = {};

    if (keyword.trim()) {
      params.search = keyword.trim();
    }

    if (location.trim()) {
      params.location = location.trim();
    }

    if (jobType) {
      params.job_type = jobType;
    }

    if (workMode) {
      params.work_mode = workMode;
    }

    setSearchParams(params);
  };

  // Clear all filters.
  const clearFilters = () => {
    setKeyword("");
    setLocation("");
    setJobType("");
    setWorkMode("");
    setSearchParams({});
  };

  // Retry loading jobs without losing current filters.
  const handleRetry = () => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      retry: String(Date.now()),
    });
  };

  return (
    <main className="jobs-page">
      <header className="jobs-header">
        <Link to="/" className="jobs-logo">
          CareerConnect
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/jobs">Browse Jobs</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>

      <section className="jobs-hero">
        <p className="jobs-eyebrow">YOUR CAREER STARTS HERE</p>

        <h1>Find a job you'll love.</h1>

        <p>
          Discover opportunities and take the next step
          in your career.
        </p>

        <form className="jobs-search" onSubmit={handleSearch}>
          <label>
            <Search size={18} />

            <input
              type="text"
              placeholder="Job title or keyword"
              value={keyword}
              onChange={(event) =>
                setKeyword(event.target.value)
              }
            />
          </label>

          <label>
            <MapPin size={18} />

            <input
              type="text"
              placeholder="City or location"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
            />
          </label>

          <select
            value={jobType}
            onChange={(event) =>
              setJobType(event.target.value)
            }
          >
            <option value="">All job types</option>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>

          <select
            value={workMode}
            onChange={(event) =>
              setWorkMode(event.target.value)
            }
          >
            <option value="">All work modes</option>
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <button type="submit">
            <Search size={17} />
            Search jobs
          </button>
        </form>
      </section>

      <section className="jobs-content">
        <div className="jobs-section-heading">
          <div>
            <p className="jobs-eyebrow">OPPORTUNITIES</p>
            <h2>Latest jobs</h2>
          </div>

          <span>{jobs.length} jobs found</span>
        </div>

        {(keyword || location || jobType || workMode) && (
          <div className="active-filters">
            <span>Active search filters</span>

            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {loading && (
          <p className="jobs-message">Loading jobs...</p>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>

            <button type="button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <p className="jobs-message">
            No jobs found. Try changing your search filters.
          </p>
        )}

        <div className="jobs-grid">
          {!loading &&
            !error &&
            jobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-card-top">
                  <div className="job-company-icon">
                    <Briefcase size={22} />
                  </div>

                  <span className="job-status">Hiring</span>
                </div>

                <h3>{job.title}</h3>

                <p className="job-company">
                  {job.company?.name ||
                    job.company_name ||
                    "Company"}
                </p>

                <div className="job-meta">
                  <span>
                    <MapPin size={15} />
                    {job.location || "Not specified"}
                  </span>

                  <span>
                    <Briefcase size={15} />
                    {(job.job_type || "").replaceAll("_", " ")}
                  </span>

                  <span>
                    <Clock size={15} />
                    {(job.experience_level || "").replaceAll(
                      "_",
                      " "
                    )}
                  </span>
                </div>

                {(job.min_salary != null ||
                  job.max_salary != null) && (
                  <p className="job-salary">
                    <IndianRupee size={16} />

                    {job.min_salary ?? "—"} -{" "}
                    {job.max_salary ?? "—"}{" "}
                    {job.currency || "INR"}
                  </p>
                )}

                <div className="job-card-footer">
                  <span>
                    {job.work_mode || "Work mode not specified"}
                  </span>

                  <Link to={`/jobs/${job.id}`}>
                    View details →
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}

export default Jobs;
