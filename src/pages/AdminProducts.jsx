import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { productService } from "../services/productService";
import { Loader } from "../components/Loader";

const initialFormData = {
  name: "",
  category: "",
  price: "",
  stock: "",
  image: "",
  description: "",
};

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      setProducts(response.data);
    } catch (loadError) {
      setError("Failed to load products. Please try again.");
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image,
      description: product.description,
    });
    setError(null);
    setSuccessMessage("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Delete this product from the catalog?");

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage("");
      await productService.deleteProduct(productId);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
      if (editingId === productId) {
        resetForm();
      }
      setSuccessMessage("Product deleted successfully.");
    } catch (deleteError) {
      setError("Failed to delete product. Please try again.");
      console.error(deleteError);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage("");

    try {
      if (editingId) {
        const response = await productService.updateProduct(
          editingId,
          formData,
        );
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editingId ? response.data : product,
          ),
        );
        setSuccessMessage("Product updated successfully.");
      } else {
        const response = await productService.createProduct(formData);
        setProducts((currentProducts) => [response.data, ...currentProducts]);
        setSuccessMessage("Product created successfully.");
      }

      resetForm();
    } catch (saveError) {
      setError("Failed to save product. Please check the form and try again.");
      console.error(saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Panel</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Product Management
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            Add, edit, and remove catalog items from the admin control center.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-soft">
            <p className="text-sm text-gray-500">Total products</p>
            <p className="text-3xl font-bold text-gray-900">
              {products.length}
            </p>
          </div>
          <Link to="/admin" className="btn-secondary gap-2 py-3 px-5">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-8">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 sm:p-8 h-fit">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {editingId ? "Edit product" : "Add product"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId
                  ? "Update the selected product details."
                  : "Create a new item in the catalog."}
              </p>
            </div>
            {editingId ? (
              <button onClick={resetForm} className="btn-secondary px-3 py-2">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
            )}
          </div>

          {error ? (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-medium">
              {successMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Premium Wireless Headphones"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Electronics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input-field"
                placeholder="299.99"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-32 resize-y"
                placeholder="Write a concise product description"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary py-3"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Create Product"}
              </span>
            </button>
          </form>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Catalog</h2>
              <p className="text-sm text-gray-500 mt-1">
                Current demo inventory available to shoppers.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <div className="px-6 sm:px-8 py-12 text-center text-gray-500">
                No products available.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="px-6 sm:px-8 py-5 flex flex-col lg:flex-row lg:items-center gap-5"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-2xl object-cover object-center bg-gray-50 border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                          {product.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 max-w-2xl">
                        {product.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          Rs.{product.price.toFixed(2)}
                        </span>
                        <span>Stock: {product.stock}</span>
                        <span className="truncate max-w-md">
                          ID: {product.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 lg:justify-end">
                    <button
                      onClick={() => handleEdit(product)}
                      className="btn-secondary px-4 py-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};
