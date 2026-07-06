import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useSelector } from 'react-redux';

export default function Sidebar({ open, onClose }) {
  const { user } = useSelector((state) => state.auth);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
      isActive
        ? 'bg-[#2d2d2d] text-white font-medium'
        : 'text-[#666] hover:bg-[#f0eeeb] hover:text-[#2d2d2d]'
    }`;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-14 left-0 z-50 w-56 h-[calc(100vh-3.5rem)] bg-[#faf9f7] border-r border-[#e8e5e0] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3 lg:hidden">
          <span className="font-medium text-[13px] text-[#2d2d2d]">Menu</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[#f0eeeb]">
            <X size={16} className="text-[#888]" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-2">
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={linkClass} onClick={onClose}>
            <FolderKanban size={15} /> Projects
          </NavLink>
          <NavLink to="/tasks" className={linkClass} onClick={onClose}>
            <CheckSquare size={15} /> My Tasks
          </NavLink>
          <NavLink to="/team" className={linkClass} onClick={onClose}>
            <Users size={15} /> Team
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass} onClick={onClose}>
              <Shield size={15} /> Admin
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass} onClick={onClose}>
            <User size={15} /> Profile
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
