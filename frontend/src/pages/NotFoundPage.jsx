import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-display font-bold text-earth-200 mb-4">404</div>
        <h1 className="text-2xl font-display font-bold text-earth-900 mb-3">Page not found</h1>
        <p className="text-earth-500 mb-8">This page doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}
