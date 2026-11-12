
import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../api/axios";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(
        "careerconnect_user"
      );

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("careerconnect_user");
      localStorage.removeItem("careerconnect_token");
      return null;
    }
  });

  const [loading, setLoading] = useState(false);


  // Save authentication information
  const saveAuth = (data) => {
    const accessToken = data.token.access_token;

    localStorage.setItem(
      "careerconnect_token",
      accessToken
    );

    localStorage.setItem(
      "careerconnect_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
  };


  // Register a new user
  const register = async (userData) => {
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/register",
        userData
      );

      saveAuth(response.data);

      return response.data;
    } finally {
      setLoading(false);
    }
  };


  // Login existing user
  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/login",
        credentials
      );

      saveAuth(response.data);

      return response.data;
    } finally {
      setLoading(false);
    }
  };


  // Logout user
  const logout = () => {
    localStorage.removeItem("careerconnect_token");
    localStorage.removeItem("careerconnect_user");

    setUser(null);
  };


  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isCandidate: user?.role === "candidate",
    isRecruiter: user?.role === "recruiter",
    login,
    register,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


// Custom authentication hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
