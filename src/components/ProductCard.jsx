import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const handleAddToCart = (event) => {
    event.preventDefault();
    addToCart(product);
  };
  return (
    <motion.div
      whileHover={{
        y: -5,
      }}
      className="bg-white rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col h-full"
    >
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-square overflow-hidden bg-gray-50"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700 shadow-sm">
            {product.category}
          </span>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xl font-bold text-gray-900 mt-2">
            Rs.{product.price.toFixed(2)}
          </p>
        </Link>

        <button
          onClick={handleAddToCart}
          className="mt-4 w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-primary-600 text-gray-700 hover:text-white py-2.5 rounded-xl font-medium transition-colors duration-200"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </motion.div>
  );
};
