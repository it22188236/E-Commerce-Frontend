// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { motion } from "framer-motion";
// import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";
// import { orderService } from "../services/orderService";

// const splitName = (fullName = "") => {
//   const parts = fullName.trim().split(/\s+/).filter(Boolean);
//   return {
//     firstName: parts[0] || "Customer",
//     lastName: parts.slice(1).join(" ") || "User",
//   };
// };

// const getPaymentPayload = (payment) => {
//   if (!payment) return null;
//   return payment?.data ?? payment;
// };

// export const Checkout = () => {
//   const { items, totalPrice, clearCart } = useCart();
//   const { isAuthenticated, user } = useAuth();
//   const navigate = useNavigate();
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [error, setError] = useState(null);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       fullName: user?.name || "",
//       email: user?.email || "",
//     },
//   });

//   const finalTotal =
//     totalPrice + (totalPrice > 50 ? 0 : 10) + totalPrice * 0.08;
//   const itemsTotal = items.reduce(
//     (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 1),
//     0,
//   );

//   const onSubmit = async (data) => {
//     setIsProcessing(true);
//     setError(null);

//     try {
//       const { firstName, lastName } = splitName(data.fullName);

//       const orderResponse = await orderService.createOrder({
//         user: {
//           userId: user?.userId ?? user?.id ?? user?._id ?? null,
//           email: data.email,
//           name: data.fullName,
//         },
//         items: items.map((item) => ({
//           productId: item.id,
//           productName: item.name,
//           quantity: item.quantity,
//           price: item.price,
//           subtotal: Number(item.price ?? 0) * Number(item.quantity ?? 1),
//         })),
//         totalAmount: Number(itemsTotal),
//         shippingAddress: {
//           street: data.address,
//           city: data.city,
//           zipCode: data.zipCode,
//           state: "N/A",
//           country: data.country || "Sri Lanka",
//         },
//         customer: {
//           firstName,
//           lastName,
//           email: data.email,
//           phone: data.phone,
//         },
//         paymentMethod: "payhere",
//       });

//       const payment = getPaymentPayload(orderResponse?.data?.payment);
//       const paymentStatus = String(
//         payment?.status ?? payment?.paymentStatus ?? "",
//       ).toLowerCase();
//       const redirectUrl =
//         payment?.checkoutUrl ?? payment?.redirectUrl ?? payment?.paymentUrl;

//       if (redirectUrl) {
//         window.location.href = redirectUrl;
//         return;
//       }

//       if (paymentStatus === "failed") {
//         throw new Error(payment?.message || "Payment processing failed");
//       }

//       clearCart();
//       setIsSuccess(true);
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           err.response?.data?.error ||
//           err.message ||
//           "Payment failed. Please try again.",
//       );
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   if (items.length === 0 && !isSuccess) {
//     navigate("/cart");
//     return null;
//   }

//   if (!isAuthenticated && !isSuccess) {
//     navigate("/login", {
//       state: {
//         from: "/checkout",
//       },
//     });
//     return null;
//   }

//   if (isSuccess) {
//     return (
//       <motion.div
//         initial={{
//           opacity: 0,
//           scale: 0.95,
//         }}
//         animate={{
//           opacity: 1,
//           scale: 1,
//         }}
//         className="max-w-2xl mx-auto px-4 py-24 text-center"
//       >
//         <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
//           <CheckCircle className="w-12 h-12 text-green-500" />
//         </div>
//         <h1 className="text-4xl font-bold text-gray-900 mb-4">
//           Payment Completed!
//         </h1>
//         <p className="text-lg text-gray-600 mb-8">
//           Your order was placed successfully. You can track your order status
//           from the orders page.
//         </p>
//         <button
//           onClick={() => navigate("/orders")}
//           className="btn-primary px-8 py-3 text-lg"
//         >
//           View My Orders
//         </button>
//       </motion.div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
//         <div className="lg:col-span-2">
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
//             <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
//               <h2 className="text-xl font-bold text-gray-900 mb-6">
//                 Shipping Information
//               </h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Full Name
//                   </label>
//                   <input
//                     {...register("fullName", {
//                       required: "Full name is required",
//                     })}
//                     className="input-field"
//                     placeholder="John Doe"
//                   />
//                   {errors.fullName && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {errors.fullName.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Email
//                   </label>
//                   <input
//                     {...register("email", {
//                       required: "Email is required",
//                       pattern: {
//                         value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//                         message: "Enter a valid email",
//                       },
//                     })}
//                     className="input-field"
//                     placeholder="you@example.com"
//                   />
//                   {errors.email && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {errors.email.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Phone
//                   </label>
//                   <input
//                     {...register("phone", {
//                       required: "Phone number is required",
//                     })}
//                     className="input-field"
//                     placeholder="0771234567"
//                   />
//                   {errors.phone && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {errors.phone.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Address
//                   </label>
//                   <input
//                     {...register("address", {
//                       required: "Address is required",
//                     })}
//                     className="input-field"
//                     placeholder="123 Main St"
//                   />
//                   {errors.address && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {errors.address.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     City
//                   </label>
//                   <input
//                     {...register("city", { required: "City is required" })}
//                     className="input-field"
//                     placeholder="Colombo"
//                   />
//                   {errors.city && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {errors.city.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     ZIP Code
//                   </label>
//                   <input
//                     {...register("zipCode", {
//                       required: "ZIP code is required",
//                     })}
//                     className="input-field"
//                     placeholder="10001"
//                   />
//                   {errors.zipCode && (
//                     <p className="text-red-500 text-sm mt-1">
//                       {errors.zipCode.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Country
//                   </label>
//                   <input
//                     {...register("country")}
//                     className="input-field"
//                     placeholder="Sri Lanka"
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
//               <div className="flex items-center space-x-3">
//                 <CreditCard className="w-6 h-6 text-primary-600" />
//                 <h2 className="text-xl font-bold text-gray-900">
//                   Pay with PayHere
//                 </h2>
//               </div>
//               <p className="text-gray-600 mt-3">
//                 Your payment will be processed securely.
//               </p>
//             </div>

//             {error && (
//               <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium flex items-center space-x-2">
//                 <span>{error}</span>
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={isProcessing}
//               className="w-full btn-primary py-4 text-lg font-bold shadow-lg shadow-primary-600/30 flex items-center justify-center space-x-2"
//             >
//               {isProcessing ? (
//                 <>
//                   <Loader2 className="w-6 h-6 animate-spin" />
//                   <span>Processing Payment...</span>
//                 </>
//               ) : (
//                 <span>Pay Now - Rs.{finalTotal.toFixed(2)}</span>
//               )}
//             </button>
//           </form>
//         </div>

//         <div className="lg:col-span-1">
//           <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 sticky top-24">
//             <h2 className="text-xl font-bold text-gray-900 mb-6">
//               Order Summary
//             </h2>

//             <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
//               {items.map((item) => (
//                 <div
//                   key={item.id}
//                   className="flex justify-between items-center"
//                 >
//                   <div className="flex items-center space-x-3">
//                     <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-gray-900 line-clamp-1">
//                         {item.name}
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         Qty: {item.quantity}
//                       </p>
//                     </div>
//                   </div>
//                   <span className="text-sm font-medium text-gray-900">
//                     Rs.{(item.price * item.quantity).toFixed(2)}
//                   </span>
//                 </div>
//               ))}
//             </div>

//             <div className="border-t border-gray-100 pt-6 space-y-4 mb-6">
//               <div className="flex justify-between text-gray-600 text-sm">
//                 <span>Subtotal</span>
//                 <span className="font-medium text-gray-900">
//                   Rs.{totalPrice.toFixed(2)}
//                 </span>
//               </div>
//               <div className="flex justify-between text-gray-600 text-sm">
//                 <span>Shipping</span>
//                 <span className="font-medium text-gray-900">
//                   {totalPrice > 50 ? "Free" : "Rs.10.00"}
//                 </span>
//               </div>
//               <div className="flex justify-between text-gray-600 text-sm">
//                 <span>Tax (Estimated)</span>
//                 <span className="font-medium text-gray-900">
//                   Rs.{(totalPrice * 0.08).toFixed(2)}
//                 </span>
//               </div>
//             </div>

//             <div className="border-t border-gray-100 pt-6">
//               <div className="flex justify-between items-center">
//                 <span className="text-lg font-bold text-gray-900">Total</span>
//                 <span className="text-2xl font-bold text-primary-600">
//                   Rs.{finalTotal.toFixed(2)}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";

// 🔹 Split full name
const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Customer",
    lastName: parts.slice(1).join(" ") || "User",
  };
};

// 🔹 Normalize payment response
const getPaymentPayload = (payment) => {
  if (!payment) return null;
  return payment?.data ?? payment;
};

export const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

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

  // 🔹 Calculations
  const finalTotal =
    totalPrice + (totalPrice > 50 ? 0 : 10) + totalPrice * 0.08;

  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 1),
    0,
  );

  // 🔥 MAIN SUBMIT
  const onSubmit = async (data) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { firstName, lastName } = splitName(data.fullName);

      const orderResponse = await orderService.createOrder({
        user: {
          userId: user?.userId ?? user?.id ?? user?._id ?? null,
          email: data.email,
          name: data.fullName,
        },
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: Number(item.price ?? 0) * Number(item.quantity ?? 1),
        })),
        totalAmount: Number(itemsTotal),
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
        },
        paymentMethod: "payhere",
      });

      const payment = getPaymentPayload(orderResponse?.data?.payment);

      if (!payment) {
        throw new Error("Invalid payment response from server");
      }

      const paymentStatus = String(
        payment?.status ?? payment?.paymentStatus ?? "",
      ).toLowerCase();

      const redirectUrl =
        payment?.checkoutUrl || payment?.redirectUrl || payment?.paymentUrl;

      // 🔥 Redirect to PayHere
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // 🔥 Handle failure
      if (paymentStatus === "failed") {
        throw new Error(payment?.message || "Payment failed");
      }

      // 🔥 Fallback success
      clearCart();
      setIsSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Payment failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔹 Redirect guards
  if (items.length === 0 && !isSuccess) {
    navigate("/cart");
    return null;
  }

  if (!isAuthenticated && !isSuccess) {
    navigate("/login", { state: { from: "/checkout" } });
    return null;
  }

  // 🔹 SUCCESS UI
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto px-4 py-24 text-center"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Order Placed Successfully!
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Your order has been placed. You can track your order status from the
          orders page.
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

  // 🔹 UI
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* FORM */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* SHIPPING */}
            <div className="bg-white p-8 rounded-3xl shadow-soft border">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  {...register("fullName", { required: true })}
                  placeholder="Full Name"
                  className="input-field col-span-2"
                />
                <input
                  {...register("email", { required: true })}
                  placeholder="Email"
                  className="input-field"
                />
                <input
                  {...register("phone", { required: true })}
                  placeholder="Phone"
                  className="input-field"
                />
                <input
                  {...register("address", { required: true })}
                  placeholder="Address"
                  className="input-field col-span-2"
                />
                <input
                  {...register("city", { required: true })}
                  placeholder="City"
                  className="input-field"
                />
                <input
                  {...register("zipCode", { required: true })}
                  placeholder="ZIP"
                  className="input-field"
                />
                <input
                  {...register("country")}
                  placeholder="Country"
                  className="input-field col-span-2"
                />
              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-white p-8 rounded-3xl shadow-soft border">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold">Pay with PayHere</h2>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl">
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full btn-primary py-4 text-lg flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay Now - Rs.{finalTotal.toFixed(2)}</>
              )}
            </button>
          </form>
        </div>

        {/* SUMMARY */}
        <div>
          <div className="bg-white p-8 rounded-3xl shadow-soft border sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            {items.map((item) => (
              <div key={item.id} className="flex justify-between mb-3">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <hr className="my-4" />

            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-bold">Rs.{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
