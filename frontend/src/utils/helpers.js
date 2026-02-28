/**
 * Utility helpers
 */

export const formatPrice = (amount, model) => {
  const modelLabels = { hourly: '/hr', daily: '/day', per_job: '/job' };
  return `₹${amount}${modelLabels[model] || ''}`;
};

export const formatRating = (rating) => {
  return typeof rating === 'number' ? rating.toFixed(1) : '0.0';
};

export const getAvailabilityText = (availability) => {
  if (!availability) return 'Not specified';
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const available = days.filter(d => availability[d]).map((d, i) => shortDays[days.indexOf(d)]);
  return available.length ? available.join(', ') : 'No days set';
};

export const getStatusColor = (status) => {
  const colors = {
    approved: 'badge-green',
    pending: 'badge-orange',
    rejected: 'badge-red',
    suspended: 'badge-red',
  };
  return colors[status] || 'badge-gray';
};

export const truncate = (str, len = 80) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `/${path}`;
};

export const categoryGroups = [
  'Household',
  'Security & Assistance',
  'Delivery & Errands',
  'Maintenance',
  'Moving & Labor',
];

export const priceModels = [
  { value: 'hourly', label: 'Per Hour' },
  { value: 'daily', label: 'Per Day' },
  { value: 'per_job', label: 'Per Job' },
];
