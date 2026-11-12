
import api from "./axios";

// Fetch published jobs from the backend.
export const searchJobs = async (filters = {}) => {
  const params = {
    page: filters.page || 1,
    page_size: filters.page_size || 20,
    sort_by: filters.sort_by || "latest",
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !["page", "page_size", "sort_by"].includes(key)
    ) {
      params[key] = value;
    }
  });

  const response = await api.get("/jobs/search", { params });
  return response.data;
};

// Fetch public job details.
export const getJobDetails = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

// Fetch all jobs belonging to a company.
export const getCompanyJobs = async (companyId) => {
  const response = await api.get(
    `/companies/${companyId}/jobs`
  );
  return response.data;
};

// Create a new company job.
export const createCompanyJob = async (companyId, jobData) => {
  const response = await api.post(
    `/companies/${companyId}/jobs`,
    jobData
  );
  return response.data;
};

// Update an existing job.
export const updateJob = async (jobId, jobData) => {
  const response = await api.put(
    `/jobs/${jobId}`,
    jobData
  );
  return response.data;
};

// Change job status.
export const updateJobStatus = async (jobId, status) => {
  const response = await api.patch(
    `/jobs/${jobId}/status`,
    { status }
  );
  return response.data;
};

// Delete a job.
export const deleteJob = async (jobId) => {
  const response = await api.delete(`/jobs/${jobId}`);
  return response.data;
};

// Fetch a job with all fields for recruiter editing.
export const getManagedJob = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/manage`);
  return response.data;
};
