import API from "./axios.js";

// Create or retrieve the payment record for a ride
export const createPaymentForRide = async (rideId) => {
  const response = await API.post(`/rides/${rideId}/payment`);
  return response.data;
};

// Create Razorpay order
export const createRazorpayOrder = async (paymentId) => {
  const response = await API.post(`/payments/${paymentId}/razorpay/order`);

  return response.data;
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (paymentId, paymentData) => {
  const response = await API.post(
    `/payments/${paymentId}/razorpay/verify`,
    paymentData,
  );

  return response.data;
};

// Confirm payment
export const confirmPayment = async (paymentId) => {
  const response = await API.post(`/payments/${paymentId}/razorpay/confirm`);

  return response.data;
};
