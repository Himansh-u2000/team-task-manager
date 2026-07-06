import { Link } from 'react-router-dom';
import { FolderKanban, Users, CheckCircle } from 'lucide-react';

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="block bg-white rounded-lg border border-[#e8e5e0] p-4 hover:border-[#ccc] transition-colors group"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="w-8 h-8 bg-[#f0eeeb] rounded-md flex items-center justify-center group-hover:bg-[#2d2d2d] group-hover:text-white transition-colors">
          <FolderKanban size={16} className="text-[#888] group-hover:text-white transition-colors" />
        </div>
        <span className="text-[11px] text-[#bbb]">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>

      <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-0.5 truncate">{project.title}</h3>
      {project.description && (
        <p className="text-[12px] text-[#888] mb-2.5 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-1 text-[#aaa]">
          <Users size={12} />
          <span>{project.members?.length || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-[#aaa]">
          <CheckCircle size={12} />
          <span>{project.doneCount || 0}/{project.taskCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}
