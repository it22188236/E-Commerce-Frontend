import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Check, Shield, Truck } from "lucide-react";
import { productService } from "../services/productService";
import { useCart } from "../context/CartContext";
import { Loader } from "../components/Loader";

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await productService.getProductById(id);
        setProduct(response.data);
      } catch (err) {
        setError("Product not found.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };
  if (loading) return <Loader fullScreen />;
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {error || "Product not found"}
        </h2>
        <button
          onClick={() => navigate("/")}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>
      </div>
    );
  }
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <motion.div
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 aspect-square"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          className="flex flex-col justify-center"
        >
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm font-semibold rounded-full">
              {product.category}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {product.name}
          </h1>

          <p className="text-3xl font-bold text-gray-900 mb-6">
            Rs.{product.price.toFixed(2)}
          </p>

          <div className="prose prose-lg text-gray-600 mb-8">
            <p>{product.description}</p>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center space-x-3 text-gray-600">
              <Check className="w-5 h-5 text-green-500" />
              <span>In stock ({product.stock} available)</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Truck className="w-5 h-5 text-primary-500" />
              <span>Free shipping on orders over Rs.50</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Shield className="w-5 h-5 text-primary-500" />
              <span>1-year warranty included</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all duration-300 ${added ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30" : "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30"}`}
            >
              {added ? (
                <>
                  <Check className="w-6 h-6" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
