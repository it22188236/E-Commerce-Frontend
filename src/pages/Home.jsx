import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../components/ProductCard';
import { Loader } from '../components/Loader';
import { productService } from '../services/productService';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts();
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <Loader fullScreen />;
  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Featured Collection
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our curated selection of premium products designed to elevate
          your everyday life.
        </p>
      </div>

      {error ?
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
          {error}
        </div> :

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product, index) =>
        <motion.div
          key={product.id}
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: index * 0.1
          }}>
          
              <ProductCard product={product} />
            </motion.div>
        )}
        </div>
      }
    </motion.div>
  );
};