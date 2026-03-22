import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle } from "lucide-react";
import { orderService } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/Loader";

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderService.getOrders();
        setOrders(response.data);
      } catch (err) {
        setError("Failed to load orders.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (loading) return <Loader fullScreen />;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-3 mb-8">
        <Package className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl shadow-soft border border-gray-100">
          <p className="text-gray-500 text-lg">
            You haven't placed any orders yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.1,
              }}
              className="bg-white p-6 md:p-8 rounded-3xl shadow-soft border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 pb-6 border-b border-gray-100 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order ID</p>
                  <p className="font-bold text-gray-900 font-mono">
                    {order.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date Placed</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ordered By</p>
                  <p className="font-medium text-gray-900">
                    {order.user?.name || "Unknown User"}
                  </p>
                  {order.user?.email ? (
                    <p className="text-xs text-gray-500">{order.user.email}</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="font-bold text-primary-600">
                    Rs.{order.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${order.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {order.status === "Delivered" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>{order.status}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Items
                </h3>
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm md:text-base"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500 font-medium">
                        {item.quantity}x
                      </span>
                      <span className="text-gray-900 font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      Rs.{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
