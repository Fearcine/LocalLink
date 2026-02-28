import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, MapPin, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'freelancer') return '/freelancer/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-earth-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-display font-bold text-earth-900">
              Local<span className="text-brand-500">Link</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/freelancers" className="text-earth-700 hover:text-brand-600 font-medium transition-colors text-sm">
              Find Services
            </Link>
            {!user && (
              <Link to="/freelancer/signup" className="text-earth-700 hover:text-brand-600 font-medium transition-colors text-sm">
                Work with us
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-earth-50 hover:bg-earth-100 px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name ? user.name[0].toUpperCase() : '?'}
                  </div>
                  <span className="text-sm font-medium text-earth-800 max-w-[100px] truncate">{user.name || 'User'}</span>
                  <ChevronDown className="w-4 h-4 text-earth-500" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-earth-100 py-1 z-50">
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-earth-700 hover:bg-earth-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-outline py-2 px-4 text-sm">Login</Link>
                <Link to="/login" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-earth-50"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-earth-100 flex flex-col gap-2">
            <Link to="/freelancers" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-earth-700 hover:text-brand-600 font-medium">Find Services</Link>
            {!user && <Link to="/freelancer/signup" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-earth-700 font-medium">Work with us</Link>}
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="px-3 py-2 text-earth-700 font-medium">Dashboard</Link>
                <button onClick={handleLogout} className="px-3 py-2 text-red-600 font-medium text-left">Logout</button>
              </>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline py-2 px-4 text-sm flex-1 text-center">Login</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary py-2 px-4 text-sm flex-1 text-center">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
    </nav>
  );
}
