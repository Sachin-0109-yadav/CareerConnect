
import api from "./axios";

// Submit an application for a job.
export const applyForJob = async (jobId, applicationData) => {
  const response = await api.post(
    `/applications/jobs/${jobId}/apply`,
    applicationData
  );
  return response.data;
};
// Get applications submitted by the logged-in candidate.
export const getMyApplications = async () => {
  const response = await api.get("/applications/my");

  return response.data;
};

// Get applicants for a recruiter's job.
export const getJobApplicants = async (jobId) => {
  const response = await api.get(
    `/applications/jobs/${jobId}/applicants`
  );

  return response.data;
};

// Update an applicant's status.
export const updateApplicationStatus = async (
  applicationId,
  status,
  note = ""
) => {
  const response = await api.patch(
    `/applications/${applicationId}/status`,
    { status, note }
  );

  return response.data;
};
