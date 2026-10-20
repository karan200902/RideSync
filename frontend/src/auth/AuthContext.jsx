import { createContext, useContext, useEffect, useState } from "react";

import API from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken"),
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const login = async (token) => {
    localStorage.setItem("accessToken", token);
    setAccessToken(token);

    try {
      const response = await API.get("/auth/me");

      setUser(response.data?.data?.user);
    } catch (error) {
      localStorage.removeItem("accessToken");
      setAccessToken(null);
      setUser(null);

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");

    setAccessToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get("/auth/me");

        setUser(response.data?.data?.user);
      } catch (error) {
        localStorage.removeItem("accessToken");
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isAuthenticated: Boolean(accessToken && user),
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
