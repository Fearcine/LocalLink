import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Loader, MapPin } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import FreelancerCard from '../components/freelancer/FreelancerCard';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'ranking', label: '⭐ Best Match' },
  { value: 'rating', label: '🏅 Highest Rated' },
  { value: 'price_asc', label: '💰 Price: Low to High' },
  { value: 'price_desc', label: '💸 Price: High to Low' },
];

export default function FreelancerListPage() {
  const [params, setParams] = useSearchParams();
  const [freelancers, setFreelancers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [filters, setFilters] = useState({
    sortBy: params.get('sort') || 'ranking',
    category: params.get('category') || '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    page: 1,
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        sortBy: filters.sortBy,
        page: filters.page,
        limit: 12,
      });

      if (filters.category) query.set('category', filters.category);
      if (filters.minPrice) query.set('minPrice', filters.minPrice);
      if (filters.maxPrice) query.set('maxPrice', filters.maxPrice);
      if (filters.minRating) query.set('minRating', filters.minRating);
      if (userLocation) {
        query.set('lat', userLocation.lat);
        query.set('lng', userLocation.lng);
        query.set('radius', '25');
      }

      const { data } = await api.get(`/freelancers/search?${query}`);
      setFreelancers(prev => filters.page > 1 ? [...prev, ...data.data] : data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to fetch freelancers');
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location enabled! Showing nearby freelancers.');
      },
      () => toast.error('Could not get location')
    );
  };

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
    setFreelancers([]);
  };

  const resetFilters = () => {
    setFilters({ sortBy: 'ranking', category: '', minPrice: '', maxPrice: '', minRating: '', page: 1 });
    setFreelancers([]);
  };

  const activeFiltersCount = [filters.category, filters.minPrice, filters.maxPrice, filters.minRating].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      <div className="page-container py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-earth-900">Find Local Services</h1>
            {pagination.total > 0 && (
              <p className="text-sm text-earth-500 mt-0.5">{pagination.total} freelancers available</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={getLocation}
              className="flex items-center gap-2 btn-outline py-2 px-4 text-sm"
            >
              <MapPin className="w-4 h-4" />
              Near Me
            </button>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 py-2 px-4 text-sm rounded-xl font-semibold border-2 transition-all ${
                filtersOpen || activeFiltersCount > 0
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-earth-200 text-earth-700 hover:border-earth-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-brand-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('sortBy', opt.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filters.sortBy === opt.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-earth-200 text-earth-600 hover:border-brand-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="bg-white rounded-2xl border border-earth-200 p-5 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-earth-900">Filters</h3>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-700">Clear all</button>
                )}
                <button onClick={() => setFiltersOpen(false)}>
                  <X className="w-5 h-5 text-earth-400" />
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide mb-2 block">Category</label>
                <select
                  value={filters.category}
                  onChange={e => updateFilter('category', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide mb-2 block">Min Price (₹)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={e => updateFilter('minPrice', e.target.value)}
                  placeholder="0"
                  className="input-field text-sm"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide mb-2 block">Max Price (₹)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={e => updateFilter('maxPrice', e.target.value)}
                  placeholder="Any"
                  className="input-field text-sm"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="text-xs font-semibold text-earth-600 uppercase tracking-wide mb-2 block">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={e => updateFilter('minRating', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {loading && freelancers.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-earth-100">
                <div className="p-5 space-y-3">
                  <div className="flex gap-4">
                    <div className="skeleton w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-earth-800 mb-2">No freelancers found</h3>
            <p className="text-earth-500 mb-4">Try adjusting your filters or search in a different area.</p>
            <button onClick={resetFilters} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {freelancers.map(f => (
                <FreelancerCard key={f._id} freelancer={f} />
              ))}
            </div>

            {/* Load More */}
            {pagination.page < pagination.pages && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2 mx-auto"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  Load More Freelancers
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
