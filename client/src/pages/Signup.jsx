import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signupUser, clearError } from '../store/authSlice';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(signupUser(form));
    if (!result.error) navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[22px] font-bold tracking-tight text-[#2d2d2d]">
            Create account
          </h1>
          <p className="text-[13px] text-[#888] mt-1">
            Join your team and start shipping
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#e8e5e0] p-5">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 text-[13px] text-[#dc2626] bg-[#fef2f2] rounded-md border border-[#fecaca]">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-[#555] mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb]" size={15} />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors"
                  placeholder="Jane Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#555] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb]" size={15} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#555] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb]" size={15} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-[13px] font-medium text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] active:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[13px] text-[#888]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2d2d2d] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
