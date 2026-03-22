// Mock data for the frontend since we don't have a real backend
export const mockProducts = [
{
  id: '1',
  name: 'Premium Wireless Headphones',
  price: 299.99,
  description:
  'High-fidelity audio with active noise cancellation and 30-hour battery life. Perfect for audiophiles and professionals.',
  image:
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
  category: 'Electronics',
  stock: 15
},
{
  id: '2',
  name: 'Minimalist Smartwatch',
  price: 199.5,
  description:
  'Track your fitness, receive notifications, and look stylish with this sleek, water-resistant smartwatch.',
  image:
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
  category: 'Wearables',
  stock: 8
},
{
  id: '3',
  name: 'Ergonomic Office Chair',
  price: 450.0,
  description:
  'Fully adjustable ergonomic chair designed for long hours of comfortable work. Features lumbar support and breathable mesh.',
  image:
  'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800',
  category: 'Furniture',
  stock: 5
},
{
  id: '4',
  name: 'Mechanical Keyboard',
  price: 129.99,
  description:
  'Tactile mechanical switches with customizable RGB backlighting and a durable aluminum frame.',
  image:
  'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800',
  category: 'Accessories',
  stock: 20
},
{
  id: '5',
  name: '4K Ultra HD Monitor',
  price: 399.0,
  description:
  '27-inch 4K display with vibrant colors and ultra-thin bezels. Ideal for creative work and immersive gaming.',
  image:
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800',
  category: 'Electronics',
  stock: 12
},
{
  id: '6',
  name: 'Portable SSD 1TB',
  price: 109.99,
  description:
  'Lightning-fast external storage in a compact, rugged design. Transfer files in seconds.',
  image:
  'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&q=80&w=800',
  category: 'Accessories',
  stock: 30
}];


export const mockOrders = [
{
  id: 'ORD-73829',
  date: '2023-10-15T10:30:00Z',
  total: 429.98,
  status: 'Delivered',
  items: [
  {
    productId: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    quantity: 1
  },
  {
    productId: '4',
    name: 'Mechanical Keyboard',
    price: 129.99,
    quantity: 1
  }]

},
{
  id: 'ORD-84920',
  date: '2023-11-02T14:15:00Z',
  total: 199.5,
  status: 'Processing',
  items: [
  {
    productId: '2',
    name: 'Minimalist Smartwatch',
    price: 199.5,
    quantity: 1
  }]

}];