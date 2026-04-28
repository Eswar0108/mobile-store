import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

export default function AnalyticsDashboard() {
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const params = `from=${from}&to=${to}`;

  const { data: revenue } = useQuery({ queryKey: ['analytics-revenue', from, to], queryFn: () => api.get(`/analytics/revenue?${params}`).then((r) => r.data) });
  const { data: topProducts } = useQuery({ queryKey: ['analytics-top-products', from, to], queryFn: () => api.get(`/analytics/top-products?${params}`).then((r) => r.data) });
  const { data: orders } = useQuery({ queryKey: ['analytics-orders', from, to], queryFn: () => api.get(`/analytics/orders?${params}`).then((r) => r.data) });
  const { data: customers } = useQuery({ queryKey: ['analytics-customers', from, to], queryFn: () => api.get(`/analytics/customers?${params}`).then((r) => r.data) });
  const { data: categories } = useQuery({ queryKey: ['analytics-categories', from, to], queryFn: () => api.get(`/analytics/categories?${params}`).then((r) => r.data) });

  return (
    <>
      <Helmet><title>Analytics — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field text-sm py-1.5" />
            <label className="text-gray-500">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field text-sm py-1.5" />
          </div>
        </div>

        {/* KPI Row */}
        {revenue?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(revenue.summary.totalRevenue || 0) },
              { label: 'Total Orders', value: revenue.summary.totalOrders || 0 },
              { label: 'Avg Order Value', value: formatCurrency(revenue.summary.avgOrderValue || 0) },
              { label: 'New Customers', value: customers?.summary?.newCustomers || 0 },
            ].map((kpi) => (
              <div key={kpi.label} className="card text-center">
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Revenue Chart */}
        {revenue?.data?.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Revenue Over Time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenue.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => formatDate(d)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Products */}
          {topProducts?.products?.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">Top Products by Revenue</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProducts.products.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Orders by Status */}
          {orders?.byStatus?.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">Orders by Status</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={orders.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {orders.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Categories */}
          {categories?.data?.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">Revenue by Category</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categories.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* New Customers */}
          {customers?.data?.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">New Customers</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={customers.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => formatDate(d)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} name="Customers" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
