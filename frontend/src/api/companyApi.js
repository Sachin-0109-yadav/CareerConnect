
import api from "./axios";

// Get all companies associated with the logged-in recruiter.
export const getMyCompanies = async () => {
  const response = await api.get("/companies/my");
  return response.data;
};

// Get a company's details.
export const getCompanyDetails = async (companyId) => {
  const response = await api.get(`/companies/${companyId}`);
  return response.data;
};
