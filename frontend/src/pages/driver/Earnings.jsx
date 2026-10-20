import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDriverEarnings } from "../../api/driverApi.js";

const filters = [
  { label: "All payments", value: "" },
  { label: "Successful", value: "SUCCESS" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function dateLabel(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Earnings() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["driverEarnings", page, status],
    queryFn: () => getDriverEarnings({ page, limit: 10, status }),
    refetchOnWindowFocus: true,
  });

  const result = data?.data;
  const summary = result?.summary;
  const payments = result?.payments ?? [];
  const pagination = result?.pagination;

  const summaryCards = [
    {
      label: "Total earned",
      value: money(summary?.totalEarned),
      note: "Successful payments only",
      icon: "₹",
      color: "text-green-400",
    },
    {
      label: "Paid trips",
      value: summary?.paidTrips ?? 0,
      note: "Payments confirmed",
      icon: "✓",
      color: "text-blue-400",
    },
    {
      label: "Pending payments",
      value: summary?.pendingPayments ?? 0,
      note: "Awaiting payment confirmation",
      icon: "◷",
      color: "text-yellow-400",
    },
    {
      label: "Average per paid trip",
      value: money(summary?.averagePerPaidTrip),
      note: "Average successful payment",
      icon: "↗",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="mt-2 text-sm text-gray-400">
            Track your confirmed earnings and payment history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-900 bg-gray-900 p-5"
        >
          <p className="font-semibold text-red-300">Unable to load earnings</p>
          <p className="mt-2 text-sm text-gray-400">
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Try again
          </button>
        </div>
      )}

      {!isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-400">{card.label}</p>
                  <span className={`text-xl ${card.color}`}>{card.icon}</span>
                </div>

                <p className="mt-4 break-words text-2xl font-bold">
                  {isLoading ? "—" : card.value}
                </p>
                <p className="mt-2 text-xs text-gray-500">{card.note}</p>
              </article>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-semibold">Payment history</h2>
                <p className="mt-1 text-sm text-gray-400">
                  View trip payments and their current status.
                </p>
              </div>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                aria-label="Filter payment status"
              >
                {filters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-400">
                Loading payment history...
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-2xl text-gray-400">
                  ₹
                </div>
                <h3 className="mt-4 font-semibold">No payments found</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Payments for your rides will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-800">
                  {payments.map((payment) => {
                    const ride = payment.ride;
                    const paid = payment.status === "SUCCESS";

                    return (
                      <article
                        key={payment._id}
                        className="p-5 transition hover:bg-gray-800/30 sm:p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {ride?.vehicleType
                                ? `${ride.vehicleType.charAt(0).toUpperCase()}${ride.vehicleType.slice(1)} trip`
                                : "Ride payment"}
                            </p>
                            <p className="mt-1 break-all text-xs text-gray-500">
                              Payment ID: {payment._id}
                            </p>
                            <p className="mt-2 text-sm text-gray-400">
                              {dateLabel(payment.paidAt || payment.createdAt)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-xl font-bold ${
                                paid ? "text-green-400" : "text-white"
                              }`}
                            >
                              {money(payment.amount)}
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                paid
                                  ? "border-green-900 bg-green-950 text-green-300"
                                  : payment.status === "FAILED" ||
                                      payment.status === "REFUNDED"
                                    ? "border-red-900 bg-red-950 text-red-300"
                                    : "border-yellow-900 bg-yellow-950 text-yellow-300"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 rounded-xl bg-gray-950/70 p-4 sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Pickup
                            </p>
                            <p className="mt-1 break-words text-sm text-gray-200">
                              {ride?.pickup?.address || "Address unavailable"}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Destination
                            </p>
                            <p className="mt-1 break-words text-sm text-gray-200">
                              {ride?.destination?.address ||
                                "Address unavailable"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                          <span>
                            Method: {payment.method || "Not recorded"}
                          </span>
                          {ride?._id && (
                            <span className="break-all">Ride: {ride._id}</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 p-4">
                    <p className="text-sm text-gray-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!pagination.hasPrevPage}
                        onClick={() =>
                          setPage((current) => Math.max(1, current - 1))
                        }
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Earnings;
