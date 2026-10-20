import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios.js";

const initialPagination = {
  currentPage: 1,
  totalPages: 0,
  totalDrivers: 0,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};

function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/drivers/manage", {
        params: {
          search,
          status,
          availability,
          page,
          limit: 10,
        },
      });

      const data = response.data?.data;

      setDrivers(data?.drivers ?? []);
      setPagination(data?.pagination ?? initialPagination);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load drivers. Check your backend endpoint and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, availability, page]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setAvailability("all");
    setPage(1);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  return (
    <div className="space-y-6 p-4 text-slate-100 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Driver Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View driver profiles, availability, and performance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDrivers}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Drivers</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {pagination.totalDrivers}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Verified Drivers</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {drivers.filter(
              (driver) => driver.verificationStatus === "verified"
            ).length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            On this page
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Online Drivers</p>
          <p className="mt-2 text-2xl font-bold text-sky-400">
            {drivers.filter((driver) => driver.isOnline).length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            On this page
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, or license..."
            maxLength={100}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Search
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Clear
          </button>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="verification-status"
              className="mb-2 block text-sm text-slate-400"
            >
              Verification status
            </label>

            <select
              id="verification-status"
              value={status}
              onChange={(event) =>
                handleFilterChange(setStatus, event.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="driver-availability"
              className="mb-2 block text-sm text-slate-400"
            >
              Availability
            </label>

            <select
              id="driver-availability"
              value={availability}
              onChange={(event) =>
                handleFilterChange(setAvailability, event.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="all">All availability</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
          <button
            type="button"
            onClick={fetchDrivers}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Driver table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">All Drivers</h2>
          <span className="text-sm text-slate-400">
            {pagination.totalDrivers} total
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading drivers...
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-200">
              No drivers found
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/50">
                <tr>
                  {[
                    "Driver",
                    "License",
                    "Verification",
                    "Availability",
                    "Rating",
                    "Rides",
                    "Earnings",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {drivers.map((driver) => {
                  const user = driver.user ?? {};

                  const verificationClasses = {
                    verified:
                      "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                    pending:
                      "bg-amber-500/10 text-amber-300 border-amber-500/20",
                    rejected:
                      "bg-red-500/10 text-red-300 border-red-500/20",
                  };

                  return (
                    <tr
                      key={driver._id}
                      className="transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap font-medium text-white">
                          {user.name || "Unknown driver"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {user.email || "No email"}
                        </p>
                        {user.phone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {user.phone}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                        {driver.licenseNumber || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            verificationClasses[
                              driver.verificationStatus
                            ] ||
                            "border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {driver.verificationStatus || "unknown"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 text-sm ${
                            driver.isOnline
                              ? "text-emerald-300"
                              : "text-slate-400"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              driver.isOnline
                                ? "bg-emerald-400"
                                : "bg-slate-500"
                            }`}
                          />
                          {driver.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                        <span className="text-amber-400">★</span>{" "}
                        {Number(driver.rating ?? 0).toFixed(1)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                        {driver.totalRides ?? 0}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-200">
                        {formatCurrency(driver.totalEarnings)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-4">
          <p className="text-sm text-slate-400">
            Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverManagement;