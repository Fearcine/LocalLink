import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Phone, ArrowLeft, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STEP = { PHONE: 'phone', OTP: 'otp' };

export default function LoginPage() {
  const [step, setStep] = useState(STEP.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [mockCode, setMockCode] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const formatPhone = (val) => {
    // Simple Indian phone normalization
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return val.startsWith('+') ? val : `+${val}`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('Please enter your phone number');
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const { data } = await api.post('/auth/send-otp', { phone: formattedPhone });
      if (data.mock) {
        setMockCode(data.message.match(/use: (\d+)/)?.[1] || '123456');
        toast.success(`Mock OTP: ${data.message.match(/use: (\d+)/)?.[1] || '123456'}`, { duration: 8000 });
      } else {
        toast.success('OTP sent to your phone!');
      }
      setStep(STEP.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const { data } = await api.post('/auth/verify-otp', { phone: formattedPhone, otp: code });
      login(data.token, data.user);
      toast.success('Welcome to LocalLink! 🎉');

      if (data.user.isNewUser || !data.user.name) {
        navigate('/complete-profile');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'freelancer') {
        navigate('/freelancer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
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
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {step === STEP.PHONE ? (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📱</div>
                <h1 className="text-2xl font-display font-bold text-earth-900">Login with Phone</h1>
                <p className="text-earth-500 text-sm mt-2">Enter your phone number to receive an OTP</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="input-field pl-12 text-lg"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-earth-400 mt-1">Enter with country code (e.g. +91 for India)</p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Send OTP →'}
                </button>

                <p className="text-center text-xs text-earth-400">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-brand-600 hover:underline">Terms of Service</a>
                </p>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep(STEP.PHONE); setOtp(['','','','','','']); }}
                className="flex items-center gap-2 text-earth-500 hover:text-earth-700 mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Change number
              </button>

              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔐</div>
                <h1 className="text-2xl font-display font-bold text-earth-900">Enter OTP</h1>
                <p className="text-earth-500 text-sm mt-2">
                  Sent to <strong>{phone}</strong>
                </p>
                {mockCode && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                    <p className="text-amber-700 text-sm font-medium">🧪 Mock OTP: <span className="font-bold text-lg">{mockCode}</span></p>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-earth-200 rounded-xl focus:border-brand-400 focus:outline-none bg-earth-50 focus:bg-white transition-all"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length !== 6} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full text-sm text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Didn't receive it? Resend OTP
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-earth-400 text-sm">
          <Link to="/" className="hover:text-white transition-colors">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
