
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  MapPin,
  Plus,
  X,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { getMyCompanies } from "../api/companyApi";
import { createCompanyJob } from "../api/jobsApi";
import { getCategories, getSkills } from "../api/catalogApi";

import "./CreateJob.css";

const initialForm = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  location: "",
  job_type: "full_time",
  work_mode: "onsite",
  experience_level: "entry",
  min_salary: "",
  max_salary: "",
  currency: "INR",
  openings: "1",
  category_id: "",
  skill_ids: [],
  expires_at: "",
};

function CreateJob() {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        setError("");

        const [companiesData, categoriesData, skillsData] =
          await Promise.all([
            getMyCompanies(),
            getCategories(),
            getSkills(),
          ]);

        if (!companiesData || companiesData.length === 0) {
          setError("You must belong to a company before posting a job.");
          return;
        }

        setCompany(companiesData[0]);
        setCategories(categoriesData);
        setSkills(skillsData);
      } catch (err) {
        console.error("Create job initialization error:", err);
        setError(
          err.response?.data?.detail ||
          "Unable to load job form data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const toggleSkill = (skillId) => {
    setForm((previous) => ({
      ...previous,
      skill_ids: previous.skill_ids.includes(skillId)
        ? previous.skill_ids.filter((id) => id !== skillId)
        : [...previous.skill_ids, skillId],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!company) {
      setError("Company information is unavailable.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a job category.");
      return;
    }

    if (
      form.min_salary !== "" &&
      form.max_salary !== "" &&
      Number(form.min_salary) > Number(form.max_salary)
    ) {
      setError("Minimum salary cannot exceed maximum salary.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.location.trim() ||
      form.description.trim().length < 30
    ) {
      setError("Please complete all required fields. Description must contain at least 30 characters.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      responsibilities: form.responsibilities.trim() || null,
      requirements: form.requirements.trim() || null,
      location: form.location.trim(),
      job_type: form.job_type,
      work_mode: form.work_mode,
      experience_level: form.experience_level,
      min_salary:
        form.min_salary === "" ? null : Number(form.min_salary),
      max_salary:
        form.max_salary === "" ? null : Number(form.max_salary),
      currency: form.currency,
      openings: Number(form.openings),
      category_id: form.category_id,
      skill_ids: form.skill_ids,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
    };

    try {
      setSubmitting(true);
      setError("");

      await createCompanyJob(company.id, payload);

      navigate("/recruiter/dashboard", {
        state: {
          success: "Job created successfully. It is saved as a draft.",
        },
      });
    } catch (err) {
      console.error("Job creation error:", err);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : "Unable to create job. Please check your information and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-job-loading">
        <LoaderCircle className="create-job-spinner" size={30} />
        <p>Preparing your job posting form...</p>
      </div>
    );
  }

  return (
    <main className="create-job-page">
      <div className="create-job-container">
        <Link
          to="/recruiter/dashboard"
          className="create-job-back"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <header className="create-job-header">
          <div className="create-job-heading-icon">
            <BriefcaseBusiness size={26} />
          </div>

          <div>
            <span className="create-job-eyebrow">
              RECRUITER WORKSPACE
            </span>
            <h1>Create a Job</h1>
            <p>
              Share an opportunity and find the right talent for your team.
            </p>
          </div>
        </header>

        {error && (
          <div className="create-job-error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {company && (
          <div className="create-job-company">
            <span>Posting for</span>
            <strong>{company.name}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-job-form">
          <section className="create-job-section">
            <div className="create-job-section-heading">
              <span>01</span>
              <div>
                <h2>Basic Information</h2>
                <p>Introduce the role and its responsibilities.</p>
              </div>
            </div>

            <div className="create-job-grid">
              <div className="create-job-field full-width">
                <label htmlFor="title">Job Title *</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Python Backend Developer"
                  minLength={3}
                  maxLength={200}
                  required
                />
              </div>

              <div className="create-job-field full-width">
                <label htmlFor="description">Job Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the role, team, and opportunity..."
                  rows={6}
                  minLength={30}
                  required
                />
                <small>
                  Minimum 30 characters. {form.description.length} characters entered.
                </small>
              </div>

              <div className="create-job-field full-width">
                <label htmlFor="responsibilities">
                  Key Responsibilities
                </label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={form.responsibilities}
                  onChange={handleChange}
                  placeholder="List the main responsibilities..."
                  rows={4}
                />
              </div>

              <div className="create-job-field full-width">
                <label htmlFor="requirements">
                  Candidate Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="Describe qualifications and expectations..."
                  rows={4}
                />
              </div>
            </div>
          </section>

          <section className="create-job-section">
            <div className="create-job-section-heading">
              <span>02</span>
              <div>
                <h2>Job Classification</h2>
                <p>Help candidates understand the position.</p>
              </div>
            </div>

            <div className="create-job-grid">
              <div className="create-job-field">
                <label htmlFor="category_id">Job Category *</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="create-job-field">
                <label htmlFor="job_type">Employment Type *</label>
                <select
                  id="job_type"
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                  required
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div className="create-job-field">
                <label htmlFor="work_mode">Work Mode *</label>
                <select
                  id="work_mode"
                  name="work_mode"
                  value={form.work_mode}
                  onChange={handleChange}
                  required
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="create-job-field">
                <label htmlFor="experience_level">
                  Experience Level *
                </label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={form.experience_level}
                  onChange={handleChange}
                  required
                >
                  <option value="entry">Entry Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>

              <div className="create-job-field full-width">
                <label htmlFor="location">Job Location *</label>
                <div className="create-job-input-icon">
                  <MapPin size={18} />
                  <input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Gurugram, Haryana or Remote"
                    minLength={2}
                    maxLength={200}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="create-job-section">
            <div className="create-job-section-heading">
              <span>03</span>
              <div>
                <h2>Required Skills</h2>
                <p>Select the skills candidates should have.</p>
              </div>
            </div>

            <div className="create-job-skills">
              {skills.map((skill) => {
                const selected = form.skill_ids.includes(skill.id);

                return (
                  <button
                    type="button"
                    key={skill.id}
                    className={`create-job-skill ${selected ? "selected" : ""}`}
                    onClick={() => toggleSkill(skill.id)}
                    aria-pressed={selected}
                  >
                    {selected ? <CheckCircle2 size={15} /> : <Plus size={15} />}
                    {skill.name}
                  </button>
                );
              })}
            </div>

            <p className="create-job-selected-count">
              {form.skill_ids.length} skills selected
            </p>
          </section>

          <section className="create-job-section">
            <div className="create-job-section-heading">
              <span>04</span>
              <div>
                <h2>Compensation and Openings</h2>
                <p>Provide salary details and hiring requirements.</p>
              </div>
            </div>

            <div className="create-job-grid">
              <div className="create-job-field">
                <label htmlFor="min_salary">Minimum Salary (₹ / year)</label>
                <input
                  id="min_salary"
                  name="min_salary"
                  type="number"
                  min="0"
                  value={form.min_salary}
                  onChange={handleChange}
                  placeholder="e.g. 400000"
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="max_salary">Maximum Salary (₹ / year)</label>
                <input
                  id="max_salary"
                  name="max_salary"
                  type="number"
                  min="0"
                  value={form.max_salary}
                  onChange={handleChange}
                  placeholder="e.g. 800000"
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="openings">Number of Openings *</label>
                <input
                  id="openings"
                  name="openings"
                  type="number"
                  min="1"
                  max="10000"
                  value={form.openings}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="expires_at">Application Deadline</label>
                <input
                  id="expires_at"
                  name="expires_at"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <div className="create-job-footer">
            <p>
              <AlertCircle size={16} />
              Your job will be saved as a draft. You can publish it later.
            </p>

            <div className="create-job-footer-actions">
              <Link
                to="/recruiter/dashboard"
                className="create-job-cancel"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="create-job-submit"
                disabled={submitting || !company}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="create-job-spinner" size={18} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Job
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default CreateJob;
