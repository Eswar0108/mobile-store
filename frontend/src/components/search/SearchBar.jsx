import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const inputRef = useRef();
  const dropdownRef = useRef();

  // Debounced update
  const debouncedSet = useCallback(debounce((val) => setDebouncedQuery(val), 300), []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSet(e.target.value);
    setSelectedIdx(-1);
  };

  // Search suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => api.get(`/search?q=${debouncedQuery}&limit=6`).then((r) => r.data.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Popular searches
  const { data: popular } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => api.get('/search/popular').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  // Recent searches (logged in)
  const { data: recent } = useQuery({
    queryKey: ['recent-searches'],
    queryFn: () => api.get('/search/history').then((r) => r.data),
    enabled: !!user,
    staleTime: 60000,
  });

  const showSuggestions = focused && debouncedQuery.length >= 2 && suggestions?.length > 0;
  const showPopular = focused && !debouncedQuery;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (slug) => {
    setFocused(false);
    navigate(`/products/${slug}`);
  };

  const handleKeyDown = (e) => {
    const items = suggestions || [];
    if (e.key === 'ArrowDown') {
      setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      handleSuggestionClick(items[selectedIdx].slug);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for phones, brands..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setDebouncedQuery(''); }} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {(showSuggestions || showPopular) && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {showSuggestions && (
            <ul>
              {suggestions.map((product, idx) => (
                <li key={product.id}>
                  <button
                    onClick={() => handleSuggestionClick(product.slug)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left ${selectedIdx === idx ? 'bg-gray-50' : ''}`}
                  >
                    {product.primaryImage && (
                      <img src={product.primaryImage} alt={product.name} className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.brand}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary-600 flex-shrink-0">
                      {formatCurrency(product.discountPrice || product.price)}
                    </p>
                  </button>
                </li>
              ))}
              <li className="border-t">
                <button onClick={handleSubmit} className="w-full px-4 py-2.5 text-sm text-primary-600 font-medium hover:bg-gray-50 text-left">
                  See all results for "{query}"
                </button>
              </li>
            </ul>
          )}

          {showPopular && (
            <div className="p-3">
              {user && recent?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 font-medium mb-2">Recent Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r.query} onClick={() => { setQuery(r.query); navigate(`/search?q=${encodeURIComponent(r.query)}`); setFocused(false); }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {r.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {popular?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {popular.slice(0, 6).map((p) => (
                      <button key={p.query} onClick={() => { setQuery(p.query); navigate(`/search?q=${encodeURIComponent(p.query)}`); setFocused(false); }}
                        className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        🔍 {p.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
