import { useState, useEffect } from 'react';
import { getProjects } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import { FolderKanban } from 'lucide-react';
import { SkeletonBlock } from '../components/Skeleton';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = () => {
    getProjects()
      .then((res) => setProjects(res.data.projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">Projects</h1>
          <p className="text-[13px] text-[#888] mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-[#e8e5e0] p-4">
                <SkeletonBlock className="h-4 w-3/4 mb-2" />
                <SkeletonBlock className="h-3 w-full mb-1" />
                <SkeletonBlock className="h-3 w-2/3 mb-3" />
                <div className="flex gap-3">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#bbb]">
          <FolderKanban size={36} className="mb-3" />
          <p className="text-[14px] font-medium text-[#888]">No projects yet</p>
          <p className="text-[12px] mt-1">Create one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
