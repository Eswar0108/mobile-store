import { Link } from 'react-router-dom';
import { useCompareStore } from '../../store/compareStore';
import { formatCurrency } from '../../lib/utils';

export default function CompareBar() {
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clearAll = useCompareStore((s) => s.clearAll);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-700 flex-shrink-0">Compare ({items.length}/3):</span>
        <div className="flex-1 flex items-center gap-3 overflow-x-auto">
          {items.map((product) => (
            <div key={product.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-shrink-0">
              {product.primaryImage && (
                <img src={product.primaryImage} alt={product.name} className="w-8 h-8 object-cover rounded" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate max-w-24">{product.name}</p>
                <p className="text-xs text-primary-600 font-semibold">{formatCurrency(product.discountPrice || product.price)}</p>
              </div>
              <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 ml-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {items.length < 3 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-2 text-xs text-gray-400 flex-shrink-0">
              + Add product
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {items.length >= 2 && (
            <Link to="/compare" className="btn-primary text-sm py-1.5 px-4">Compare Now</Link>
          )}
          <button onClick={clearAll} className="text-sm text-gray-500 hover:text-red-500">Clear</button>
        </div>
      </div>
    </div>
  );
}
