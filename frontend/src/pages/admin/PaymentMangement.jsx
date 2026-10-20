import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios.js";

const STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
];

const METHODS = ["cash", "upi", "card", "netbanking", "wallet"];

function formatCurrency(amount, currency = "INR") {
  if (amount == null) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date) {
  return date ? new Date(date).toLocaleString() : "—";
}

function statusClass(status) {
  const styles = {
    SUCCESS: "bg-green-500/15 text-green-400",
    FAILED: "bg-red-500/15 text-red-400",
    REFUNDED: "bg-purple-500/15 text-purple-400",
    PROCESSING: "bg-blue-500/15 text-blue-400",
    PENDING: "bg-yellow-500/15 text-yellow-400",
  };

  return styles[status] || "bg-gray-500/15 text-gray-400";
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalPayments: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/payments/manage", {
        params: {
          search: appliedSearch,
          status,
          method,
          page,
          limit: 10,
        },
      });

      const result = response.data?.data;

      setPayments(result?.payments ?? []);
      setPagination(
        result?.pagination ?? {
          currentPage: 1,
          totalPages: 0,
          totalPayments: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load payments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, status, method, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatus("all");
    setMethod("all");
    setPage(1);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review RideSync payment transactions and their statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Matching payments</p>
          <p className="mt-2 text-2xl font-semibold">
            {pagination.totalPayments}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Current page</p>
          <p className="mt-2 text-2xl font-semibold">
            {pagination.currentPage}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Total pages</p>
          <p className="mt-2 text-2xl font-semibold">
            {pagination.totalPages}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 md:grid-cols-4"
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          maxLength={100}
          placeholder="Search transaction or Razorpay reference..."
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2"
        />

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={method}
          onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
        >
          <option value="all">All methods</option>
          {METHODS.map((item) => (
            <option key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex gap-2 md:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Search
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800"
          >
            Clear filters
          </button>
        </div>
      </form>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchPayments}
            className="underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full min-w-[1150px] text-left text-sm">
          <thead className="border-b border-gray-800 bg-gray-950 text-gray-400">
            <tr>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Passenger</th>
              <th className="px-4 py-3">Ride</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Razorpay reference</th>
              <th className="px-4 py-3">Paid at</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id} className="align-top hover:bg-gray-800/40">
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      #{payment._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {payment.transactionId || payment._id}
                    </p>
                    {payment.failureReason && (
                      <p className="mt-2 max-w-48 break-words text-xs text-red-400">
                        {payment.failureReason}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <p>{payment.passenger?.name || "Unknown"}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {payment.passenger?.email || "—"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p>
                      #{payment.ride?._id
                        ? payment.ride._id.slice(-6).toUpperCase()
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {payment.ride?.status || "—"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 capitalize">
                      {payment.ride?.vehicleType || ""}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>

                  <td className="px-4 py-4 capitalize">
                    {payment.method || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td className="max-w-56 px-4 py-4">
                    <p className="break-all text-xs">
                      Order: {payment.razorpayOrderId || "—"}
                    </p>
                    <p className="mt-2 break-all text-xs text-gray-400">
                      Payment: {payment.razorpayPaymentId || "—"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-gray-400">
                    {formatDate(payment.paidAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-400">
          Showing {payments.length} payments on page{" "}
          {pagination.currentPage} of {pagination.totalPages}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}