
import api from "./axios";

export const getAdminReports = async (params = {}) => {
  const response = await api.get("/admin/reports", { params });
  return response.data;
};

export const getAdminReportSummary = async () => {
  const response = await api.get("/admin/reports/summary");
  return response.data;
};

export const getAdminReportDetails = async (reportId) => {
  const response = await api.get(`/admin/reports/${reportId}`);
  return response.data;
};

export const updateAdminReportStatus = async (reportId, status) => {
  const response = await api.patch(
    `/admin/reports/${reportId}/status`,
    { status }
  );
  return response.data;
};
