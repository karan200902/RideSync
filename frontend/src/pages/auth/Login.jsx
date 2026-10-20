import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import API from "../../api/axios.js";
import { useAuth } from "../../auth/AuthContext.jsx";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),

  password: z.string().min(1, "Password is required"),
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setServerError("");

      const response = await API.post("/auth/login", data);

      const token = response.data?.data?.accessToken;

      if (!token) {
        throw new Error("Login succeeded but no access token was returned");
      }

      await login(token);

      const role = response.data?.data?.user?.role;

      if (role === "driver") {
        navigate("/driver");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/passenger");
      }
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>

        <p className="mt-2 text-gray-400">Login to RideSync</p>

        {serverError && (
          <div className="mt-5 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-2">Email</label>

            <input
              {...register("email")}
              type="email"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>

            <input
              {...register("password")}
              type="password"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Your password"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;
