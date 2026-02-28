import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Star, Phone, Trophy, Shield, ArrowLeft, Loader } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import StarRating from '../components/common/StarRating';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatPrice, getAvailabilityText, getInitials } from '../utils/helpers';

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/freelancers/${id}`);
        setFreelancer(data.data);
      } catch {
        toast.error('Freelancer not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleContact = async () => {
    if (!user) return toast.error('Please login to contact freelancers');
    setContactLoading(true);
    try {
      const { data } = await api.get(`/freelancers/${id}/contact`);
      setContactInfo(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get contact');
    } finally {
      setContactLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to review');
    if (!reviewForm.rating) return toast.error('Please select a rating');
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { freelancerId: id, ...reviewForm });
      toast.success('Review submitted!');
      const { data } = await api.get(`/freelancers/${id}`);
      setFreelancer(data.data);
      setReviewForm({ rating: 0, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-brand-500" /></div>
    </div>
  );

  if (!freelancer) return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="text-center py-20">
        <p className="text-earth-500">Freelancer not found</p>
        <Link to="/freelancers" className="btn-primary mt-4 inline-block">Browse Freelancers</Link>
      </div>
    </div>
  );

  const { user: fUser, primaryCategory, stats, availability, skills, reviews } = freelancer;

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      <div className="page-container py-6">
        <Link to="/freelancers" className="inline-flex items-center gap-2 text-earth-500 hover:text-earth-700 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile Card */}
            <div className="card p-6">
              <div className="flex items-start gap-5">
                {freelancer.profilePhoto ? (
                  <img src={`/${freelancer.profilePhoto}`} alt={fUser?.name} className="w-24 h-24 rounded-2xl object-cover border-3 border-earth-100" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl font-display font-bold text-brand-700 flex-shrink-0">
                    {getInitials(fUser?.name)}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h1 className="text-2xl font-display font-bold text-earth-900">{fUser?.name}</h1>
                      {primaryCategory && (
                        <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">
                          <span className="text-base">{primaryCategory.icon}</span>
                          {primaryCategory.name}
                        </span>
                      )}
                    </div>
                    {freelancer.isTopFreelancer && (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">Top Freelancer</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={stats?.avgRating} size="md" />
                      <span className="font-semibold text-earth-800">{stats?.avgRating?.toFixed(1) || '0.0'}</span>
                      <span className="text-earth-400 text-sm">({stats?.totalReviews} reviews)</span>
                    </div>
                    <span className="text-earth-400">•</span>
                    <span className="text-earth-600 text-sm">{stats?.jobsCompleted || 0} jobs done</span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-earth-500">
                    {(freelancer.location?.area || fUser?.location?.area) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {freelancer.location?.area || fUser?.location?.area}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {freelancer.experience} yr{freelancer.experience !== 1 ? 's' : ''} exp
                    </span>
                  </div>
                </div>
              </div>

              {freelancer.bio && (
                <p className="mt-4 text-earth-600 text-sm leading-relaxed border-t border-earth-100 pt-4">{freelancer.bio}</p>
              )}
            </div>

            {/* Skills */}
            {skills?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-earth-900 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-earth-50 border border-earth-200 text-earth-700 text-sm rounded-xl">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="card p-6">
              <h2 className="font-semibold text-earth-900 mb-3">Availability</h2>
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const key = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
                  const isAvail = availability?.[key];
                  return (
                    <div key={day} className={`text-center py-2 rounded-lg text-xs font-medium ${isAvail ? 'bg-green-100 text-green-700' : 'bg-earth-100 text-earth-400'}`}>
                      {day}
                    </div>
                  );
                })}
              </div>
              {availability?.startTime && (
                <p className="text-sm text-earth-500">Hours: {availability.startTime} – {availability.endTime}</p>
              )}
            </div>

            {/* Reviews */}
            <div className="card p-6">
              <h2 className="font-semibold text-earth-900 mb-4">Reviews</h2>

              {/* Add Review Form */}
              {user && user.role === 'user' && (
                <form onSubmit={handleSubmitReview} className="bg-earth-50 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-earth-700 mb-3">Write a Review</p>
                  <StarRating rating={reviewForm.rating} size="lg" interactive onChange={r => setReviewForm(f => ({ ...f, rating: r }))} />
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience..."
                    className="input-field mt-3 resize-none h-20 text-sm"
                  />
                  <button type="submit" disabled={submittingReview} className="btn-primary py-2 px-5 text-sm mt-3 flex items-center gap-2">
                    {submittingReview ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Submit Review
                  </button>
                </form>
              )}

              {reviews?.length === 0 ? (
                <p className="text-earth-400 text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviews?.map(review => (
                    <div key={review._id} className="border-b border-earth-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">
                            {getInitials(review.user?.name)}
                          </div>
                          <span className="text-sm font-medium text-earth-800">{review.user?.name}</span>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-earth-600 mt-2 ml-10">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price & Contact */}
            <div className="card p-6">
              <div className="text-center mb-5">
                <p className="text-3xl font-display font-bold text-brand-600">{formatPrice(freelancer.priceAmount, freelancer.priceModel)}</p>
                {freelancer.priceConditions && (
                  <p className="text-xs text-earth-400 mt-1">{freelancer.priceConditions}</p>
                )}
              </div>

              {contactInfo ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-600 mb-1 font-medium">Contact Number</p>
                  <p className="text-xl font-bold text-green-700 font-display">{contactInfo.relayPhone}</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" /> Relay protected
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleContact}
                  disabled={contactLoading}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  {contactLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
                  Contact Freelancer
                </button>
              )}

              {!user && (
                <p className="text-center text-xs text-earth-400 mt-2">
                  <Link to="/login" className="text-brand-600 underline">Login</Link> to contact
                </p>
              )}
            </div>

            {/* Service Area */}
            <div className="card p-5">
              <h3 className="font-semibold text-earth-900 mb-3">Service Details</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-earth-500">Service Radius</span>
                  <span className="font-medium text-earth-800">{freelancer.serviceRadius} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">Experience</span>
                  <span className="font-medium text-earth-800">{freelancer.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">Price Model</span>
                  <span className="font-medium text-earth-800 capitalize">{freelancer.priceModel?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">Jobs Done</span>
                  <span className="font-medium text-earth-800">{stats?.jobsCompleted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
