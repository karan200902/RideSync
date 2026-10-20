import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  confirmPayment,
} from "../api/paymentApi.js";

import { loadRazorpay, openRazorpayCheckout } from "./razorpay.js";

export const startRazorpayPayment = async ({
  paymentId,
  user,
  onSuccess,
  onFailure,
}) => {
  try {
    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    // 1. Load Razorpay Checkout
    await loadRazorpay();

    // 2. Ask backend to create Razorpay order
    const orderResponse = await createRazorpayOrder(paymentId);

    const order = orderResponse?.data?.order;

    const payment = orderResponse?.data?.payment;

    if (!order?.id) {
      throw new Error("Razorpay order was not created.");
    }

    // 3. Open Razorpay Checkout
    openRazorpayCheckout({
      order,
      payment,
      user,

      // 4. Razorpay payment succeeded
      onSuccess: async (razorpayResponse) => {
        try {
          const verificationResponse = await verifyRazorpayPayment(paymentId, {
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,

            razorpayOrderId: razorpayResponse.razorpay_order_id,

            razorpaySignature: razorpayResponse.razorpay_signature,
          });

          if (!verificationResponse?.success) {
            throw new Error("Payment verification failed.");
          }

          // 5. Confirm payment on backend
          const confirmationResponse = await confirmPayment(paymentId);

          if (!confirmationResponse?.success) {
            throw new Error("Payment confirmation failed.");
          }

          onSuccess?.(confirmationResponse);
        } catch (error) {
          console.error("Payment verification error:", error);

          onFailure?.(error);
        }
      },

      onFailure: (error) => {
        console.error("Razorpay checkout error:", error);

        onFailure?.(error);
      },
    });
  } catch (error) {
    console.error("Unable to start Razorpay payment:", error);

    onFailure?.(error);

    throw error;
  }
};
