/**
 * pages/FreelancerApply.jsx
 * Full freelancer registration form.
 * Route: /freelancer-apply
 *
 * Flow:
 *  1. User fills form (name, phone, category, price, location, docs, etc.)
 *  2. On submit → POST /freelancers/register  (multipart)
 *  3. Backend saves pending record + sends OTP to provided phone
 *  4. Navigate to /verify-otp with context:'freelancer'
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Upload, ChevronRight, ChevronLeft, Check, Loader } from 'lucide-react';
import { categoryApi, freelancerApi } from '../services/api';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const PRICE_MODELS = [
  { value: 'hourly',  label: 'Per Hour' },
  { value: 'daily',   label: 'Per Day'  },
  { value: 'per_job', label: 'Per Job'  },
];

const TOTAL_STEPS = 4;

const INITIAL_AVAILABILITY = {
  monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: false, sunday: false,
  startTime: '09:00', endTime: '18:00',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalisePhone = (raw) => {
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return raw.trim();
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};

// ─── Step progress indicator ──────────────────────────────────────────────────

function StepBar({ current }) {
  const labels = ['Category', 'Details', 'Schedule', 'Documents'];
  return (
    <div className="flex items-center gap-1 mb-8">
      {labels.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done   ? 'bg-brand-500 text-white'
                : active ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                         : 'bg-earth-200 text-earth-400'}`}
              >
                {done ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${active ? 'text-brand-600' : 'text-earth-400'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 transition-all ${done ? 'bg-brand-400' : 'bg-earth-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── File upload field ────────────────────────────────────────────────────────

function FileField({ label, fieldKey, file, onChange, required, accept = 'image/*,application/pdf', icon = '📎' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-earth-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all
        ${file
          ? 'border-brand-400 bg-brand-50'
          : 'border-earth-300 hover:border-brand-300 hover:bg-brand-50/40'}`}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(fieldKey, e.target.files[0] || null)}
          className="sr-only"
        />
        {file ? (
          <div className="text-center">
            <div className="text-3xl mb-1">✅</div>
            <p className="text-sm font-semibold text-brand-700 truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-brand-400 mt-0.5">Click to change</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl mb-1">{icon}</div>
            <p className="text-sm font-semibold text-earth-700">Click to upload</p>
            <p className="text-xs text-earth-400 mt-0.5">JPG, PNG or PDF · max 5 MB</p>
          </div>
        )}
      </label>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FreelancerApply() {
  const navigate = useNavigate();
  const [step,       setStep]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    // Step 1 — Category
    name:                 '',
    phone:                '',
    primaryCategory:      '',
    secondaryCategories:  [],

    // Step 2 — Details
    bio:             '',
    skills:          '',        // comma-separated string
    experience:      '',
    priceModel:      'hourly',
    priceAmount:     '',
    priceConditions: '',
    area:            '',
    city:            '',
    serviceRadius:   '5',

    // Step 3 — Availability
    availability: { ...INITIAL_AVAILABILITY },

    // Step 4 — Documents
    profilePhoto: null,
    idProof:      null,
  });

  useEffect(() => {
    categoryApi.getAll()
      .then((r) => setCategories(r.data.data))
      .catch(() => {});
  }, []);

  // ── Field updaters ──────────────────────────────────────────────────────────

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setFile = (key, file) => setForm((f) => ({ ...f, [key]: file }));

  const toggleDay = (day) =>
    setForm((f) => ({
      ...f,
      availability: { ...f.availability, [day]: !f.availability[day] },
    }));

  const setAvail = (key, value) =>
    setForm((f) => ({ ...f, availability: { ...f.availability, [key]: value } }));

  const toggleSecondary = (id) => {
    setForm((f) => {
      const cur = f.secondaryCategories;
      if (cur.includes(id)) return { ...f, secondaryCategories: cur.filter((c) => c !== id) };
      if (cur.length >= 2) { toast.error('Max 2 secondary categories.'); return f; }
      return { ...f, secondaryCategories: [...cur, id] };
    });
  };

  // ── Step validation ─────────────────────────────────────────────────────────

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.name.trim())            { toast.error('Name is required.');              return false; }
        if (!form.phone.trim())           { toast.error('Phone number is required.');      return false; }
        if (!form.primaryCategory)        { toast.error('Select a primary category.');     return false; }
        return true;
      case 2:
        if (!form.priceAmount)            { toast.error('Price is required.');             return false; }
        if (isNaN(parseFloat(form.priceAmount))) { toast.error('Price must be a number.'); return false; }
        return true;
      case 3:
        return true; // availability is optional
      case 4:
        if (!form.idProof)                { toast.error('ID proof is required.');          return false; }
        return true;
      default:
        return true;
    }
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, TOTAL_STEPS)); };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const normPhone = normalisePhone(form.phone);
      const fd = new FormData();

      fd.append('name',  form.name.trim());
      fd.append('phone', normPhone);
      fd.append('primaryCategory', form.primaryCategory);
      fd.append('secondaryCategories', JSON.stringify(form.secondaryCategories));
      fd.append('bio',             form.bio.trim());
      fd.append('skills',          JSON.stringify(
        form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      ));
      fd.append('experience',      form.experience || '0');
      fd.append('priceModel',      form.priceModel);
      fd.append('priceAmount',     form.priceAmount);
      fd.append('priceConditions', form.priceConditions.trim());
      fd.append('location',        JSON.stringify({ area: form.area, city: form.city }));
      fd.append('serviceRadius',   form.serviceRadius || '5');
      fd.append('availability',    JSON.stringify(form.availability));

      if (form.profilePhoto) fd.append('profilePhoto', form.profilePhoto);
      fd.append('idProof', form.idProof);

      const { data } = await freelancerApi.register(fd);
      toast.success('Application submitted! Check your phone for an OTP.');

      navigate('/verify-otp', {
        state: {
          phone:   normPhone,
          devCode: data.dev?.code,
          context: 'freelancer',
        },
      });
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-earth-50">

      {/* Top bar */}
      <header className="bg-white border-b border-earth-100 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-display font-bold text-earth-900">
            Local<span className="text-brand-500">Link</span>
          </span>
        </Link>
        <span className="text-earth-300 text-lg">·</span>
        <span className="text-sm font-semibold text-earth-600">Freelancer Application</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-earth-900">Apply as a Freelancer</h1>
          <p className="text-earth-500 text-sm mt-1">
            Complete all steps. Your profile will be reviewed before appearing in search.
          </p>
        </div>

        <StepBar current={step} />

        <div className="bg-white rounded-3xl shadow-sm border border-earth-100 p-7">

          {/* ── Step 1: Category & Identity ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">About You</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Rahul Kumar"
                  className="input-field"
                  autoFocus
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field"
                />
                <p className="text-xs text-earth-400 mt-1">OTP will be sent to this number</p>
              </div>

              {/* Primary category */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                  Primary Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.primaryCategory}
                  onChange={(e) => set('primaryCategory', e.target.value)}
                  className="input-field"
                >
                  <option value="">— Select your main service —</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}  ({cat.parentGroup})
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary categories */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-2">
                  Secondary Categories{' '}
                  <span className="text-earth-400 font-normal">(up to 2, optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const selected = form.secondaryCategories.includes(cat._id);
                    const disabled = cat._id === form.primaryCategory;
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleSecondary(cat._id)}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-medium transition-all disabled:opacity-30
                          ${selected
                            ? 'border-brand-400 bg-brand-50 text-brand-700'
                            : 'border-earth-200 hover:border-earth-300 text-earth-700'}`}
                      >
                        <span className="mr-1">{cat.icon}</span>{cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Pricing, Location & Bio ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">Your Details</h2>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-1.5">Short Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  placeholder="Describe your experience and what makes you great…"
                  maxLength={500}
                  className="input-field h-24 resize-none"
                />
                <p className="text-xs text-earth-400 mt-1 text-right">{form.bio.length}/500</p>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                  Skills{' '}
                  <span className="text-earth-400 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => set('skills', e.target.value)}
                  placeholder="cleaning, cooking, laundry, dishes"
                  className="input-field"
                />
              </div>

              {/* Experience + Service radius */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    Experience (years)
                  </label>
                  <input
                    type="number" min="0" max="50"
                    value={form.experience}
                    onChange={(e) => set('experience', e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    Service Radius (km)
                  </label>
                  <input
                    type="number" min="1" max="50"
                    value={form.serviceRadius}
                    onChange={(e) => set('serviceRadius', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Price model + amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    Price Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.priceModel}
                    onChange={(e) => set('priceModel', e.target.value)}
                    className="input-field"
                  >
                    {PRICE_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={form.priceAmount}
                    onChange={(e) => set('priceAmount', e.target.value)}
                    placeholder="500"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Price conditions */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                  Price Conditions{' '}
                  <span className="text-earth-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.priceConditions}
                  onChange={(e) => set('priceConditions', e.target.value)}
                  placeholder="e.g. Travel charges extra after 10 km"
                  className="input-field"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => set('area', e.target.value)}
                    placeholder="Koramangala"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Bangalore"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Availability ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">Availability</h2>
              <p className="text-sm text-earth-500">When are you available to work?</p>

              {/* Day toggles */}
              <div>
                <label className="block text-sm font-semibold text-earth-700 mb-3">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                        ${form.availability[day]
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-earth-100 text-earth-500 hover:bg-earth-200'}`}
                    >
                      {DAY_LABELS[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.availability.startTime}
                    onChange={(e) => setAvail('startTime', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-earth-700 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.availability.endTime}
                    onChange={(e) => setAvail('endTime', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-earth-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-earth-600 mb-2">Your Schedule Preview</p>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((day, i) => (
                    <div
                      key={day}
                      className={`py-2 rounded-lg text-center text-xs font-medium
                        ${form.availability[day]
                          ? 'bg-green-100 text-green-700'
                          : 'bg-earth-200 text-earth-400'}`}
                    >
                      {DAY_LABELS[i]}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-earth-500 mt-2 text-center">
                  {form.availability.startTime} – {form.availability.endTime}
                </p>
              </div>
            </div>
          )}

          {/* ── Step 4: Documents ────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-display font-bold text-earth-900">Upload Documents</h2>
              <p className="text-sm text-earth-500">
                Documents are reviewed by our team. They are never shown publicly.
              </p>

              <FileField
                label="Profile Photo"
                fieldKey="profilePhoto"
                file={form.profilePhoto}
                onChange={setFile}
                accept="image/*"
                icon="🤳"
                required={false}
              />

              <FileField
                label="Government ID Proof"
                fieldKey="idProof"
                file={form.idProof}
                onChange={setFile}
                accept="image/*,application/pdf"
                icon="🪪"
                required
              />

              {/* Summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Before you submit</p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                  <li>An OTP will be sent to <strong>{form.phone || 'your phone'}</strong></li>
                  <li>Your profile status will be <strong>Pending</strong> until admin approves it</li>
                  <li>Approved profiles appear in search results automatically</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Nav buttons ──────────────────────────────────────────────────── */}
          <div className={`flex gap-3 mt-8 ${step === 1 ? 'justify-end' : 'justify-between'}`}>
            {step > 1 && (
              <button
                type="button"
                onClick={prev}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={next}
                className="btn-primary flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>Submit Application <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Already have an account? */}
        <p className="text-center text-sm text-earth-500 mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
