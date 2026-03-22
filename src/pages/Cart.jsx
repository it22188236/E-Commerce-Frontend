import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import { CartItem } from "../components/CartItem";

export const Cart = () => {
  const { items, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();
  if (items.length === 0) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="max-w-3xl mx-auto px-4 py-24 text-center"
      >
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center space-x-2 px-8 py-3 text-lg"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart ({totalItems} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <AnimatePresence>
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 h-fit sticky top-24"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">
                Rs.{totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-medium text-gray-900">
                {totalPrice > 50 ? "Free" : "Rs.10.00"}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (Estimated)</span>
              <span className="font-medium text-gray-900">
                Rs.{(totalPrice * 0.08).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-primary-600">
                Rs.
                {(
                  totalPrice +
                  (totalPrice > 50 ? 0 : 10) +
                  totalPrice * 0.08
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="w-full btn-primary py-4 text-lg font-bold shadow-lg shadow-primary-600/30"
          >
            Proceed to Checkout
          </button>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
