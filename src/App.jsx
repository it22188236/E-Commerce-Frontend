import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { AppRoutes } from "./routes/AppRoutes";

export function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
            <Navbar />
            <main className="flex-grow">
              <AppRoutes />
            </main>

            {/* Simple Footer */}
            <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                <p>
                  &copy; {new Date().getFullYear()} NexusStore E-commerce
                  Platform. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
