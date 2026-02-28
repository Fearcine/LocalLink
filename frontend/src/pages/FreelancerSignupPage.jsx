import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, ChevronRight, ChevronLeft, Check, Loader } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { priceModels } from '../utils/helpers';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function FreelancerSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [registeredId, setRegisteredId] = useState(null);

  const [form, setForm] = useState({
    primaryCategory: '',
    secondaryCategories: [],
    bio: '',
    skills: '',
    experience: '',
    priceModel: 'hourly',
    priceAmount: '',
    priceConditions: '',
    area: '',
    city: '',
    serviceRadius: '5',
    availability: {
      monday: true, tuesday: true, wednesday: true,
      thursday: true, friday: true, saturday: false, sunday: false,
      startTime: '09:00', endTime: '18:00'
    },
    profilePhoto: null,
    idProof: null,
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const updateField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleDay = (day) => {
    updateField('availability', { ...form.availability, [day]: !form.availability[day] });
  };

  const toggleSecondaryCategory = (catId) => {
    const current = form.secondaryCategories;
    if (current.includes(catId)) {
      updateField('secondaryCategories', current.filter(c => c !== catId));
    } else if (current.length < 2) {
      updateField('secondaryCategories', [...current, catId]);
    } else {
      toast.error('You can select up to 2 secondary categories');
    }
  };

  const handleSubmit = async () => {
    if (!form.primaryCategory) return toast.error('Please select a primary category');
    if (!form.priceAmount) return toast.error('Please enter your price');
    if (!form.idProof) return toast.error('Please upload your ID proof');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('primaryCategory', form.primaryCategory);
      fd.append('secondaryCategories', JSON.stringify(form.secondaryCategories));
      fd.append('bio', form.bio);
      fd.append('skills', JSON.stringify(form.skills.split(',').map(s => s.trim()).filter(Boolean)));
      fd.append('experience', form.experience);
      fd.append('priceModel', form.priceModel);
      fd.append('priceAmount', form.priceAmount);
      fd.append('priceConditions', form.priceConditions);
      fd.append('location', JSON.stringify({ area: form.area, city: form.city }));
      fd.append('serviceRadius', form.serviceRadius);
      fd.append('availability', JSON.stringify(form.availability));
      if (form.profilePhoto) fd.append('profilePhoto', form.profilePhoto);
      fd.append('idProof', form.idProof);

      const { data } = await api.post('/freelancers/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setRegisteredId(data.freelancer.id);
      setStep(4); // Payment step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // Initiate payment
      const { data: orderData } = await api.post('/payments/initiate');
      
      // Mock payment flow (in production: integrate Razorpay/Stripe)
      toast.loading('Processing payment...', { id: 'payment' });
      await new Promise(r => setTimeout(r, 2000)); // Simulate payment

      // Verify payment
      await api.post('/payments/verify', {
        orderId: orderData.data.orderId,
        paymentId: `MOCK-${Date.now()}`
      });

      toast.success('Payment successful! Application submitted.', { id: 'payment' });
      setStep(5); // Success
    } catch (err) {
      toast.error('Payment failed. Please try again.', { id: 'payment' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const steps = ['Category', 'Details', 'Documents', 'Payment'];

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="page-container py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-earth-900">Apply as a Freelancer</h1>
          <p className="text-earth-500 mt-1">Complete your profile to start earning</p>
        </div>

        {/* Progress */}
        {step < 5 && (
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${i + 1 <= step ? 'text-brand-600' : 'text-earth-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i + 1 < step ? 'bg-brand-500 text-white' :
                    i + 1 === step ? 'bg-brand-500 text-white' :
                    'bg-earth-200 text-earth-400'
                  }`}>
                    {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-brand-500' : 'bg-earth-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-earth-100 p-7">
          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">Choose Your Service</h2>
              
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-2">Primary Category *</label>
                <select value={form.primaryCategory} onChange={e => updateField('primaryCategory', e.target.value)} className="input-field text-base">
                  <option value="">Select your main service</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.icon} {cat.name} ({cat.parentGroup})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-2">Secondary Categories (up to 2)</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleSecondaryCategory(cat._id)}
                      disabled={cat._id === form.primaryCategory}
                      className={`p-2.5 rounded-xl border-2 text-left text-sm transition-all disabled:opacity-40 ${
                        form.secondaryCategories.includes(cat._id)
                          ? 'border-brand-400 bg-brand-50 text-brand-700'
                          : 'border-earth-200 hover:border-earth-300'
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>{cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => { if (!form.primaryCategory) return toast.error('Select a primary category'); setStep(2); }} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">Your Details</h2>

              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-2">Short Bio</label>
                <textarea value={form.bio} onChange={e => updateField('bio', e.target.value)} placeholder="Briefly describe your experience and what makes you great..." className="input-field h-24 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-2">Skills (comma separated)</label>
                <input type="text" value={form.skills} onChange={e => updateField('skills', e.target.value)} placeholder="cleaning, mopping, cooking, dishwashing" className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">Experience (years)</label>
                  <input type="number" min="0" max="50" value={form.experience} onChange={e => updateField('experience', e.target.value)} placeholder="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">Service Radius (km)</label>
                  <input type="number" min="1" max="50" value={form.serviceRadius} onChange={e => updateField('serviceRadius', e.target.value)} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">Price Model *</label>
                  <select value={form.priceModel} onChange={e => updateField('priceModel', e.target.value)} className="input-field">
                    {priceModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">Price Amount (₹) *</label>
                  <input type="number" min="0" value={form.priceAmount} onChange={e => updateField('priceAmount', e.target.value)} placeholder="500" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">Area / Locality</label>
                  <input type="text" value={form.area} onChange={e => updateField('area', e.target.value)} placeholder="Koramangala" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">City</label>
                  <input type="text" value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Bangalore" className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-3">Available Days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.availability[day] ? 'bg-brand-500 text-white' : 'bg-earth-100 text-earth-500'
                      }`}
                    >
                      {DAY_SHORT[i]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Back</button>
                <button onClick={() => { if (!form.priceAmount) return toast.error('Enter your price'); setStep(3); }} className="btn-primary flex-1 flex items-center justify-center gap-2">Next <ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">Upload Documents</h2>
              <p className="text-sm text-earth-500">Documents are reviewed by our team for verification.</p>

              {[
                { key: 'profilePhoto', label: 'Profile Photo', accept: 'image/*', required: false, icon: '🤳' },
                { key: 'idProof', label: 'Government ID Proof *', accept: 'image/*,application/pdf', required: true, icon: '🪪' }
              ].map(({ key, label, accept, required, icon }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-earth-700 mb-2">{label}</label>
                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
                    form[key] ? 'border-brand-400 bg-brand-50' : 'border-earth-300 hover:border-brand-300 hover:bg-brand-50/50'
                  }`}>
                    <input type="file" accept={accept} onChange={e => updateField(key, e.target.files[0])} className="hidden" />
                    {form[key] ? (
                      <div className="text-center">
                        <div className="text-3xl mb-1">✅</div>
                        <p className="text-sm font-medium text-brand-700">{form[key].name}</p>
                        <p className="text-xs text-brand-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-3xl mb-1">{icon}</div>
                        <p className="text-sm font-semibold text-earth-700">Click to upload</p>
                        <p className="text-xs text-earth-400 mt-1">JPG, PNG, or PDF · Max 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              ))}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Continue to Payment →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="text-center space-y-5">
              <div className="text-5xl">💳</div>
              <h2 className="text-xl font-display font-bold text-earth-900">One-time Registration Fee</h2>
              <p className="text-earth-500 text-sm">Pay once to activate your profile for admin review.</p>

              <div className="bg-earth-50 rounded-2xl p-5">
                <p className="text-4xl font-display font-bold text-earth-900">₹299</p>
                <p className="text-earth-500 text-sm mt-1">One-time activation fee</p>

                <div className="mt-4 space-y-2 text-left">
                  {['Profile listed on LocalLink', 'Admin verification review', 'Start receiving service requests', '30-day listing guarantee'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-earth-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handlePayment} disabled={paymentLoading} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                {paymentLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Pay ₹299 & Submit →'}
              </button>
              <p className="text-xs text-earth-400">Secure mock payment (demo mode)</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-display font-bold text-earth-900">Application Submitted!</h2>
              <p className="text-earth-500 max-w-xs mx-auto">
                Our team will review your profile within 24–48 hours. You'll be notified once approved.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                ⚠️ Your profile will be visible only after admin approval.
              </div>
              <Link to="/" className="btn-primary inline-block mt-4">Back to Home</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
