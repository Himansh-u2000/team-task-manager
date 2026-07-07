import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import {
  addMember,
  createTask,
  deleteProject,
  deleteTask,
  getAllUsers,
  getProject,
  getProjectTasks,
  removeMember,
  updateTaskStatus,
} from '../services/api';

function KanbanColumn({
  column,
  tasks,
  onStatusChange,
  onDelete,
  currentUserId,
  isAdmin,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-t-2 ${column.color} transition-colors ${isOver ? 'bg-[#f0eeeb]' : 'bg-[#faf9f7]'
        }`}
    >
      <div className="flex items-center justify-between mb-3 px-1 pt-2">
        <h3 className="text-[12px] font-semibold text-[#666] uppercase tracking-wider">
          {column.label}
        </h3>
        <span className="text-[11px] text-[#aaa] font-medium bg-white border border-[#e8e5e0] rounded px-1.5 py-0.5">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 p-1 min-h-[60px]">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            (() => {
              const canManageStatus =
                isAdmin || task.assignedTo?._id === currentUserId;

              return (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  canChangeStatus={canManageStatus}
                  sortableDisabled={!canManageStatus}
                />
              );
            })()
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-[12px] text-[#ccc] text-center py-6">
            Drop here
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [dragOriginalStatus, setDragOriginalStatus] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const isAdmin = user?.role === 'admin';

  const fetchProject = () => {
    return getProject(id)
      .then((res) => setProject(res.data.project))
      .catch(() => navigate('/projects'));
  };

  const fetchTasks = () => {
    return getProjectTasks(id)
      .then((res) => setTasks(res.data.tasks))
      .catch(() => { });
  };

  const fetchUsers = () => {
    return getAllUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => { });
  };

  useEffect(() => {
    Promise.all([fetchProject(), fetchTasks()]).finally(() =>
      setLoading(false)
    );
  }, [id]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [id, isAdmin]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTask({ ...taskForm, project: id });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      fetchTasks();
      toast.success('Task created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    const originalTask = tasks.find((t) => t._id === taskId);
    const originalStatus = originalTask?.status;

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status } : t))
    );

    try {
      await updateTaskStatus(taskId, status);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: originalStatus } : t))
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await addMember(id, userId);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await removeMember(id, userId);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    const task = tasks.find((t) => t._id === event.active.id);
    setDragOriginalStatus(task ? task.status : null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setDragOriginalStatus(null);
      return;
    }

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) {
      setDragOriginalStatus(null);
      return;
    }
    const canManageStatus =
      isAdmin || activeTask.assignedTo?._id === user?.id;
    if (!canManageStatus) {
      setDragOriginalStatus(null);
      return;
    }

    let targetStatus = over.id;
    const targetColumn = columns.find((c) => c.key === over.id);
    if (!targetColumn) {
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) targetStatus = overTask.status;
      else {
        setDragOriginalStatus(null);
        return;
      }
    }

    const originalStatus = dragOriginalStatus;
    setDragOriginalStatus(null);

    if (originalStatus === targetStatus) return;

    try {
      await updateTaskStatus(active.id, targetStatus);
      setTasks((prev) =>
        prev.map((t) => (t._id === active.id ? { ...t, status: targetStatus } : t))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
      setTasks((prev) =>
        prev.map((t) => (t._id === active.id ? { ...t, status: originalStatus } : t))
      );
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;
    const canManageStatus =
      isAdmin || activeTask.assignedTo?._id === user?.id;
    if (!canManageStatus) return;

    let targetStatus = over.id;
    const targetColumn = columns.find((c) => c.key === over.id);
    if (!targetColumn) {
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) targetStatus = overTask.status;
      else return;
    }

    if (activeTask.status !== targetStatus) {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === active.id ? { ...t, status: targetStatus } : t
        )
      );
    }
  };

  const columns = [
    { key: 'todo', label: 'To Do', color: 'border-[#93c5fd]' },
    { key: 'in_progress', label: 'In Progress', color: 'border-[#fbbf24]' },
    { key: 'done', label: 'Done', color: 'border-[#4ade80]' },
  ];

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/projects')}
            className="p-1.5 rounded-md hover:bg-[#f0eeeb] text-[#888]"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">{project.title}</h1>
            {project.description && (
              <p className="text-[13px] text-[#888] mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemberModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] border border-[#ddd] rounded-md hover:bg-[#f0eeeb] text-[#666] transition-colors"
          >
            <Users size={14} /> <span className="hidden sm:inline">Members</span> ({project.members?.length})
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] transition-colors"
              >
                <Plus size={14} /> Task
              </button>
              <button
                onClick={handleDeleteProject}
                className="p-1.5 text-[#ccc] border border-[#ddd] rounded-md hover:bg-[#fef2f2] hover:text-[#dc2626] hover:border-[#fecaca] transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Members bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-[#bbb] uppercase tracking-wider font-medium">Members</span>
        {project.members?.map((m) => (
          <div
            key={m._id}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#f0eeeb] rounded text-[12px] text-[#666]"
          >
            <span>{m.name}</span>
            {isAdmin && m._id !== project.createdBy?._id && (
              <button
                onClick={() => handleRemoveMember(m._id)}
                className="ml-0.5 text-[#ccc] hover:text-[#dc2626] transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              tasks={tasks.filter((t) => t.status === col.key)}
              onStatusChange={handleStatusChange}
              onDelete={isAdmin ? handleDeleteTask : null}
              currentUserId={user?.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm bg-white rounded-lg border border-[#e8e5e0] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#2d2d2d]">New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded hover:bg-[#f0eeeb]"
              >
                <X size={16} className="text-[#888]" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 mb-3 text-[13px] text-[#dc2626] bg-[#fef2f2] rounded-md border border-[#fecaca]">
                {error}
              </div>
            )}

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

              <div>
                <label className="block text-[13px] font-medium text-[#555] mb-1">Assign to</label>
                <select
                  required
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d]"
                >
                  <option value="">Select member</option>
                  {project.members?.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#555] mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#555] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#ddd] rounded-md text-[13px] bg-[#faf9f7] focus:outline-none focus:border-[#2d2d2d]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 text-[13px] font-medium text-white bg-[#2d2d2d] rounded-md hover:bg-[#1a1a1a] transition-colors"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xs bg-white rounded-lg border border-[#e8e5e0] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#2d2d2d]">Members</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1 rounded hover:bg-[#f0eeeb]"
              >
                <X size={16} className="text-[#888]" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 mb-3 text-[13px] text-[#dc2626] bg-[#fef2f2] rounded-md border border-[#fecaca]">
                {error}
              </div>
            )}

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              <div className="space-y-1.5">
                {project.members?.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-md bg-[#faf9f7] border border-[#f0eeeb]"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#2d2d2d] truncate">{member.name}</p>
                      <p className="text-[11px] text-[#aaa] truncate">{member.email}</p>
                    </div>
                    {isAdmin && member._id !== project.createdBy?._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-1 text-[#ccc] hover:text-[#dc2626] rounded transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && (
                <>
                  <div className="pt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#bbb] mb-2">
                      Add Members
                    </p>
                    {users
                      .filter((u) => !project.members.some((m) => m._id === u._id))
                      .map((u) => (
                        <button
                          key={u._id}
                          onClick={() => handleAddMember(u._id)}
                          className="w-full flex items-center gap-2.5 p-2.5 text-left rounded-md hover:bg-[#faf9f7] border border-transparent hover:border-[#e8e5e0] transition-colors"
                        >
                          <UserPlus size={13} className="text-[#888] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#2d2d2d] truncate">{u.name}</p>
                            <p className="text-[11px] text-[#aaa] truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    {users.filter((u) => !project.members.some((m) => m._id === u._id)).length === 0 && (
                      <p className="text-[13px] text-[#bbb] text-center py-4">
                        Everyone&apos;s in
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
