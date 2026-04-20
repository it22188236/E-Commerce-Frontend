import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Customer",
    lastName: parts.slice(1).join(" ") || "User",
  };
};

export const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [isPayHereReady, setIsPayHereReady] = useState(false);
  const payHereCallbackBoundRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
    },
  });

  const finalTotal =
    totalPrice + (totalPrice > 50 ? 0 : 10) + totalPrice * 0.08;

  useEffect(() => {
    const loadPayHereScript = async () => {
      if (!pendingPayment) {
        return;
      }

      try {
        await paymentService.getPayHereConfig();

        if (window.payhere) {
          setIsPayHereReady(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://www.payhere.lk/lib/payhere.js";
        script.async = true;
        script.onload = () => setIsPayHereReady(true);
        script.onerror = () => setError("Failed to load PayHere SDK script");
        document.body.appendChild(script);
      } catch (configError) {
        setError(configError.message || "Failed to load PayHere configuration");
      }
    };

    loadPayHereScript();
  }, [pendingPayment]);

  useEffect(() => {
    if (!isPayHereReady || !pendingPayment || !window.payhere) {
      return;
    }

    const initiatePayHere = async () => {
      try {
        if (!payHereCallbackBoundRef.current) {
          window.payhere.onCompleted = async (orderId) => {
            await paymentService.capturePayHereOrder(orderId, {
              paymentId: pendingPayment.paymentId,
            });

            clearCart();
            setPendingPayment(null);
            setIsSuccess(true);
          };

          window.payhere.onDismissed = () => {
            setError("PayHere payment was cancelled.");
          };

          window.payhere.onError = (sdkError) => {
            setError(
              sdkError?.message || "PayHere payment failed. Please try again.",
            );
          };

          payHereCallbackBoundRef.current = true;
        }

        const response = await paymentService.createPayHereOrder({
          paymentId: pendingPayment.paymentId,
        });
        const paymentRequest = response?.data;

        if (!paymentRequest) {
          throw new Error("Unable to initialize PayHere order");
        }

        window.payhere.startPayment(paymentRequest);
      } catch (initError) {
        setError(initError?.message || "Unable to start PayHere payment");
      }
    };

    initiatePayHere();
  }, [isPayHereReady, pendingPayment, clearCart]);

  useEffect(() => {
    return () => {
      if (window.payhere) {
        window.payhere.onCompleted = null;
        window.payhere.onDismissed = null;
        window.payhere.onError = null;
      }
      payHereCallbackBoundRef.current = false;
    };
  }, []);

  const onSubmit = async (data) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { firstName, lastName } = splitName(data.fullName);

      const orderResponse = await orderService.createOrder({
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          street: data.address,
          city: data.city,
          zipCode: data.zipCode,
          state: "N/A",
          country: data.country || "Sri Lanka",
        },
        customer: {
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          country: data.country || "Sri Lanka",
        },
        paymentMethod: "card",
      });

      const paymentDetails = orderResponse?.data?.payment;
      const paymentGateway = String(
        paymentDetails?.paymentGateway || "payhere",
      ).toLowerCase();

      if (paymentGateway !== "payhere" && paymentGateway !== "mock") {
        throw new Error("Unsupported payment gateway");
      }

      if (paymentGateway === "payhere") {
        setPendingPayment(paymentDetails);
        return;
      }

      clearCart();
      setIsSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Payment failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    navigate("/cart");
    return null;
  }

  if (!isAuthenticated && !isSuccess) {
    navigate("/login", {
      state: {
        from: "/checkout",
      },
    });
    return null;
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="max-w-2xl mx-auto px-4 py-24 text-center"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Payment Completed!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your order was placed and PayHere payment was completed successfully.
          You can track your order status from the orders page.
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="btn-primary px-8 py-3 text-lg"
        >
          View My Orders
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    {...register("fullName", {
                      required: "Full name is required",
                    })}
                    className="input-field"
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    })}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    {...register("phone", {
                      required: "Phone number is required",
                    })}
                    className="input-field"
                    placeholder="0771234567"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    {...register("address", {
                      required: "Address is required",
                    })}
                    className="input-field"
                    placeholder="123 Main St"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    {...register("city", { required: "City is required" })}
                    className="input-field"
                    placeholder="Colombo"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    {...register("zipCode", {
                      required: "ZIP code is required",
                    })}
                    className="input-field"
                    placeholder="10001"
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.zipCode.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    {...register("country")}
                    className="input-field"
                    placeholder="Sri Lanka"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Pay with PayHere
                </h2>
              </div>
              <p className="text-gray-600 mt-3">
                Your payment will be processed securely with PayHere.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium flex items-center space-x-2">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || Boolean(pendingPayment)}
              className="w-full btn-primary py-4 text-lg font-bold shadow-lg shadow-primary-600/30 flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Initializing PayHere...</span>
                </>
              ) : pendingPayment ? (
                <span>PayHere Order Initialized</span>
              ) : (
                <span>Pay with PayHere - Rs.{finalTotal.toFixed(2)}</span>
              )}
            </button>

            {pendingPayment && (
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <p className="text-sm text-gray-600 mb-4">
                  A PayHere payment window will open to complete your order.
                </p>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Rs.{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  Rs.{totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">
                  {totalPrice > 50 ? "Free" : "Rs.10.00"}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tax (Estimated)</span>
                <span className="font-medium text-gray-900">
                  Rs.{(totalPrice * 0.08).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary-600">
                  Rs.{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
