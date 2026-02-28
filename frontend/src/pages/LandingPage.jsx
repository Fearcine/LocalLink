import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Shield, Zap, Users, ArrowRight, CheckCircle, Phone, ChevronRight } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../utils/api';

const categoryGroups = [
  { name: 'Household', icon: '🏠', items: ['Maid', 'Cleaner', 'Cook', 'Babysitter'], color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { name: 'Maintenance', icon: '🔧', items: ['Electrician', 'Plumber', 'Carpenter', 'AC Technician'], color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { name: 'Security', icon: '💂', items: ['Watchman', 'Elder Care', 'Caretaker'], color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { name: 'Delivery', icon: '📦', items: ['Delivery Helper', 'Grocery Runner', 'Personal Helper'], color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { name: 'Moving', icon: '🚛', items: ['Loader', 'Shifter Helper', 'Daily Wage'], color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
];

const steps = [
  { num: '01', title: 'Tell us what you need', desc: 'Browse categories and pick the service you\'re looking for.', icon: '🔍' },
  { num: '02', title: 'Find nearby helpers', desc: 'See freelancers in your area with ratings, prices, and reviews.', icon: '📍' },
  { num: '03', title: 'Connect & confirm', desc: 'Contact directly using our secure relay system.', icon: '📞' },
  { num: '04', title: 'Get the job done', desc: 'Work gets completed. Rate your experience to help others.', icon: '⭐' },
];

const stats = [
  { value: '5000+', label: 'Verified Freelancers' },
  { value: '50+', label: 'Cities Covered' },
  { value: '20K+', label: 'Happy Customers' },
  { value: '4.8★', label: 'Average Rating' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [topFreelancers, setTopFreelancers] = useState([]);

  useEffect(() => {
    api.get('/freelancers/top').then(r => setTopFreelancers(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-earth-900 via-earth-800 to-brand-900 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="page-container py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-6 animate-fade-up">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse-slow" />
              Trusted by 20,000+ families across India
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight mb-6 animate-fade-up animate-delay-1">
              Your trusted
              <br />
              <span className="text-brand-400">local helpers,</span>
              <br />
              <span className="text-earth-300">always nearby</span>
            </h1>

            <p className="text-lg text-earth-300 mb-8 max-w-xl leading-relaxed animate-fade-up animate-delay-2">
              LocalLink connects you with verified maids, technicians, guards, and 15+ types of local helpers — all within your neighborhood, on your schedule.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up animate-delay-3">
              <Link to="/freelancers" className="bg-brand-500 hover:bg-brand-400 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-center text-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-900/30">
                Find a Helper <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/freelancer/signup" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 px-8 rounded-xl transition-all text-center text-lg">
                Earn as a Freelancer
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap gap-4 animate-fade-up">
              {['Verified IDs', 'Secure Contact', 'Review System', 'Location-based'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-earth-300">
                  <CheckCircle className="w-4 h-4 text-brand-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C240,20 480,0 720,10 C960,20 1200,40 1440,60 L1440,60 L0,60 Z" fill="#fdfaf7"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-earth-50">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-5 bg-white rounded-2xl shadow-sm border border-earth-100">
                <p className="text-3xl font-display font-bold text-brand-600">{s.value}</p>
                <p className="text-sm text-earth-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-12">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl font-display font-bold text-earth-900 mt-2">How LocalLink works</h2>
            <p className="text-earth-500 mt-3 max-w-md mx-auto">Get help in 4 easy steps — no complicated forms, no waiting.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-earth-50 rounded-2xl p-6 h-full border border-earth-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all duration-200">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <span className="text-5xl font-display font-bold text-earth-200 absolute top-4 right-5">{step.num}</span>
                  <h3 className="font-semibold text-earth-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-earth-500 leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-brand-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 bg-earth-50">
        <div className="page-container">
          <div className="text-center mb-12">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">What we offer</span>
            <h2 className="text-4xl font-display font-bold text-earth-900 mt-2">18 types of local services</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {categoryGroups.map((group) => (
              <Link
                key={group.name}
                to={`/freelancers?group=${encodeURIComponent(group.name)}`}
                className={`${group.color} border-2 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="text-3xl mb-3">{group.icon}</div>
                <h3 className="font-semibold text-earth-900 mb-2">{group.name}</h3>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <p key={item} className="text-xs text-earth-600">{item}</p>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/freelancers" className="btn-primary inline-flex items-center gap-2">
              Browse All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Freelancers Preview */}
      {topFreelancers.length > 0 && (
        <section className="py-20 bg-white">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">This Week's Best</span>
                <h2 className="text-3xl font-display font-bold text-earth-900 mt-1">Top Rated Freelancers</h2>
              </div>
              <Link to="/freelancers" className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {topFreelancers.slice(0, 4).map(f => (
                <Link key={f._id} to={`/freelancers/${f._id}`} className="card p-4 flex items-center gap-3 hover:-translate-y-0.5">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold text-lg font-display flex-shrink-0">
                    {(f.user?.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-earth-900 text-sm truncate">{f.user?.name}</p>
                    <p className="text-xs text-earth-500">{f.primaryCategory?.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-earth-600 font-medium">{f.stats?.avgRating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why LocalLink */}
      <section className="py-20 bg-earth-50">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">Why us</span>
              <h2 className="text-4xl font-display font-bold text-earth-900 mt-2 mb-6">
                Built for everyday <br />local needs
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Shield, title: 'Verified Profiles', desc: 'Every freelancer goes through ID verification and admin approval before appearing in search.' },
                  { icon: MapPin, title: 'Hyper-local Discovery', desc: 'Find helpers within walking distance. Distance-first search ensures you get the nearest match.' },
                  { icon: Star, title: 'Community Reviews', desc: 'Real ratings from real users. Our ranking algorithm ensures quality rises to the top.' },
                  { icon: Phone, title: 'Secure Contact', desc: 'Phone numbers are masked. Connect through our relay system to protect everyone\'s privacy.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-earth-900">{title}</h4>
                      <p className="text-sm text-earth-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-earth-900 to-brand-900 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-display font-bold mb-3">Ready to get started?</h3>
              <p className="text-earth-300 mb-6 text-sm leading-relaxed">
                Join thousands of families who save time every week by connecting with trusted local helpers.
              </p>
              <Link to="/login" className="block bg-brand-500 hover:bg-brand-400 text-white text-center font-semibold py-4 rounded-xl transition-all mb-3">
                Find Help Now →
              </Link>
              <Link to="/freelancer/signup" className="block bg-white/10 hover:bg-white/20 text-white text-center font-semibold py-4 rounded-xl transition-all border border-white/20">
                Apply as Freelancer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-earth-900 text-earth-300 py-12">
        <div className="page-container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-display font-bold text-white">Local<span className="text-brand-400">Link</span></span>
              </div>
              <p className="text-sm leading-relaxed">Connecting local communities with trusted freelancers for daily needs.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-3">Services</h4>
                <div className="space-y-2">
                  <Link to="/freelancers" className="block hover:text-white transition-colors">Find Freelancers</Link>
                  <Link to="/freelancer/signup" className="block hover:text-white transition-colors">Become a Freelancer</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Company</h4>
                <div className="space-y-2">
                  <a href="#" className="block hover:text-white transition-colors">About Us</a>
                  <a href="#" className="block hover:text-white transition-colors">Contact</a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Legal</h4>
                <div className="space-y-2">
                  <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-earth-700 mt-10 pt-6 text-center text-xs text-earth-500">
            © {new Date().getFullYear()} LocalLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
