import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg text-white">MobileStore</span>
            </div>
            <p className="text-sm">India's trusted smartphone store. Best prices, genuine products.</p>
            <p className="text-sm mt-2">📧 support@mobilestore.in</p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-3">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white">All Phones</Link></li>
              <li><Link to="/products?category=Flagship" className="hover:text-white">Flagship</Link></li>
              <li><Link to="/products?category=Budget" className="hover:text-white">Budget</Link></li>
              <li><Link to="/products?onSale=true" className="hover:text-white">On Sale</Link></li>
              <li><Link to="/compare" className="hover:text-white">Compare</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
              <li><Link to="/register" className="hover:text-white">Register</Link></li>
              <li><Link to="/orders" className="hover:text-white">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
              <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
            </ul>
          </div>

          {/* Help & Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3">Help & Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="hover:text-white">Help Centre</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white">Refund & Return Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} MobileStore. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs">Payments secured by</span>
            <span className="text-white font-semibold text-xs bg-blue-600 px-2 py-1 rounded">Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
