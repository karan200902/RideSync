const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        resolve(true);
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Razorpay Checkout."));
      });

      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Razorpay Checkout."));
    };

    document.body.appendChild(script);
  });
};

export const getRazorpayKeyId = () => {
  if (!RAZORPAY_KEY_ID) {
    throw new Error("Razorpay key ID is missing. Check VITE_RAZORPAY_KEY_ID.");
  }

  return RAZORPAY_KEY_ID;
};

export const openRazorpayCheckout = ({
  order,
  payment,
  user,
  onSuccess,
  onFailure,
}) => {
  const options = {
    key: getRazorpayKeyId(),

    amount: order.amount,

    currency: order.currency || "INR",

    name: "RideSync",

    description: `Ride payment ${payment._id}`,

    order_id: order.id,

    prefill: {
      name: user?.name || "",
      email: user?.email || "",
      contact: user?.phone || "",
    },

    theme: {
      color: "#3b82f6",
    },

    handler: (response) => {
      onSuccess(response);
    },

    modal: {
      ondismiss: () => {
        onFailure?.(new Error("Payment window was closed."));
      },
    },
  };

  const razorpay = new window.Razorpay(options);

  razorpay.on("payment.failed", (response) => {
    console.error("Razorpay payment failed:", response);

    onFailure?.(new Error(response?.error?.description || "Payment failed."));
  });

  razorpay.open();
};
