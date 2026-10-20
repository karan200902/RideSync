import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios.js";

function DriverVerification() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPendingDrivers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/drivers");

      // Support common response shapes.
      const data = response.data?.data;
      const pendingDrivers = Array.isArray(data)
        ? data
        : (data?.drivers ?? response.data?.drivers ?? []);

      setDrivers(pendingDrivers);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load pending driver applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingDrivers();
  }, [fetchPendingDrivers]);

  const handleVerification = async (driverId, status) => {
    const action = status === "verified" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this driver?`)) {
      return;
    }

    setProcessingId(driverId);
    setError("");
    setSuccess("");

    try {
      await API.patch(`/admin/drivers/${driverId}/verify`, { status });

      setDrivers((currentDrivers) =>
        currentDrivers.filter((driver) => driver._id !== driverId),
      );

      setSuccess(
        status === "verified"
          ? "Driver approved successfully."
          : "Driver rejected successfully.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to ${action} this driver. Please try again.`,
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-600">Loading driver applications...</div>
    );
  }

  return (
    <div className="space-y-6 p-4 text-slate-100 md:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Verification</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review pending driver applications and make verification decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPendingDrivers}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      {/* Applications panel */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Pending Applications</h2>

          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            {drivers.length} pending
          </span>
        </div>

        {drivers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6 text-slate-400"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>

            <h3 className="font-semibold text-slate-200">
              No pending applications
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              New driver applications awaiting verification will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Driver
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    License Number
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {drivers.map((driver) => {
                  const driverId = driver._id;
                  const user = driver.user ?? {};
                  const isProcessing = processingId === driverId;

                  return (
                    <tr
                      key={driverId}
                      className="transition hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-100">
                          {user.name || "Unknown driver"}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {user.email || "No email available"}
                        </div>
                        {user.phone && (
                          <div className="mt-1 text-sm text-slate-400">
                            {user.phone}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                        {driver.licenseNumber || "Not provided"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                          {driver.verificationStatus || "pending"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleVerification(driverId, "verified")
                            }
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? "Processing..." : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleVerification(driverId, "rejected")
                            }
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverVerification;
