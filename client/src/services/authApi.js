import api from "./api";

// Admin forgot password endpoints
export const adminForgotPassword = async (email) => {
  const response = await api.post("/admin/auth/forgotpassword", { email });
  return response.data;
};

export const adminVerifyResetCode = async (email, code) => {
  const response = await api.post("/admin/auth/verify-reset-code", {
    email,
    code,
  });
  return response.data;
};

export const adminResetPassword = async (email, code, password) => {
  const response = await api.put(`/admin/auth/resetpassword/${code}`, {
    email,
    password,
  });
  return response.data;
};
