import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios.js";

const initialPagination = {
  currentPage: 1,
  totalPages: 0,
  totalUsers: 0,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/users", {
        params: { search, role, status, page, limit: 10 },
      });

      const data = response.data?.data;

      setUsers(data?.users ?? []);
      setPagination(data?.pagination ?? initialPagination);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setRole("all");
    setStatus("all");
    setPage(1);
  };

  const activeOnPage = users.filter((user) => user.isActive).length;
  const inactiveOnPage = users.filter((user) => !user.isActive).length;

  const roleStyle = {
    passenger: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    driver: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    admin: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Search and review RideSync accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Total matching users</p>
          <p className="mt-2 text-2xl font-bold">
            {pagination.totalUsers}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Active on this page</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {activeOnPage}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Inactive on this page</p>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {inactiveOnPage}
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, email, or phone..."
            maxLength={100}
            className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
          >
            Search
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800"
          >
            Clear
          </button>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="user-role"
              className="mb-2 block text-sm text-gray-400"
            >
              Account role
            </label>

            <select
              id="user-role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">Passengers and drivers</option>
              <option value="passenger">Passengers</option>
              <option value="driver">Drivers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="user-status"
              className="mb-2 block text-sm text-gray-400"
            >
              Account status
            </label>

            <select
              id="user-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
          <button
            type="button"
            onClick={fetchUsers}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* User table */}
      <section className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="font-semibold">Accounts</h2>
          <span className="text-sm text-gray-400">
            {pagination.totalUsers} users
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No users found</p>
            <p className="mt-2 text-sm text-gray-400">
              Try another search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-950/60">
                <tr>
                  {["User", "Phone", "Role", "Status", "Joined"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="transition hover:bg-gray-800/40"
                  >
                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap font-medium">
                        {user.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {user.email}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-300">
                      {user.phone || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          roleStyle[user.role] ||
                          "border-gray-700 bg-gray-800 text-gray-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          user.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-400">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 px-5 py-4">
          <p className="text-sm text-gray-400">
            Page {pagination.currentPage} of{" "}
            {Math.max(1, pagination.totalPages)}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UserManagement;