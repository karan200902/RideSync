import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDriverProfile,
  getDriverVehicle,
  createDriverVehicle,
  updateDriverVehicle,
  deleteDriverVehicle,
} from "../../api/driverApi.js";

const initialVehicleForm = {
  registrationNumber: "",
  vehicleType: "car",
  make: "",
  model: "",
  color: "",
  year: new Date().getFullYear(),
};

function Profile() {
  const queryClient = useQueryClient();

  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [successMessage, setSuccessMessage] = useState("");

  // Driver profile
  const {
    data: profileResponse,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorData,
  } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: getDriverProfile,
  });

  const driverProfile =
    profileResponse?.data?.driver ||
    profileResponse?.data?.profile ||
    profileResponse?.driver ||
    profileResponse?.profile ||
    null;

  // Vehicle
  const {
    data: vehicleResponse,
    isLoading: vehicleLoading,
    isError: vehicleError,
    error: vehicleErrorData,
  } = useQuery({
    queryKey: ["driver-vehicle"],
    queryFn: getDriverVehicle,
    retry: false,
  });

  const vehicle =
    vehicleResponse?.data?.vehicle || vehicleResponse?.vehicle || null;

  // Add vehicle
  const createMutation = useMutation({
    mutationFn: createDriverVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-vehicle"] });
      setIsEditingVehicle(false);
      setVehicleForm(initialVehicleForm);
      setSuccessMessage("Vehicle added successfully.");
    },
  });

  // Edit vehicle
  const updateMutation = useMutation({
    mutationFn: updateDriverVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-vehicle"] });
      setIsEditingVehicle(false);
      setSuccessMessage("Vehicle updated successfully.");
    },
  });

  // Delete vehicle
  const deleteMutation = useMutation({
    mutationFn: deleteDriverVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-vehicle"] });
      setSuccessMessage("Vehicle deleted successfully.");
      setIsEditingVehicle(false);
      setVehicleForm(initialVehicleForm);
    },
  });

  const mutationError =
    createMutation.error || updateMutation.error || deleteMutation.error;

  const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

  const startEditing = () => {
    setSuccessMessage("");

    if (vehicle) {
      setVehicleForm({
        registrationNumber: vehicle.registrationNumber || "",
        vehicleType: vehicle.vehicleType || "car",
        make: vehicle.make || "",
        model: vehicle.model || "",
        color: vehicle.color || "",
        year: vehicle.year || new Date().getFullYear(),
      });
    } else {
      setVehicleForm(initialVehicleForm);
    }

    setIsEditingVehicle(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setVehicleForm((previous) => ({
      ...previous,
      [name]: name === "year" ? value : value,
    }));
  };

  const handleVehicleSubmit = (event) => {
    event.preventDefault();
    setSuccessMessage("");

    const payload = {
      ...vehicleForm,
      registrationNumber: vehicleForm.registrationNumber.trim().toUpperCase(),
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      color: vehicleForm.color.trim(),
      year: Number(vehicleForm.year),
    };

    if (vehicle) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (profileLoading) {
    return <PageMessage message="Loading driver profile..." />;
  }

  if (profileError) {
    return <PageMessage message={getErrorMessage(profileErrorData)} isError />;
  }

  if (!driverProfile) {
    return (
      <PageMessage
        message="Driver profile not found. Please contact support."
        isError
      />
    );
  }

  const driverUser = driverProfile.user || {};

  const verificationStatus = driverProfile.verificationStatus || "pending";

  const verificationStyle = {
    verified: "bg-green-950 text-green-300",
    pending: "bg-yellow-950 text-yellow-300",
    rejected: "bg-red-950 text-red-300",
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold">Driver Profile</h1>
          <p className="mt-2 text-gray-400">
            Manage your personal information and registered vehicle.
          </p>
        </header>

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            className="rounded-lg border border-green-800 bg-green-950 p-4 text-green-300"
          >
            {successMessage}
          </div>
        )}

        {/* Driver information */}
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Personal Information</h2>
              <p className="mt-1 text-sm text-gray-400">
                Your registered account and driver details.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                verificationStyle[verificationStatus] ||
                "bg-gray-800 text-gray-300"
              }`}
            >
              {verificationStatus.charAt(0).toUpperCase() +
                verificationStatus.slice(1)}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label="Full Name"
              value={driverUser.name || driverProfile.name}
            />
            <Detail
              label="Email"
              value={driverUser.email || driverProfile.email}
            />
            <Detail
              label="Phone"
              value={driverUser.phone || driverProfile.phone}
            />
            <Detail
              label="License Number"
              value={driverProfile.licenseNumber}
            />
            <Detail label="Rating" value={`${driverProfile.rating ?? 5} / 5`} />
            <Detail label="Total Rides" value={driverProfile.totalRides ?? 0} />
            <Detail
              label="Driver Status"
              value={driverProfile.isOnline ? "Online" : "Offline"}
            />
          </div>
        </section>

        {/* Vehicle information */}
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Vehicle Management</h2>
              <p className="mt-1 text-sm text-gray-400">
                Register and maintain your vehicle details.
              </p>
            </div>

            {!isEditingVehicle && !vehicleLoading && (
              <button
                onClick={startEditing}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
              >
                {vehicle ? "Edit Vehicle" : "Add Vehicle"}
              </button>
            )}
          </div>

          {vehicleLoading ? (
            <p className="text-gray-400">Loading vehicle details...</p>
          ) : vehicleError && !vehicle ? (
            <div className="rounded-lg border border-yellow-800 bg-yellow-950/40 p-4">
              <p className="text-yellow-300">
                We couldn't load your vehicle details.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                {getErrorMessage(vehicleErrorData)}
              </p>
              <button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["driver-vehicle"],
                  })
                }
                className="mt-3 rounded-lg bg-gray-800 px-4 py-2 hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          ) : isEditingVehicle ? (
            <form onSubmit={handleVehicleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Registration Number"
                  name="registrationNumber"
                  value={vehicleForm.registrationNumber}
                  onChange={handleChange}
                  placeholder="e.g. UK07AB1234"
                  required
                />

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={vehicleForm.vehicleType}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <FormField
                  label="Make"
                  name="make"
                  value={vehicleForm.make}
                  onChange={handleChange}
                  placeholder="e.g. Maruti Suzuki"
                  maxLength={50}
                  required
                />

                <FormField
                  label="Model"
                  name="model"
                  value={vehicleForm.model}
                  onChange={handleChange}
                  placeholder="e.g. Swift"
                  maxLength={50}
                  required
                />

                <FormField
                  label="Color"
                  name="color"
                  value={vehicleForm.color}
                  onChange={handleChange}
                  placeholder="e.g. White"
                  maxLength={30}
                  required
                />

                <FormField
                  label="Year"
                  name="year"
                  type="number"
                  value={vehicleForm.year}
                  onChange={handleChange}
                  min={2000}
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>

              {mutationError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-800 bg-red-950 p-3 text-red-300"
                >
                  {getErrorMessage(mutationError)}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-500 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : vehicle
                      ? "Save Changes"
                      : "Register Vehicle"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingVehicle(false);
                    setSuccessMessage("");
                  }}
                  className="rounded-lg bg-gray-800 px-5 py-2.5 font-semibold hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : vehicle ? (
            <>
              <div className="mb-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Detail
                  label="Registration Number"
                  value={vehicle.registrationNumber}
                />
                <Detail
                  label="Vehicle Type"
                  value={capitalize(vehicle.vehicleType)}
                />
                <Detail label="Make" value={vehicle.make} />
                <Detail label="Model" value={vehicle.model} />
                <Detail label="Color" value={vehicle.color} />
                <Detail label="Year" value={vehicle.year} />
                <Detail
                  label="Vehicle Status"
                  value={vehicle.isActive ? "Active" : "Inactive"}
                />
              </div>

              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    "Are you sure you want to delete your registered vehicle?",
                  );

                  if (confirmed) {
                    setSuccessMessage("");
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-red-800 px-4 py-2 font-semibold text-red-300 hover:bg-red-950 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Vehicle"}
              </button>

              {deleteMutation.error && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {getErrorMessage(deleteMutation.error)}
                </p>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
              <h3 className="font-semibold">No vehicle registered</h3>
              <p className="mt-2 text-sm text-gray-400">
                Add your vehicle details to complete your driver profile.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 break-words font-semibold">
        {value === undefined || value === null || value === ""
          ? "Not provided"
          : value}
      </p>
    </div>
  );
}

function FormField({ label, name, value, onChange, type = "text", ...props }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-gray-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        {...props}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-white outline-none focus:border-blue-500"
      />
    </div>
  );
}

function PageMessage({ message, isError = false }) {
  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div
        className={`rounded-xl border p-5 ${
          isError
            ? "border-red-800 bg-red-950 text-red-300"
            : "border-gray-800 bg-gray-900 text-gray-300"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default Profile;
