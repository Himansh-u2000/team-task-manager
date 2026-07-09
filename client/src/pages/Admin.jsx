import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMember,
  createProject,
  createTask,
  deleteTask,
  getAllUsers,
  getProject,
  getProjects,
  getProjectTasks,
  removeMember,
  updateTask,
} from '../services/api';
import {
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Plus,
  Settings2,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonBlock, SkeletonListItem } from '../components/Skeleton';

export default function Admin() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });
  const [memberToAdd, setMemberToAdd] = useState('');
  const taskSubmitting = useRef(false);
  const projectSubmitting = useRef(false);
  const memberSubmitting = useRef(false);

  const fetchProjects = async (preferredProjectId = selectedProjectId) => {
    const res = await getProjects();
    const nextProjects = res.data.projects;
    setProjects(nextProjects);

    if (!nextProjects.length) {
      setSelectedProjectId('');
      setSelectedProject(null);
      setSelectedTasks([]);
      return;
    }

    const targetId = nextProjects.some((project) => project._id === preferredProjectId)
      ? preferredProjectId
      : nextProjects[0]._id;

    setSelectedProjectId(targetId);
  };

  const fetchUsers = async () => {
    const res = await getAllUsers();
    setUsers(res.data.users);
  };

  const fetchSelectedProjectData = async (projectId) => {
    if (!projectId) {
      setSelectedProject(null);
      setSelectedTasks([]);
      return;
    }

    const [projectRes, taskRes] = await Promise.all([
      getProject(projectId),
      getProjectTasks(projectId),
    ]);

    setSelectedProject(projectRes.data.project);
    setSelectedTasks(taskRes.data.tasks);
  };

  useEffect(() => {
    Promise.all([fetchProjects(''), fetchUsers()])
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      setSelectedTasks([]);
      return;
    }

    setManaging(true);
    fetchSelectedProjectData(selectedProjectId)
      .catch(() => setError('Failed to load selected project'))
      .finally(() => setManaging(false));
  }, [selectedProjectId]);

  const availableMembers = useMemo(() => {
    if (!selectedProject) return [];

    return users.filter(
      (user) => !selectedProject.members.some((member) => member._id === user._id)
    );
  }, [selectedProject, users]);

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (projectSubmitting.current) return;
    clearMessages();
    projectSubmitting.current = true;
    setCreatingProject(true);

    try {
      const res = await createProject(projectForm);
      setProjectForm({ title: '', description: '' });
      await fetchProjects(res.data.project._id);
      setNotice('Project created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      projectSubmitting.current = false;
      setCreatingProject(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedProjectId || !memberToAdd || memberSubmitting.current) return;

    clearMessages();
    memberSubmitting.current = true;
    setAddingMember(true);

    try {
      await addMember(selectedProjectId, memberToAdd);
      setMemberToAdd('');
      await Promise.all([fetchProjects(selectedProjectId), fetchSelectedProjectData(selectedProjectId)]);
      setNotice('Member added successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      memberSubmitting.current = false;
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    clearMessages();

    try {
      await removeMember(selectedProjectId, userId);
      await Promise.all([fetchProjects(selectedProjectId), fetchSelectedProjectData(selectedProjectId)]);
      setNotice('Member removed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || taskSubmitting.current) return;

    clearMessages();
    taskSubmitting.current = true;
    setCreatingTask(true);

    try {
      await createTask({
        ...taskForm,
        project: selectedProjectId,
      });
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
      });
      await Promise.all([fetchProjects(selectedProjectId), fetchSelectedProjectData(selectedProjectId)]);
      setNotice('Task assigned successfully');
      toast.success('Task created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      taskSubmitting.current = false;
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    clearMessages();

    try {
      await deleteTask(taskId);
      await Promise.all([fetchProjects(selectedProjectId), fetchSelectedProjectData(selectedProjectId)]);
      setNotice('Task deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleReassignTask = async (taskId, assignedTo) => {
    clearMessages();
    setUpdatingTaskId(taskId);

    try {
      await updateTask(taskId, { assignedTo });
      await Promise.all([fetchProjects(selectedProjectId), fetchSelectedProjectData(selectedProjectId)]);
      setNotice('Task reassigned successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reassign task');
    } finally {
      setUpdatingTaskId('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <SkeletonBlock className="h-6 w-24 mb-1.5" />
          <SkeletonBlock className="h-3.5 w-64" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <section className="bg-white rounded-lg border border-[#e8e5e0] p-4">
            <SkeletonBlock className="h-4 w-24 mb-3" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border border-[#e8e5e0] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <SkeletonBlock className="h-4 w-48 mb-1.5" />
                      <SkeletonBlock className="h-3 w-32" />
                    </div>
                    <SkeletonBlock className="w-16 h-7 shrink-0 rounded" />
                  </div>
                  <div className="flex gap-4 mt-3">
                    <SkeletonBlock className="h-3 w-20" />
                    <SkeletonBlock className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-white rounded-lg border border-[#e8e5e0] p-4">
            <SkeletonBlock className="h-4 w-32 mb-3" />
            <div className="space-y-3">
              <SkeletonBlock className="h-9 w-full" />
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-9 w-full" />
            </div>
          </section>
        </div>
        <section className="bg-white rounded-lg border border-[#e8e5e0] p-4">
          <SkeletonBlock className="h-4 w-36 mb-4" />
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
            <div className="space-y-3">
              <SkeletonBlock className="h-5 w-48" />
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <SkeletonBlock className="h-4 w-28 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonListItem key={i} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <SkeletonBlock className="h-4 w-28 mb-3" />
                <div className="space-y-3">
                  <SkeletonBlock className="h-9 w-full" />
                  <SkeletonBlock className="h-14 w-full" />
                  <SkeletonBlock className="h-9 w-full" />
                </div>
              </div>
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <SkeletonBlock className="h-4 w-36 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonListItem key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">Admin</h1>
        <p className="text-[13px] text-[#888] mt-0.5">
          Manage projects, members, and task assignment from one place
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] text-[#dc2626] bg-[#fef2f2] rounded-md border border-[#fecaca]">
          {error}
        </div>
      )}

      {notice && (
        <div className="p-3 text-[13px] text-[#166534] bg-[#f0fdf4] rounded-md border border-[#bbf7d0]">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <section className="bg-white rounded-lg border border-[#e8e5e0] p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderKanban size={16} className="text-[#888]" />
            <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Projects</h2>
          </div>

          {projects.length === 0 ? (
            <div className="py-12 text-center text-[#bbb] text-[13px]">
              No projects yet
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedProjectId === project._id
                      ? 'border-[#2d2d2d] bg-[#faf9f7]'
                      : 'border-[#e8e5e0] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-[#2d2d2d] truncate">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-[12px] text-[#888] mt-0.5 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedProjectId(project._id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] border border-[#ddd] rounded-md hover:bg-[#f0eeeb] text-[#555] transition-colors"
                      >
                        <Settings2 size={13} /> Manage
                      </button>
                      <Link
                        to={`/projects/${project._id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] transition-colors"
                      >
                        Open
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-[12px] text-[#888]">
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {project.members?.length || 0} members
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> {project.doneCount || 0}/{project.taskCount || 0} done
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg border border-[#e8e5e0] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-[#888]" />
            <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Create Project</h2>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-[#555] mb-1">Title</label>
              <input
                type="text"
                required
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors"
                placeholder="Project title"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#555] mb-1">Description</label>
              <textarea
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors resize-none"
                placeholder="Optional"
              />
            </div>

            <button
              type="submit"
              disabled={creatingProject}
              className="w-full py-2 px-4 text-[13px] font-medium text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
            >
              {creatingProject ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </section>
      </div>

      <section className="bg-white rounded-lg border border-[#e8e5e0] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={16} className="text-[#888]" />
          <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Manage Project</h2>
        </div>

        {!selectedProject ? (
          <div className="py-12 text-center text-[#bbb] text-[13px]">
            Select a project to manage members and assign work
          </div>
        ) : managing ? (
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
            <div className="space-y-4">
              <SkeletonBlock className="h-5 w-48" />
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <SkeletonBlock className="h-4 w-28 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonListItem key={i} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <SkeletonBlock className="h-4 w-28 mb-3" />
                <div className="space-y-3">
                  <SkeletonBlock className="h-9 w-full" />
                  <SkeletonBlock className="h-14 w-full" />
                  <SkeletonBlock className="h-9 w-full" />
                </div>
              </div>
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <SkeletonBlock className="h-4 w-36 mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonListItem key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-semibold text-[#2d2d2d]">
                  {selectedProject.title}
                </h3>
                {selectedProject.description && (
                  <p className="text-[13px] text-[#888] mt-1">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-[#888]" />
                  <h4 className="text-[14px] font-semibold text-[#2d2d2d]">
                    Members ({selectedProject.members.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {selectedProject.members.map((member) => {
                    const isCreator = member._id === selectedProject.createdBy?._id;

                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-[#faf9f7] rounded-md border border-[#f0eeeb]"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#2d2d2d] truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-[#aaa] truncate">{member.email}</p>
                        </div>
                        {!isCreator && (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="p-1 text-[#ccc] hover:text-[#dc2626] rounded transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <select
                    value={memberToAdd}
                    onChange={(e) => setMemberToAdd(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#2d2d2d]"
                  >
                    <option value="">Add member to project</option>
                    {availableMembers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!memberToAdd || addingMember}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
                  >
                    <UserPlus size={14} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Plus size={14} className="text-[#888]" />
                  <h4 className="text-[14px] font-semibold text-[#2d2d2d]">Assign Task</h4>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#555] mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors"
                      placeholder="Task title"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#555] mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d] focus:bg-white transition-colors resize-none"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[13px] font-medium text-[#555] mb-1">Assign to</label>
                      <select
                        required
                        value={taskForm.assignedTo}
                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                        className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#2d2d2d]"
                      >
                        <option value="">Select project member</option>
                        {selectedProject.members.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#555] mb-1">Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#2d2d2d]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#555] mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-white focus:outline-none focus:border-[#2d2d2d]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingTask || !selectedProject.members.length}
                    className="w-full py-2 px-4 text-[13px] font-medium text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
                  >
                    {creatingTask ? 'Assigning...' : 'Assign Task'}
                  </button>
                </form>
              </div>

              <div className="rounded-lg border border-[#e8e5e0] p-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} className="text-[#888]" />
                  <h4 className="text-[14px] font-semibold text-[#2d2d2d]">
                    Existing Tasks ({selectedTasks.length})
                  </h4>
                </div>

                {selectedTasks.length === 0 ? (
                  <div className="py-8 text-center text-[#bbb] text-[13px]">
                    No tasks assigned yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map((task) => (
                      <div
                        key={task._id}
                        className="p-2.5 bg-[#faf9f7] rounded-md border border-[#f0eeeb]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#2d2d2d] truncate">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-[#aaa] truncate">
                              {task.assignedTo?.name} - {task.status.replace('_', ' ')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1 text-[#ccc] hover:text-[#dc2626] rounded transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <select
                            value={task.assignedTo?._id || ''}
                            onChange={(e) => handleReassignTask(task._id, e.target.value)}
                            disabled={updatingTaskId === task._id}
                            className="flex-1 px-2.5 py-1.5 border border-[#ddd] rounded-md text-[12px] bg-white focus:outline-none focus:border-[#2d2d2d] disabled:opacity-50"
                          >
                            {selectedProject.members.map((member) => (
                              <option key={member._id} value={member._id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-[11px] text-[#aaa] shrink-0">
                            Reassign
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
