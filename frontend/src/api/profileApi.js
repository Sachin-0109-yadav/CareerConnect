
import api from "./axios";

// =====================================
// Candidate Profile APIs
// =====================================

export const getCandidateProfile = async () => {
  const response = await api.get("/profiles/candidate/me");
  return response.data;
};

export const updateCandidateProfile = async (profileData) => {
  const response = await api.put(
    "/profiles/candidate/me",
    profileData
  );

  return response.data;
};


// =====================================
// Recruiter Profile APIs
// =====================================

export const getRecruiterProfile = async () => {
  const response = await api.get("/profiles/recruiter/me");
  return response.data;
};

export const updateRecruiterProfile = async (profileData) => {
  const response = await api.put(
    "/profiles/recruiter/me",
    profileData
  );

  return response.data;
};
