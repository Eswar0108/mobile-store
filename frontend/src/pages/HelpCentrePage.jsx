import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import api from '../lib/api';

export default function HelpCentrePage() {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['help', search],
    queryFn: () => api.get(`/help${search ? `?search=${search}` : ''}`).then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <Helmet><title>Help Centre — MobileStore</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How can we help?</h1>
          <p className="text-gray-500">Search for answers or browse by category</p>
          <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 gap-2 mt-4 max-w-md mx-auto">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles..." className="flex-1 bg-transparent outline-none text-sm" />
          </div>
        </div>

        {data && Object.entries(data.grouped || {}).map(([category, articles]) => (
          <div key={category} className="mb-6">
            <h2 className="font-bold text-gray-900 mb-3">{category}</h2>
            <div className="space-y-2">
              {articles.map((article) => (
                <Link key={article.id} to={`/help/${article.id}`}
                  className="card block hover:border-primary-200 border border-transparent transition-colors">
                  <p className="font-medium text-gray-900">{article.title}</p>
                  {article.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {data?.articles?.length === 0 && (
          <div className="text-center py-8 text-gray-400">No articles found for "{search}"</div>
        )}
      </div>
    </>
  );
}
