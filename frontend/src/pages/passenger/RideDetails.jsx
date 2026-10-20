import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext.jsx";

import { getRideById, cancelRide } from "../../api/rideApi.js";
import {
  connectSocket,
  joinRideRoom,
  leaveRideRoom,
  getSocket,
} from "../../lib/socket.js";

import { startRazorpayPayment } from "../../lib/paymentHandler.js";
import { createPaymentForRide } from "../../api/paymentApi.js";

function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [payment, setPayment] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // --------------------------------------------------
  // Ride status configuration
  // --------------------------------------------------

  const statusConfig = {
    REQUESTED: {
      label: "Ride Requested",
      description: "Your ride request has been created.",
    },

    SEARCHING: {
      label: "Finding Driver",
      description: "Looking for a nearby driver.",
    },

    DRIVER_ASSIGNED: {
      label: "Driver Assigned",
      description: "A driver has accepted your ride.",
    },

    DRIVER_ARRIVING: {
      label: "Driver Arriving",
      description: "Your driver is on the way.",
    },

    DRIVER_ARRIVED: {
      label: "Driver Arrived",
      description: "Your driver has arrived at the pickup location.",
    },

    IN_PROGRESS: {
      label: "Ride In Progress",
      description: "Your trip is currently in progress.",
    },

    COMPLETED: {
      label: "Ride Completed",
      description: "Your trip has been completed.",
    },

    PAYMENT_PENDING: {
      label: "Payment Pending",
      description: "Complete payment for your ride.",
    },

    PAID: {
      label: "Payment Completed",
      description: "Your ride has been paid successfully.",
    },

    CANCELLED: {
      label: "Ride Cancelled",
      description: "This ride has been cancelled.",
    },
  };

  // --------------------------------------------------
  // Ride status timeline
  // --------------------------------------------------

  const statusTimeline = [
    "REQUESTED",
    "SEARCHING",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "PAYMENT_PENDING",
    "PAID",
  ];

  // --------------------------------------------------
  // Fetch ride
  // --------------------------------------------------

  const fetchRide = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await getRideById(rideId);


        console.log("Ride API response:", response);

        // Handle the possible response structures safely
        const rideData =
          response?.data?.ride || response?.ride || response?.data?.data?.ride;

        const paymentData =
          response?.data?.payment ||
          response?.payment ||
          response?.data?.data?.payment;

        console.log("Extracted ride:", rideData);
        console.log("Extracted payment:", paymentData);

        if (!rideData) {
          throw new Error(
            "Ride information could not be loaded from the server.",
          );
        }

        setRide(rideData);
        setPayment(paymentData || null);
      } catch (err) {
        console.error("Failed to fetch ride:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load ride details.",
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [rideId],
  );

  // --------------------------------------------------
  // Initial fetch
  // --------------------------------------------------

  useEffect(() => {
    fetchRide(true);
  }, [fetchRide]);

  useEffect(() => {
    if (!rideId) {
      return;
    }

    const socket = connectSocket();

    if (!socket) {
      return;
    }

    const joinRoom = () => {
      joinRideRoom(rideId);
    };

    const handleDriverLocation = (location) => {
      console.log("Passenger received driver location:", location);

      if (location.rideId?.toString() !== rideId) {
        return;
      }

      setDriverLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
    };

    socket.on("connect", joinRoom);

    socket.on("driver:location:update", handleDriverLocation);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);

      socket.off("driver:location:update", handleDriverLocation);

      leaveRideRoom(rideId);
    };
  }, [rideId]);
  // --------------------------------------------------
  // Poll ride while active
  // --------------------------------------------------

  useEffect(() => {
    if (!ride) {
      return;
    }

    const activeStatuses = [
      "REQUESTED",
      "SEARCHING",
      "DRIVER_ASSIGNED",
      "DRIVER_ARRIVING",
      "DRIVER_ARRIVED",
      "IN_PROGRESS",
      "PAYMENT_PENDING",
    ];

    if (!activeStatuses.includes(ride.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchRide(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [ride?.status, fetchRide]);

  // --------------------------------------------------
  // Cancel ride
  // --------------------------------------------------

  const handleCancelRide = async () => {
    if (!ride?._id) {
      return;
    }

    if (!cancelReason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }

    try {
      setCancelling(true);
      setError("");

      await cancelRide(ride._id, cancelReason.trim());

      setCancelReason("");

      await fetchRide(false);
    } catch (err) {
      console.error("Failed to cancel ride:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to cancel ride.",
      );
    } finally {
      setCancelling(false);
    }
  };

  // --------------------------------------------------
  // Razorpay payment
  // --------------------------------------------------

  const handlePayment = async () => {
    if (!rideId || ride?.status !== "PAYMENT_PENDING") {
      setPaymentError("This ride is not currently awaiting payment.");
      return;
    }

    if (!user) {
      setPaymentError("User information is not available.");

      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError("");
      setPaymentMessage("");

      // Usually completeTrip creates the payment. This endpoint safely returns
      // the existing record or creates it if an older/incomplete ride has none.
      let paymentToUse = payment;
      if (!paymentToUse?._id) {
        const createResponse = await createPaymentForRide(rideId);
        paymentToUse =
          createResponse?.data?.payment ||
          createResponse?.payment ||
          createResponse?.data?.data?.payment ||
          null;

        if (!paymentToUse?._id) {
          throw new Error("The server did not return a valid payment record.");
        }
        setPayment(paymentToUse);
      }

      if (paymentToUse.status === "SUCCESS") {
        setPaymentMessage("This ride has already been paid.");
        await fetchRide(false);
        return;
      }

      if (paymentToUse.status !== "PENDING") {
        throw new Error(
          `Payment cannot start while its status is ${paymentToUse.status}. Please refresh or contact support if the payment is stuck.`,
        );
      }

      await startRazorpayPayment({
        paymentId: paymentToUse._id,
        user,

        onSuccess: async (response) => {
          console.log("Payment completed successfully:", response);

          setPaymentMessage("Payment completed successfully!");

          // Refresh ride/payment information
          await fetchRide(false);
        },

        onFailure: (error) => {
          console.error("Payment failed:", error);

          setPaymentError(
            error?.response?.data?.message ||
              error?.message ||
              "Payment failed. Please try again.",
          );
        },
      });
    } catch (err) {
      console.error("Unable to start payment:", err);

      setPaymentError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start payment.",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString();
  };

  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) {
      return "—";
    }

    return `${Number(distance).toFixed(2)} km`;
  };

  const formatDuration = (duration) => {
    if (duration === undefined || duration === null) {
      return "—";
    }

    return `${Math.round(Number(duration))} min`;
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
      return "₹0";
    }

    return `₹${Number(amount).toFixed(2)}`;
  };

  const getStatusLabel = (status) => {
    return statusConfig[status]?.label || status || "Unknown";
  };

  const getStatusDescription = (status) => {
    return statusConfig[status]?.description || "Ride status updated.";
  };

  const getStatusIndex = (status) => {
    return statusTimeline.indexOf(status);
  };

  const canCancelRide = [
    "REQUESTED",
    "SEARCHING",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
  ].includes(ride?.status);

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-400">Loading ride details...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Error / ride not found
  // --------------------------------------------------

  if (error && !ride) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-semibold mb-3">Unable to Load Ride</h1>

          <p className="text-red-400 mb-6">{error}</p>

          <button
            type="button"
            onClick={() => fetchRide(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!ride) {
    return null;
  }

  const currentStatusIndex = getStatusIndex(ride.status);

  const currentStatus = statusConfig[ride.status];

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <button
              type="button"
              onClick={() => navigate("/passenger/rides")}
              className="text-sm text-gray-400 hover:text-white mb-2"
            >
              ← Back to Ride History
            </button>

            <h1 className="text-2xl font-bold">Ride Details</h1>

            <p className="text-sm text-gray-500 mt-1">Ride ID: {ride._id}</p>
          </div>

          <button
            type="button"
            onClick={() => fetchRide(false)}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm transition"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* General error */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Status card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Status</p>

              <h2 className="text-2xl font-bold">
                {getStatusLabel(ride.status)}
              </h2>

              <p className="text-gray-400 mt-2">
                {getStatusDescription(ride.status)}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">Estimated Fare</p>

              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(ride.estimatedFare)}
              </p>

              {ride.finalFare !== undefined && ride.finalFare !== null && (
                <p className="text-sm text-gray-400 mt-1">
                  Final Fare: {formatCurrency(ride.finalFare)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6">Ride Progress</h2>

          <div className="space-y-5">
            {statusTimeline.map((status, index) => {
              const completed = currentStatusIndex >= index;

              const isCurrent = ride.status === status;

              return (
                <div key={status} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
                        completed
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-500"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </div>

                    {index < statusTimeline.length - 1 && (
                      <div
                        className={`w-px h-8 mt-1 ${
                          currentStatusIndex > index
                            ? "bg-blue-600"
                            : "bg-gray-700"
                        }`}
                      />
                    )}
                  </div>

                  <div className="pt-1">
                    <p
                      className={`font-medium ${
                        isCurrent
                          ? "text-blue-400"
                          : completed
                            ? "text-white"
                            : "text-gray-500"
                      }`}
                    >
                      {getStatusLabel(status)}
                    </p>

                    {isCurrent && (
                      <p className="text-sm text-gray-500 mt-1">
                        Current status
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {ride.status === "CANCELLED" && (
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center">
                  ✕
                </div>

                <div>
                  <p className="font-medium text-red-400">Ride Cancelled</p>

                  {ride.cancellationReason && (
                    <p className="text-sm text-gray-400 mt-1">
                      Reason: {ride.cancellationReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pickup / destination */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Route</h2>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-green-500 shrink-0" />

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Pickup
                  </p>

                  <p className="text-gray-200 mt-1">
                    {ride.pickup?.address || "Pickup location"}
                  </p>
                </div>
              </div>

              <div className="ml-1.5 h-8 border-l border-dashed border-gray-700" />

              <div className="flex gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-red-500 shrink-0" />

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Destination
                  </p>

                  <p className="text-gray-200 mt-1">
                    {ride.destination?.address || "Destination"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip information */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Trip Information</h2>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-gray-500">Vehicle Type</p>

                <p className="mt-1 capitalize font-medium">
                  {ride.vehicleType || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Distance</p>

                <p className="mt-1 font-medium">
                  {formatDistance(ride.distance)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Estimated Duration</p>

                <p className="mt-1 font-medium">
                  {formatDuration(ride.estimatedDuration)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Requested</p>

                <p className="mt-1 font-medium text-sm">
                  {formatDate(ride.requestedAt || ride.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver information */}
        {ride.driver && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-5">Driver Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500">Driver</p>

                <p className="mt-1 font-medium text-lg">
                  {ride.driver?.user?.name || "Driver"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Phone</p>

                <p className="mt-1 font-medium">
                  {ride.driver?.user?.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Rating</p>

                <p className="mt-1 font-medium">
                  ⭐ {ride.driver?.rating ?? "—"}
                </p>
              </div>
            </div>

            {/* Live location placeholder */}
            <div className="mt-6 p-4 bg-gray-950 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />

                <div>
                  <p className="font-medium">Driver Tracking</p>

                  <p className="text-sm text-gray-500">
                    Live driver location will be available after Socket.IO
                    integration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment section */}
        {ride.status === "PAYMENT_PENDING" && (
          <div className="bg-gray-900 border border-yellow-800/50 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-sm text-yellow-400 mb-1">Payment Required</p>

                <h2 className="text-xl font-semibold">
                  Complete your ride payment
                </h2>

                <p className="text-gray-400 mt-2">
                  Your ride has been completed. Please complete the payment to
                  finish the ride.
                </p>

                <p className="text-2xl font-bold text-green-400 mt-4">
                  {formatCurrency(ride.finalFare ?? ride.estimatedFare)}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={paymentLoading || payment?.status === "SUCCESS"}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-semibold transition"
                >
                  {paymentLoading ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>

            {!payment?._id && (
              <div className="mt-5 p-4 bg-yellow-950/30 border border-yellow-800 rounded-xl text-yellow-300 text-sm">
                A payment record will be retrieved or created securely when you
                click Pay Now.
              </div>
            )}

            {paymentError && (
              <div className="mt-5 p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
                {paymentError}
              </div>
            )}

            {paymentMessage && (
              <div className="mt-5 p-4 bg-green-950/40 border border-green-800 rounded-xl text-green-300">
                {paymentMessage}
              </div>
            )}
          </div>
        )}

        {/* Payment completed */}
        {ride.status === "PAID" && (
          <div className="bg-gray-900 border border-green-800/50 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-full bg-green-600 flex items-center justify-center text-xl shrink-0">
                ✓
              </div>

              <div>
                <h2 className="text-xl font-semibold text-green-400">
                  Payment Completed
                </h2>

                <p className="text-gray-400 mt-1">
                  Your payment for this ride was successful.
                </p>

                {payment?.razorpayPaymentId && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">Razorpay Payment ID</p>

                    <p className="text-sm text-gray-300 mt-1 break-all">
                      {payment.razorpayPaymentId}
                    </p>
                  </div>
                )}

                <p className="text-2xl font-bold text-green-400 mt-4">
                  {formatCurrency(
                    payment?.amount ?? ride.finalFare ?? ride.estimatedFare,
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel ride */}
        {canCancelRide && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold">Cancel Ride</h2>

            <p className="text-sm text-gray-500 mt-1 mb-4">
              You can cancel the ride while the driver is being assigned or
              arriving.
            </p>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                maxLength={200}
                placeholder="Enter cancellation reason"
                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={handleCancelRide}
                disabled={cancelling}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-medium transition"
              >
                {cancelling ? "Cancelling..." : "Cancel Ride"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate("/passenger/rides")}
            className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            View Ride History
          </button>

          <button
            type="button"
            onClick={() => navigate("/passenger")}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Passenger Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default RideDetails;
