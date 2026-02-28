import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Zap, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';

const quickCategories = [
  { name: 'Maid', icon: '🧹', slug: 'maid' },
  { name: 'Electrician', icon: '⚡', slug: 'electrician' },
  { name: 'Plumber', icon: '🔧', slug: 'plumber' },
  { name: 'Cook', icon: '👨‍🍳', slug: 'cook' },
  { name: 'Cleaner', icon: '🫧', slug: 'cleaner' },
  { name: 'Babysitter', icon: '👶', slug: 'babysitter' },
  { name: 'Guard', icon: '💂', slug: 'watchman' },
  { name: 'More →', icon: '📋', slug: null },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = window.location = window.location; // just for routing

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/freelancers?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      <div className="page-container py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-earth-900">
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-earth-500 mt-1">What do you need help with today?</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for a service (e.g. cleaner, plumber)..."
            className="w-full bg-white border-2 border-earth-200 rounded-2xl py-4 pl-14 pr-32 text-base focus:border-brand-400 focus:outline-none shadow-sm"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-2 px-5 text-sm">
            Search
          </button>
        </form>

        {/* Quick Categories */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-earth-800 mb-4">Quick Access</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {quickCategories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.slug ? `/freelancers?category=${cat.slug}` : '/freelancers'}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border-2 border-earth-100 hover:border-brand-300 hover:bg-brand-50 transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-earth-700 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Banners */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to="/freelancers" className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Browse All Services</h3>
            </div>
            <p className="text-brand-100 text-sm">Find verified freelancers near your location with filter options.</p>
          </Link>

          <Link to="/freelancers?sort=rating" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Top Rated This Week</h3>
            </div>
            <p className="text-amber-100 text-sm">Discover our highest-rated freelancers, updated weekly.</p>
          </Link>
        </div>

        {/* Location prompt */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-earth-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-earth-900">Enable Location for Better Results</h3>
            <p className="text-sm text-earth-500">Get distance-sorted results based on your current location.</p>
          </div>
          <Link to="/freelancers" className="ml-auto btn-primary text-sm py-2 px-4 whitespace-nowrap">
            Find Nearby
          </Link>
        </div>
      </div>
    </div>
  );
}
