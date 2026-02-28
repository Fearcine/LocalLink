import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Loader, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CompleteProfilePage() {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user',
    area: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter your name');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        location: form.area ? { area: form.area } : undefined
      };

      const { data } = await api.put('/auth/complete-profile', payload);
      updateUser(data.user);
      toast.success('Profile saved!');

      if (form.role === 'freelancer') {
        navigate('/freelancer/signup');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-3xl font-display font-bold text-earth-900">Welcome to LocalLink!</h1>
          <p className="text-earth-500 mt-2">Tell us a bit about yourself to get started</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-earth-700 mb-2">Your Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Rahul Kumar"
                className="input-field text-lg"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-earth-700 mb-2">Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="rahul@email.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-earth-700 mb-2">Your Area / Locality</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
                <input
                  type="text"
                  value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                  placeholder="e.g. Koramangala, Bangalore"
                  className="input-field pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-earth-700 mb-3">I am joining as...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'user', icon: User, title: 'Looking for Help', desc: 'Hire local services' },
                  { value: 'freelancer', icon: Briefcase, title: 'A Freelancer', desc: 'Offer my services' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === opt.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-earth-200 hover:border-earth-300'
                    }`}
                  >
                    <opt.icon className={`w-6 h-6 mb-2 ${form.role === opt.value ? 'text-brand-600' : 'text-earth-400'}`} />
                    <p className={`font-semibold text-sm ${form.role === opt.value ? 'text-brand-700' : 'text-earth-700'}`}>{opt.title}</p>
                    <p className="text-xs text-earth-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
