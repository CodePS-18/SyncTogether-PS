import api from "./api";

const register = async (userData) => {
  const response = await api.post(
    "/auth/register",
    userData
  );

  if (response.data.token) {
    localStorage.setItem(
      "syncTogetherToken",
      response.data.token
    );
  }

  return response.data;
};

const login = async (credentials) => {
  const response = await api.post(
    "/auth/login",
    credentials
  );

  if (response.data.token) {
    localStorage.setItem(
      "syncTogetherToken",
      response.data.token
    );
  }

  return response.data;
};

const logout = () => {
  localStorage.removeItem("syncTogetherToken");
};

const getToken = () => {
  return localStorage.getItem(
    "syncTogetherToken"
  );
};

const authService = {
  register,
  login,
  logout,
  getToken,
};

export default authService;