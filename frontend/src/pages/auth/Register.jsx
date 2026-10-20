import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import API from "../../api/axios.js";
import { useAuth } from "../../auth/AuthContext.jsx";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),

    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters"),

    role: z.enum(["passenger", "driver"]),

    licenseNumber: z.string().optional(),
    registrationNumber: z.string().optional(),
    vehicleType: z.enum(["car", "bike", "auto"]).optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
    year: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "driver") return;

    const requiredDriverFields = [
      ["licenseNumber", "Driving license number"],
      ["registrationNumber", "Vehicle registration number"],
      ["make", "Vehicle make"],
      ["model", "Vehicle model"],
      ["color", "Vehicle color"],
    ];

    for (const [field, label] of requiredDriverFields) {
      if (!data[field]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${label} is required`,
        });
      }
    }

    const year = Number(data.year);
    const maxYear = new Date().getFullYear() + 1;

    if (
      !data.year ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > maxYear
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["year"],
        message: `Enter a valid year between 2000 and ${maxYear}`,
      });
    }
  });

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "passenger",
      vehicleType: "car",
      year: String(new Date().getFullYear()),
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setServerError("");

      let response;

      if (data.role === "driver") {
        const payload = {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone,
          password: data.password,
          licenseNumber: data.licenseNumber.trim(),
          vehicle: {
            registrationNumber: data.registrationNumber.trim(),
            vehicleType: data.vehicleType,
            make: data.make.trim(),
            model: data.model.trim(),
            color: data.color.trim(),
            year: Number(data.year),
          },
        };

        response = await API.post("/auth/driver/register", payload);
      } else {
        response = await API.post("/auth/register", {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone,
          password: data.password,
          role: "passenger",
        });
      }

      // The passenger and driver registration responses differ.
      // Registration must return an access token for automatic login.
      const responseData = response.data?.data;
      let token = responseData?.accessToken;

      // Current driver controller returns the created user/profile/vehicle,
      // but does not currently return tokens. Log in after driver creation.
      if (data.role === "driver" && !token) {
        const loginResponse = await API.post("/auth/login", {
          email: data.email.trim(),
          password: data.password,
        });

        token = loginResponse.data?.data?.accessToken;
      }

      if (!token) {
        throw new Error(
          "Account was created, but automatic login failed. Please log in."
        );
      }

      await login(token);

      navigate(data.role === "driver" ? "/driver" : "/passenger", {
        replace: true,
      });
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500";

  const renderField = (name, label, placeholder, options = {}) => (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm">
        {label}
      </label>

      <input
        id={name}
        {...register(name)}
        type={options.type || "text"}
        placeholder={placeholder}
        className={inputClass}
      />

      {errors[name] && (
        <p className="mt-1 text-sm text-red-400">
          {errors[name].message}
        </p>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-gray-400">Join RideSync</p>

        {serverError && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {renderField("name", "Name", "Your name")}
          {renderField("email", "Email", "you@example.com", {
            type: "email",
          })}
          {renderField("phone", "Phone", "9876543210")}
          {renderField("password", "Password", "Minimum 8 characters", {
            type: "password",
          })}

          <div>
            <label htmlFor="role" className="mb-2 block text-sm">
              Account type
            </label>

            <select
              id="role"
              {...register("role")}
              className={inputClass}
            >
              <option value="passenger">Passenger</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          {selectedRole === "driver" && (
            <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-950/50 p-4">
              <h2 className="font-semibold text-white">
                Driver and vehicle details
              </h2>

              {renderField(
                "licenseNumber",
                "Driving license number",
                "Enter license number"
              )}

              {renderField(
                "registrationNumber",
                "Vehicle registration number",
                "e.g. UK07AB1234"
              )}

              <div>
                <label
                  htmlFor="vehicleType"
                  className="mb-2 block text-sm"
                >
                  Vehicle type
                </label>

                <select
                  id="vehicleType"
                  {...register("vehicleType")}
                  className={inputClass}
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="auto">Auto</option>
                </select>

                {errors.vehicleType && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.vehicleType.message}
                  </p>
                )}
              </div>

              {renderField("make", "Vehicle make", "e.g. Maruti Suzuki")}
              {renderField("model", "Vehicle model", "e.g. Swift")}
              {renderField("color", "Vehicle color", "e.g. White")}
              {renderField("year", "Manufacturing year", "2024", {
                type: "number",
              })}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating account..."
              : selectedRole === "driver"
                ? "Register as driver"
                : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Register;