
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  IndianRupee,
  Building2,
  ArrowRight,
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
          : data?.items || data?.results || data?.jobs || [];

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

  const handleSearch = (event) => {
    event.preventDefault();

    const params = {};

    if (keyword.trim()) params.search = keyword.trim();
    if (location.trim()) params.location = location.trim();
    if (jobType) params.job_type = jobType;
    if (workMode) params.work_mode = workMode;

    setSearchParams(params);
  };

  const clearFilters = () => {
    setKeyword("");
    setLocation("");
    setJobType("");
    setWorkMode("");
    setSearchParams({});
  };

  const handleRetry = () => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      retry: String(Date.now()),
    });
  };

  const formatLabel = (value) =>
    value
      ? value.replaceAll("_", " ").replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
      : "Not specified";

  return (
    <main className="jobs-page">
      <section className="jobs-hero">
        <div className="jobs-hero-content">
          <p className="jobs-eyebrow">
            YOUR CAREER STARTS HERE
          </p>

          <h1>
            Find a job you'll <span>love.</span>
          </h1>

          <p className="jobs-hero-description">
            Discover opportunities, connect with companies,
            and take the next step in your career.
          </p>

          <form
            className="jobs-search"
            onSubmit={handleSearch}
          >
            <label className="jobs-search-field">
              <Search size={19} />

              <input
                type="search"
                placeholder="Job title or keyword"
                value={keyword}
                onChange={(event) =>
                  setKeyword(event.target.value)
                }
                aria-label="Job title or keyword"
              />
            </label>

            <label className="jobs-search-field">
              <MapPin size={19} />

              <input
                type="text"
                placeholder="City or location"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                aria-label="City or location"
              />
            </label>

            <label className="jobs-select-field">
              <span className="sr-only">Job type</span>

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
            </label>

            <label className="jobs-select-field">
              <span className="sr-only">Work mode</span>

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
            </label>

            <button
              type="submit"
              className="jobs-search-button"
            >
              <Search size={18} />
              Search jobs
            </button>
          </form>
        </div>
      </section>

      <section className="jobs-content">
        <div className="jobs-section-heading">
          <div>
            <p className="jobs-eyebrow">OPPORTUNITIES</p>
            <h2>Latest jobs</h2>
            <p className="jobs-subheading">
              Explore opportunities that match your skills.
            </p>
          </div>

          <span className="jobs-count">
            {jobs.length} jobs found
          </span>
        </div>

        {(keyword || location || jobType || workMode) && (
          <div className="active-filters">
            <span>Active search filters</span>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>
        )}

        {loading && (
          <div className="jobs-message" role="status">
            Loading jobs...
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>

            <button
              type="button"
              onClick={handleRetry}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="jobs-empty-state">
            <Search size={35} />

            <h3>No jobs found</h3>

            <p>
              Try changing your search filters to find
              more opportunities.
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="jobs-grid">
          {!loading &&
            !error &&
            jobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-card-top">
                  <div className="job-company-icon">
                    <Building2 size={23} />
                  </div>

                  <span className="job-status">
                    Hiring
                  </span>
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
                    {formatLabel(job.job_type)}
                  </span>

                  <span>
                    <Clock size={15} />
                    {formatLabel(job.experience_level)}
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
                    {formatLabel(job.work_mode)}
                  </span>

                  <Link to={`/jobs/${job.id}`}>
                    View details <ArrowRight size={16} />
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
