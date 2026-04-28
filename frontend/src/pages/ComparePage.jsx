import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useCompareStore } from '../store/compareStore';
import { formatCurrency } from '../lib/utils';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);

  if (items.length < 2) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Helmet><title>Compare — MobileStore</title></Helmet>
        <p className="text-4xl mb-3">⚖</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Add phones to compare</h2>
        <p className="text-gray-500 mb-6">Select at least 2 phones to compare their specs side by side.</p>
        <Link to="/products" className="btn-primary">Browse Phones</Link>
      </div>
    );
  }

  const specLabels = [
    'brand', 'category', 'stockQuantity',
    ...new Set(items.flatMap((p) => p.specs?.map((s) => s.label) || [])),
  ];

  return (
    <>
      <Helmet><title>Compare Phones — MobileStore</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Compare Phones</h1>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-sm font-semibold text-gray-500 w-36">Feature</th>
              {items.map((p) => (
                <th key={p.id} className="p-3 text-center min-w-48">
                  <div className="relative">
                    <button onClick={() => removeItem(p.id)} className="absolute -top-1 -right-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
                    <img src={p.primaryImage || 'https://via.placeholder.com/100'} alt={p.name}
                      className="w-20 h-20 object-contain mx-auto mb-2 rounded-lg bg-gray-50" />
                    <Link to={`/products/${p.slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 block">{p.name}</Link>
                    <p className="text-base font-bold text-primary-600">{formatCurrency(p.discountPrice || p.price)}</p>
                    {p.discountPrice && p.price > p.discountPrice && (
                      <p className="text-xs text-gray-400 line-through">{formatCurrency(p.price)}</p>
                    )}
                    <Link to={`/products/${p.slug}`} className="btn-primary text-xs py-1.5 px-3 mt-2 inline-block">View</Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specLabels.map((label, idx) => (
              <tr key={label} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-3 text-sm font-medium text-gray-700 capitalize">{label}</td>
                {items.map((p) => {
                  let value;
                  if (label === 'brand') value = p.brand;
                  else if (label === 'category') value = p.category;
                  else if (label === 'stockQuantity') value = p.stockQuantity;
                  else value = p.specs?.find((s) => s.label === label)?.value || '—';
                  return (
                    <td key={p.id} className="p-3 text-sm text-gray-900 text-center">{value}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
