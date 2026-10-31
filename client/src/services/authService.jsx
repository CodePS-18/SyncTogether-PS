
import api from "./api";

// REGISTER
const register = async (userData) => {
  const response = await api.post("/auth/register", userData);

  if (response.data.token) {
    localStorage.setItem("syncTogetherToken", response.data.token);
  }

  return response.data;
};

// LOGIN
const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  if (response.data.token) {
    localStorage.setItem("syncTogetherToken", response.data.token);
  }

  return response.data;
};

// UPDATE PROFILE
const updateProfile = async (profileData) => {
  const response = await api.patch(
    "/auth/update-profile",
    profileData
  );

  return response.data;
};

// CHANGE PASSWORD
const changePassword = async (passwordData) => {
  const response = await api.patch(
    "/auth/change-password",
    passwordData
  );

  return response.data;
};

// LOGOUT
const logout = () => {
  localStorage.removeItem("syncTogetherToken");
};

// GET TOKEN
const getToken = () => {
  return localStorage.getItem("syncTogetherToken");
};

const authService = {
  register,
  login,
  updateProfile,
  changePassword,
  logout,
  getToken,
};

export default authService;
