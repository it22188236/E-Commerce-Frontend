import apiClient from "../utils/apiClient";

const unwrap = (response) => response?.data?.data ?? response?.data;

const normalizeEndpoint = (endpoint = "") => {
  if (!endpoint) return "";
  const withLeadingSlash = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return withLeadingSlash.startsWith("/api/")
    ? withLeadingSlash.replace("/api", "")
    : withLeadingSlash;
};

const PRODUCTS_ENDPOINT = normalizeEndpoint(
  import.meta.env.VITE_PRODUCTS_ENDPOINT || "/products",
);

const normalizeProduct = (product) => {
  if (!product) return product;
  const primaryImage =
    product.image ??
    product.imageUrl ??
    product.thumbnail ??
    (Array.isArray(product.images) ? product.images[0]?.url : "") ??
    "";
  return {
    ...product,
    id: product.id ?? product._id ?? product.productId,
    name: product.name ?? product.title ?? "",
    category: product.category ?? "Uncategorized",
    description: product.description ?? "",
    image: primaryImage,
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? product.quantity ?? 0),
  };
};

const normalizeProductList = (payload) =>
  Array.isArray(payload) ? payload.map(normalizeProduct) : [];

const buildProductPayload = (d) => ({
  name: d.name?.trim(),
  category: d.category?.trim().toLowerCase(),
  description: d.description?.trim(),
  images: d.image
    ? [{ url: d.image, alt: d.name?.trim() || "Product image" }]
    : [],
  price: Number(d.price ?? 0),
  stock: Number(d.stock ?? 0),
});

export const productService = {
  getProducts: async () => {
    const response = await apiClient.request({
      method: "get",
      url: PRODUCTS_ENDPOINT,
    });
    return { data: normalizeProductList(unwrap(response)) };
  },

  getProductById: async (id) => {
    const response = await apiClient.request({
      method: "get",
      url: `${PRODUCTS_ENDPOINT}/${id}`,
    });
    return { data: normalizeProduct(unwrap(response)) };
  },

  createProduct: async (productData) => {
    const response = await apiClient.request({
      method: "post",
      url: PRODUCTS_ENDPOINT,
      data: buildProductPayload(productData),
    });
    return { data: normalizeProduct(unwrap(response)) };
  },

  updateProduct: async (id, productData) => {
    const response = await apiClient.request({
      method: "put",
      url: `${PRODUCTS_ENDPOINT}/${id}`,
      data: buildProductPayload(productData),
    });
    return { data: normalizeProduct(unwrap(response)) };
  },

  deleteProduct: async (id) => {
    const response = await apiClient.request({
      method: "delete",
      url: `${PRODUCTS_ENDPOINT}/${id}`,
    });
    return { data: unwrap(response) ?? { id } };
  },
};
