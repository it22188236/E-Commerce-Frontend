import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Box,
  CircleDollarSign,
  ClipboardList,
  Layers3,
  ShieldCheck,
  Store,
  TriangleAlert,
} from "lucide-react";
import { Loader } from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";

const orderStatuses = [
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const formatCurrency = (amount) => `Rs.${Number(amount || 0).toFixed(2)}`;

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const [productsResponse, ordersResponse] = await Promise.all([
          productService.getProducts(),
          orderService.getOrders(),
        ]);
        setProducts(productsResponse.data);
        setOrders(ordersResponse.data);
      } catch (loadError) {
        setError("Failed to load admin dashboard data.");
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const lowStockProducts = products.filter(
      (product) => Number(product.stock) <= 5,
    );
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );
    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered",
    ).length;
    const categories = new Set(
      products.map((product) => product.category).filter(Boolean),
    );

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      totalRevenue,
      deliveredOrders,
      categoryCount: categories.size,
    };
  }, [orders, products]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date) - new Date(firstOrder.date),
        )
        .slice(0, 5),
    [orders],
  );

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      setStatusSavingId(orderId);
      const response = await orderService.updateOrderStatus(
        orderId,
        nextStatus,
      );
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? response.data : order,
        ),
      );
    } catch (statusError) {
      setError("Failed to update order status.");
      console.error(statusError);
    } finally {
      setStatusSavingId(null);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 sm:p-10 text-white shadow-soft mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-200 backdrop-blur-sm mb-5">
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </div>
            <h1 className="max-w-3xl text-4xl sm:text-5xl font-bold tracking-tight">
              Control catalog, orders, and store health from one place.
            </h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-300 leading-7">
              Signed in as {user?.name}. Review inventory risk, update order
              status, and jump directly into management screens.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:min-w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-sm text-slate-300">Revenue tracked</p>
              <p className="mt-2 text-3xl font-bold">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-sm text-slate-300">Delivered orders</p>
              <p className="mt-2 text-3xl font-bold">
                {metrics.deliveredOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-8 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <Box className="h-6 w-6 text-primary-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Products
            </span>
          </div>
          <p className="mt-6 text-4xl font-bold text-gray-900">
            {metrics.totalProducts}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Active items in your catalog
          </p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <ClipboardList className="h-6 w-6 text-primary-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Orders
            </span>
          </div>
          <p className="mt-6 text-4xl font-bold text-gray-900">
            {metrics.totalOrders}
          </p>
          <p className="mt-2 text-sm text-gray-500">Orders currently tracked</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <TriangleAlert className="h-6 w-6 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Risk
            </span>
          </div>
          <p className="mt-6 text-4xl font-bold text-gray-900">
            {metrics.lowStockCount}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Low-stock products needing attention
          </p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <Layers3 className="h-6 w-6 text-primary-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Categories
            </span>
          </div>
          <p className="mt-6 text-4xl font-bold text-gray-900">
            {metrics.categoryCount}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Catalog groups in rotation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Operations center
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Keep the store running by moving between the most used admin
                tasks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              to="/admin/products"
              className="group rounded-3xl border border-gray-100 bg-gray-50 p-5 transition-colors hover:border-primary-200 hover:bg-primary-50"
            >
              <Box className="h-6 w-6 text-primary-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Manage products
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Create, edit, and remove catalog items.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700">
                Open product panel
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              to="/orders"
              className="group rounded-3xl border border-gray-100 bg-gray-50 p-5 transition-colors hover:border-primary-200 hover:bg-primary-50"
            >
              <ClipboardList className="h-6 w-6 text-primary-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Review orders
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Inspect the customer-facing order history page.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700">
                Open order view
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              to="/"
              className="group rounded-3xl border border-gray-100 bg-gray-50 p-5 transition-colors hover:border-primary-200 hover:bg-primary-50"
            >
              <Store className="h-6 w-6 text-primary-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Open storefront
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Verify what shoppers currently see in the catalog.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700">
                View storefront
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-100 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-700">
              <CircleDollarSign className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Revenue snapshot</h3>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Gross revenue</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average order value</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    metrics.totalOrders
                      ? metrics.totalRevenue / metrics.totalOrders
                      : 0,
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completion rate</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {metrics.totalOrders
                    ? `${Math.round((metrics.deliveredOrders / metrics.totalOrders) * 100)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Inventory alerts
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Products at or under five units in stock.
              </p>
            </div>
            <Link
              to="/admin/products"
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Manage catalog
            </Link>
          </div>

          {metrics.lowStockProducts.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-6 text-sm font-medium text-emerald-700">
              Inventory looks healthy. No urgent low-stock items.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-amber-700">
                      {product.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent orders
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Update status directly from the admin dashboard.
            </p>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-gray-500">
            No orders available yet.
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-3xl border border-gray-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-gray-900">{order.id}</p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Ordered by {order.user?.name || "Unknown User"}
                    {order.user?.email ? ` (${order.user.email})` : ""}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.items?.length || 0} items •{" "}
                    {formatCurrency(order.total)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={order.status}
                    onChange={(event) =>
                      handleStatusChange(order.id, event.target.value)
                    }
                    disabled={statusSavingId === order.id}
                    className="input-field min-w-[180px]"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500 min-w-[90px] text-right">
                    {statusSavingId === order.id ? "Saving..." : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};
