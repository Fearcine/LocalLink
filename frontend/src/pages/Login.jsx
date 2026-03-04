/**
 * pages/Login.jsx
 * Phone-number entry screen.
 * Normal users land here. Freelancers use /freelancer-apply instead.
 * Admin users also use this page — they already exist in the DB.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, MapPin, Loader } from 'lucide-react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Normalise phone: ensure leading + or default to +91
  const normalisePhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (raw.startsWith('+')) return raw.trim();
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return `+${digits}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalised = normalisePhone(phone);
    if (!/^\+?[1-9]\d{9,14}$/.test(normalised)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(normalised);
      toast.success(data.message || 'OTP sent!');

      // Navigate to verify page, carrying the phone as state
      navigate('/verify-otp', {
        state: {
          phone: normalised,
          // In dev mode the backend returns the code — show it as a hint
          devCode: data.dev?.code,
          context: 'login', // distinguishes from freelancer verify
        },
      });
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-900 via-earth-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-display font-bold text-white">
              Local<span className="text-brand-400">Link</span>
            </span>
          </Link>
          <p className="text-earth-400 text-sm mt-3">Sign in with your phone number</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-7">
            <div className="text-4xl mb-3">📱</div>
            <h1 className="text-2xl font-display font-bold text-earth-900">Enter your phone</h1>
            <p className="text-earth-500 text-sm mt-1">
              We'll send a one-time verification code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-earth-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field pl-12 text-lg tracking-wide"
                  autoComplete="tel"
                  autoFocus
                  required
                />
              </div>
              <p className="text-xs text-earth-400 mt-1.5">
                Include country code — e.g. +91 for India
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Send OTP →'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-earth-500 mt-6">
            Want to offer services?{' '}
            <Link
              to="/freelancer-apply"
              className="text-brand-600 font-semibold hover:underline"
            >
              Apply as a Freelancer
            </Link>
          </p>
        </div>

        <p className="text-center mt-5 text-earth-500 text-sm">
          <Link to="/" className="hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
