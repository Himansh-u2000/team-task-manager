import { useSelector } from 'react-redux';
import { getProjects } from '../services/api';
import { useState, useEffect } from 'react';
import { User, Mail, Shield, FolderKanban } from 'lucide-react';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getProjects()
      .then((res) => setProjects(res.data.projects))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">Profile</h1>

      <div className="bg-white rounded-lg border border-[#e8e5e0] p-5">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-lg bg-[#2d2d2d] flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-[#2d2d2d]">{user?.name}</h2>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase mt-1 ${
                user?.role === 'admin'
                  ? 'bg-[#fef3c7] text-[#b45309]'
                  : 'bg-[#f0eeeb] text-[#888]'
              }`}
            >
              <Shield size={10} />
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-[13px]">
            <User size={14} className="text-[#bbb]" />
            <span className="text-[#666]">{user?.name}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px]">
            <Mail size={14} className="text-[#bbb]" />
            <span className="text-[#666]">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px]">
            <Shield size={14} className="text-[#bbb]" />
            <span className="text-[#666] capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e8e5e0] p-5">
        <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-3">
          Projects ({projects.length})
        </h3>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#bbb]">
            <FolderKanban size={28} className="mb-2" />
            <p className="text-[13px]">No projects yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {projects.map((project) => (
              <div
                key={project._id}
                className="flex items-center justify-between p-2.5 bg-[#faf9f7] rounded-md border border-[#f0eeeb]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderKanban size={14} className="text-[#888] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#2d2d2d] truncate">
                      {project.title}
                    </p>
                    <p className="text-[11px] text-[#aaa]">
                      {project.members?.length} members &middot; {project.taskCount} tasks
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-[#bbb] shrink-0 ml-2">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
