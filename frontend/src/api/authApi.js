import API from "./axios.js";

export const updateProfile = async (profileData) => {
  const response = await API.patch("/auth/profile", profileData);

  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await API.patch("/auth/change-password", {
    currentPassword,
    newPassword,
  });

  return response.data;
};
