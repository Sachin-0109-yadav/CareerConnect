
import api from "./axios";

// Dashboard statistics
export const getAdminDashboardStats = async () => {
  const response = await api.get("/admin/dashboard/stats");
  return response.data;
};

// Users
export const getAdminUsers = async (params = {}) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const updateAdminUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/admin/users/${userId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

// Companies
export const getAdminCompanies = async (params = {}) => {
  const response = await api.get("/admin/companies", { params });
  return response.data;
};

export const updateCompanyVerification = async (companyId, status) => {
  const response = await api.patch(
    `/admin/companies/${companyId}/verification`,
    { verification_status: status }
  );
  return response.data;
};

// Jobs
export const getAdminJobs = async (params = {}) => {
  const response = await api.get("/admin/jobs", { params });
  return response.data;
};

export const updateJobModeration = async (jobId, status) => {
  const response = await api.patch(
    `/admin/jobs/${jobId}/moderation`,
    { status }
  );
  return response.data;
};
