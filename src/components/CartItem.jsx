import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

export const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className="flex items-center p-4 bg-white rounded-2xl shadow-soft border border-gray-100 mb-4"
    >
      <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="ml-6 flex-1 flex flex-col justify-between h-24">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {item.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Rs.{item.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            aria-label="Remove item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-1.5 font-medium text-gray-900 min-w-[3rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="font-bold text-lg text-gray-900">
            Rs.{(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
