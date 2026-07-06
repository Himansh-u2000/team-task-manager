import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Shield,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? 'bg-[#2d2d2d] text-white'
      : 'text-[#666] hover:bg-[#f0eeeb] hover:text-[#2d2d2d]';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#faf9f7] border-b border-[#e8e5e0] lg:px-6">
      <div className="flex items-center gap-3">
        <button
          className="p-1.5 rounded-md lg:hidden hover:bg-[#f0eeeb] text-[#666]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2d2d2d] rounded-md flex items-center justify-center">
            <FolderKanban className="text-white" size={15} />
          </div>
          <span className="hidden sm:inline text-sm font-semibold tracking-tight text-[#2d2d2d]">
            Tasks
          </span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-0.5">
        <Link to="/" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] ${isActive('/')}`}>
          <LayoutDashboard size={14} /> Dashboard
        </Link>
        <Link to="/projects" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] ${isActive('/projects')}`}>
          <FolderKanban size={14} /> Projects
        </Link>
        <Link to="/tasks" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] ${isActive('/tasks')}`}>
          <CheckSquare size={14} /> My Tasks
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] ${isActive('/admin')}`}>
            <Shield size={14} /> Admin
          </Link>
        )}
        <Link to="/profile" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] ${isActive('/profile')}`}>
          <User size={14} /> Profile
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-[13px] text-[#888]">
          {user?.name}
        </span>
        <span
          className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${
            user?.role === 'admin'
              ? 'bg-[#fef3c7] text-[#b45309]'
              : 'bg-[#f0eeeb] text-[#888]'
          }`}
        >
          {user?.role}
        </span>
        <button
          onClick={() => dispatch(logoutUser())}
          className="flex items-center gap-1 px-2 py-1.5 text-[13px] text-[#999] rounded-md hover:bg-[#fef2f2] hover:text-[#dc2626] transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
