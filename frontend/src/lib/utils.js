export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

export const savingPercent = (price, discountPrice) =>
  price && discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;

export const getStatusColor = (status) => {
  const colors = {
    PENDING: 'badge-yellow',
    CONFIRMED: 'badge-blue',
    PROCESSING: 'badge-blue',
    SHIPPED: 'badge-blue',
    OUT_FOR_DELIVERY: 'badge-blue',
    DELIVERED: 'badge-green',
    CANCELLED: 'badge-red',
    FAILED_DELIVERY: 'badge-red',
    REQUESTED: 'badge-yellow',
    UNDER_REVIEW: 'badge-yellow',
    APPROVED: 'badge-blue',
    REJECTED: 'badge-red',
    PICKUP_SCHEDULED: 'badge-blue',
    ITEM_RECEIVED: 'badge-blue',
    REFUND_INITIATED: 'badge-blue',
    REFUND_COMPLETED: 'badge-green',
  };
  return colors[status] || 'badge-gray';
};

export const ORDER_STATUS_STEPS = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

export const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

export const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};
