import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Trophy, ChevronRight } from 'lucide-react';
import { formatPrice, formatRating, getInitials, getAvatarUrl } from '../../utils/helpers';
import StarRating from '../common/StarRating';

export default function FreelancerCard({ freelancer }) {
  const { _id, user, primaryCategory, stats, priceAmount, priceModel, isTopFreelancer, location } = freelancer;

  const name = user?.name || 'Unknown';
  const area = location?.area || user?.location?.area || '';

  return (
    <Link to={`/freelancers/${_id}`} className="card group hover:scale-[1.01] transition-all duration-200 block">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {freelancer.profilePhoto ? (
              <img
                src={getAvatarUrl(freelancer.profilePhoto)}
                alt={name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-earth-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-brand-100 border-2 border-brand-200 flex items-center justify-center">
                <span className="text-brand-700 font-bold text-lg font-display">{getInitials(name)}</span>
              </div>
            )}
            {isTopFreelancer && (
              <div className="absolute -top-1.5 -right-1.5 bg-amber-400 rounded-full p-1">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-earth-900 text-base leading-tight truncate">{name}</h3>
                {primaryCategory && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full font-medium">
                    <span>{primaryCategory.icon}</span>
                    {primaryCategory.name}
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-brand-600 font-bold text-base">{formatPrice(priceAmount, priceModel)}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <StarRating rating={stats?.avgRating || 0} />
                <span className="text-sm font-medium text-earth-700">{formatRating(stats?.avgRating)}</span>
                <span className="text-xs text-earth-400">({stats?.totalReviews || 0})</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-earth-500">
              {area && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {area}
                </span>
              )}
              {freelancer.serviceRadius && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {freelancer.serviceRadius}km radius
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Skills tags */}
        {freelancer.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {freelancer.skills.slice(0, 4).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-earth-50 text-earth-600 text-xs rounded-md">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-earth-50 flex items-center justify-between">
        <span className="text-xs text-earth-500">
          {stats?.jobsCompleted || 0} jobs completed
        </span>
        <span className="text-brand-600 text-xs font-medium flex items-center gap-1">
          View Profile <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
