/**
 * pages/OtpVerify.jsx
 * Shared OTP entry screen used by:
 *   - Normal user / admin login  (context = 'login')
 *   - Freelancer registration    (context = 'freelancer')
 *
 * Navigation state expected:
 *   { phone, devCode?, context: 'login' | 'freelancer' }
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, MapPin } from 'lucide-react';
import { authApi, freelancerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;

export default function OtpVerify() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { loginSuccess } = useAuth();

  const { phone, devCode, context = 'login' } = location.state || {};

  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60); // resend cooldown
  const inputRefs = useRef([]);

  // Redirect if arrived without phone state
  useEffect(() => {
    if (!phone) {
      navigate(context === 'freelancer' ? '/freelancer-apply' : '/login', { replace: true });
    }
  }, [phone, context, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Digit input handlers ──────────────────────────────────────────────────

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Allow pasting the full OTP into the first box
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return;
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      let data;

      if (context === 'freelancer') {
        // Freelancer OTP — separate endpoint
        ({ data } = await freelancerApi.verifyOtp(phone, code));
        toast.success(data.message || 'Phone verified!');
        loginSuccess(data.token, data.user);
      } else {
        // Normal user / admin login
        ({ data } = await authApi.verifyOtp(phone, code));
        toast.success('Welcome to LocalLink! 🎉');
        loginSuccess(data.token, data.user);
      }
    } catch (err) {
      toast.error(err.message || 'OTP verification failed.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const sendFn =
        context === 'freelancer'
          ? () => toast.error('Please re-submit the application form to get a new OTP.')
          : () => authApi.sendOtp(phone);

      if (context === 'freelancer') {
        // Freelancer OTP is tied to registration form — redirect back
        toast('Please re-submit your application to get a new OTP.', { icon: 'ℹ️' });
        navigate('/freelancer-apply');
        return;
      }

      const { data } = await authApi.sendOtp(phone);
      toast.success(data.message || 'New OTP sent!');
      if (data.dev?.code) {
        toast(`Dev OTP: ${data.dev.code}`, { icon: '🔑', duration: 8000 });
      }
      setCountdown(60);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const otp = digits.join('');
  const backPath = context === 'freelancer' ? '/freelancer-apply' : '/login';

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
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          {/* Back link */}
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-2 text-earth-400 hover:text-earth-700 mb-6 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {context === 'freelancer' ? 'Back to application' : 'Change number'}
          </button>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-display font-bold text-earth-900">Enter OTP</h1>
            <p className="text-earth-500 text-sm mt-2">
              Sent to <span className="font-semibold text-earth-800">{phone}</span>
            </p>

            {/* Dev mode hint */}
            {devCode && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 inline-block">
                <p className="text-amber-700 text-sm font-medium">
                  🧪 Dev OTP:{' '}
                  <span
                    className="font-bold text-xl tracking-widest cursor-pointer select-all"
                    onClick={() => {
                      const next = devCode.split('');
                      setDigits(next);
                    }}
                    title="Click to auto-fill"
                  >
                    {devCode}
                  </span>
                </p>
                <p className="text-amber-500 text-xs mt-0.5">Click the code to auto-fill</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* OTP digit inputs */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                    ${digit
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-earth-200 bg-earth-50 text-earth-800'}
                    focus:border-brand-500 focus:bg-white focus:shadow-sm`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== OTP_LENGTH}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-5">
            {context !== 'freelancer' && (
              countdown > 0 ? (
                <p className="text-earth-400 text-sm">
                  Resend OTP in{' '}
                  <span className="font-semibold text-earth-600">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-brand-600 hover:text-brand-700 text-sm font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend OTP'}
                </button>
              )
            )}
            {context === 'freelancer' && (
              <button
                onClick={() => navigate('/freelancer-apply')}
                className="text-brand-600 hover:text-brand-700 text-sm font-semibold hover:underline"
              >
                ← Re-submit application for new OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
