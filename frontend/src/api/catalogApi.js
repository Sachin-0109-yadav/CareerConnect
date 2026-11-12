import api from "./axios";

export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const getSkills = async () => {
  const response = await api.get("/skills");
  return response.data;
};