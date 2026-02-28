import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Briefcase, LayoutDashboard, Tag, LogOut, Check, X, Ban, Eye, Loader, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/helpers';

// Admin Sidebar
const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/freelancers', label: 'Freelancers', icon: Briefcase },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: Tag },
  ];

  return (
    <div className="w-64 min-h-screen bg-earth-900 text-earth-300 flex flex-col">
      <div className="p-5 border-b border-earth-700">
        <span className="text-xl font-display font-bold text-white">LocalLink <span className="text-brand-400">Admin</span></span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            location.pathname === to ? 'bg-brand-500/20 text-brand-400' : 'hover:bg-earth-700/50 hover:text-white'
          }`}>
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-900/30 text-red-400 w-full">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
};

// Stats Overview
const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/freelancers/pending?limit=5'),
    ]).then(([s, p]) => {
      setStats(s.data.data);
      setPending(p.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader className="w-8 h-8 animate-spin text-brand-500" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-earth-900">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers, color: 'bg-blue-500' },
          { label: 'Freelancers', value: stats?.totalFreelancers, color: 'bg-green-500' },
          { label: 'Pending', value: stats?.pendingFreelancers, color: 'bg-amber-500' },
          { label: 'Approved', value: stats?.approvedFreelancers, color: 'bg-emerald-500' },
          { label: 'Banned', value: stats?.bannedUsers, color: 'bg-red-500' },
          { label: 'Reviews', value: stats?.totalReviews, color: 'bg-purple-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-earth-900">{s.value ?? '—'}</p>
            <p className="text-xs text-earth-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-earth-100 flex items-center justify-between">
            <h2 className="font-semibold text-earth-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Approvals ({stats?.pendingFreelancers})
            </h2>
            <Link to="/admin/freelancers" className="text-brand-600 text-sm hover:underline flex items-center gap-1">See all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {pending.map(f => (
            <PendingRow key={f._id} freelancer={f} onAction={() => {
              setPending(p => p.filter(x => x._id !== f._id));
              setStats(s => s ? { ...s, pendingFreelancers: s.pendingFreelancers - 1 } : s);
            }} />
          ))}
        </div>
      )}
    </div>
  );
};

// Pending Row Component
const PendingRow = ({ freelancer, onAction }) => {
  const [acting, setActing] = useState(false);

  const act = async (action) => {
    setActing(true);
    try {
      await api.put(`/admin/freelancers/${freelancer._id}/${action}`);
      toast.success(`Freelancer ${action}d`);
      onAction();
    } catch { toast.error('Action failed'); } 
    finally { setActing(false); }
  };

  return (
    <div className="px-4 py-3 border-b border-earth-50 flex items-center justify-between">
      <div>
        <p className="font-medium text-earth-900 text-sm">{freelancer.user?.name}</p>
        <p className="text-xs text-earth-400">{freelancer.user?.phone} · {freelancer.primaryCategory?.name}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => act('approve')} disabled={acting} className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium">
          <Check className="w-3.5 h-3.5" /> Approve
        </button>
        <button onClick={() => act('reject')} disabled={acting} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium">
          <X className="w-3.5 h-3.5" /> Reject
        </button>
      </div>
    </div>
  );
};

// Freelancers Management
const FreelancerManagement = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get(`/admin/freelancers${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then(r => setFreelancers(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const act = async (id, action) => {
    try {
      await api.put(`/admin/freelancers/${id}/${action}`);
      toast.success(`Done!`);
      fetchData();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-display font-bold text-earth-900">Freelancers</h1>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-40 text-sm py-2">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {loading ? <div className="flex justify-center py-10"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-earth-50">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold hidden lg:table-cell">Price</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {freelancers.map(f => (
                <tr key={f._id} className="border-t border-earth-100 hover:bg-earth-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-earth-900">{f.user?.name}</p>
                    <p className="text-xs text-earth-400">{f.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-earth-600">{f.primaryCategory?.name}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-earth-600">{formatPrice(f.priceAmount, f.priceModel)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      f.status === 'approved' ? 'badge-green' :
                      f.status === 'pending' ? 'badge-orange' : 'badge-red'
                    }`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {f.status === 'pending' && (
                        <>
                          <button onClick={() => act(f._id, 'approve')} className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => act(f._id, 'reject')} className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {f.status === 'approved' && (
                        <button onClick={() => act(f._id, 'reject')} className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-lg"><Ban className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {freelancers.length === 0 && <p className="text-center py-8 text-earth-400">No freelancers found</p>}
        </div>
      )}
    </div>
  );
};

// Users Management
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get('/admin/users').then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleBan = async (id, isBanned) => {
    try {
      await api.put(`/admin/users/${id}/${isBanned ? 'unban' : 'ban'}`, { reason: 'Policy violation' });
      toast.success(`User ${isBanned ? 'unbanned' : 'banned'}`);
      fetchData();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-earth-900 mb-5">Users</h1>
      {loading ? <div className="flex justify-center py-10"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-earth-50">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Role</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-earth-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-t border-earth-100 hover:bg-earth-50">
                  <td className="px-4 py-3"><p className="font-medium text-earth-900">{u.name || '—'}</p></td>
                  <td className="px-4 py-3 hidden md:table-cell text-earth-600">{u.phone}</td>
                  <td className="px-4 py-3"><span className="badge badge-blue capitalize">{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isBanned ? 'badge-red' : 'badge-green'}`}>{u.isBanned ? 'Banned' : 'Active'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleBan(u._id, u.isBanned)} className={`${u.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'} p-1.5 rounded-lg`}>
                      {u.isBanned ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center py-8 text-earth-400">No users found</p>}
        </div>
      )}
    </div>
  );
};

// Main Admin Dashboard
export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-earth-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="freelancers" element={<FreelancerManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="categories" element={<div className="p-6"><h1 className="text-2xl font-display font-bold">Categories — Coming Soon</h1></div>} />
        </Routes>
      </div>
    </div>
  );
}
