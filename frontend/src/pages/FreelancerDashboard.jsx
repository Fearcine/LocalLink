import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Trophy, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatPrice, getStatusColor } from '../utils/helpers';

const STATUS_ICON = {
  approved: <CheckCircle className="w-5 h-5 text-green-500" />,
  pending: <Clock className="w-5 h-5 text-amber-500" />,
  rejected: <XCircle className="w-5 h-5 text-red-500" />,
  suspended: <XCircle className="w-5 h-5 text-red-500" />,
};

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/freelancers/my-profile')
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-earth-50"><Navbar />
      <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-brand-500" /></div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-earth-50"><Navbar />
      <div className="page-container py-10 text-center">
        <h2 className="text-xl font-semibold text-earth-800 mb-3">No Freelancer Profile Found</h2>
        <Link to="/freelancer/signup" className="btn-primary">Complete Signup</Link>
      </div>
    </div>
  );

  const { stats, status } = profile;

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="page-container py-8">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-earth-900">My Dashboard</h1>
            <p className="text-earth-500 text-sm mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className={`badge text-sm px-3 py-1.5 flex items-center gap-1.5 ${getStatusColor(status)}`}>
            {STATUS_ICON[status]}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>

        {/* Status Banner */}
        {status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Application Under Review</p>
              <p className="text-sm text-amber-600">Our team is reviewing your profile. Typically takes 24–48 hours.</p>
            </div>
          </div>
        )}
        {status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="font-semibold text-red-800 mb-1">Application Rejected</p>
            {profile.rejectionReason && <p className="text-sm text-red-600">Reason: {profile.rejectionReason}</p>}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Rating', value: stats.avgRating?.toFixed(1) || '0.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Reviews', value: stats.totalReviews || 0, icon: Star, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Jobs Done', value: stats.jobsCompleted || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Profile Views', value: profile.views || 0, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-earth-900">{value}</p>
              <p className="text-xs text-earth-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Profile Summary */}
          <div className="card p-6">
            <h2 className="font-semibold text-earth-900 mb-4">Profile Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-earth-500">Category</span>
                <span className="font-medium text-earth-800">{profile.primaryCategory?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-500">Price</span>
                <span className="font-medium text-earth-800">{formatPrice(profile.priceAmount, profile.priceModel)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-500">Service Radius</span>
                <span className="font-medium text-earth-800">{profile.serviceRadius} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-500">Experience</span>
                <span className="font-medium text-earth-800">{profile.experience} years</span>
              </div>
              {profile.isTopFreelancer && (
                <div className="flex justify-between">
                  <span className="text-earth-500">Badge</span>
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Trophy className="w-4 h-4" /> Top Freelancer
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-semibold text-earth-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {status === 'approved' && (
                <Link to={`/freelancers/${profile._id}`} className="flex items-center gap-3 p-3 bg-earth-50 hover:bg-earth-100 rounded-xl transition-colors">
                  <Eye className="w-5 h-5 text-brand-500" />
                  <span className="text-sm font-medium text-earth-800">View Public Profile</span>
                </Link>
              )}
              <div className="flex items-center gap-3 p-3 bg-earth-50 rounded-xl">
                <Star className="w-5 h-5 text-amber-500" />
                <div>
                  <span className="text-sm font-medium text-earth-800 block">Ranking Score</span>
                  <span className="text-xs text-earth-500">{stats.rankingScore?.toFixed(2) || '0.00'} / 10.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
