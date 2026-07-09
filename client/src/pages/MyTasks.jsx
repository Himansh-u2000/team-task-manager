import { useState, useEffect } from 'react';
import { getMyTasks, updateTaskStatus } from '../services/api';
import TaskCard from '../components/TaskCard';
import { CheckSquare, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonBlock } from '../components/Skeleton';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTasks = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;

    getMyTasks(params)
      .then((res) => setTasks(res.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">My Tasks</h1>
        <p className="text-[13px] text-[#888] mt-0.5">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-[#bbb]" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-[13px] border border-[#ddd] rounded-md bg-white text-[#555] focus:outline-none focus:border-[#2d2d2d]"
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 text-[13px] border border-[#ddd] rounded-md bg-white text-[#555] focus:outline-none focus:border-[#2d2d2d]"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div>
            <SkeletonBlock className="h-5 w-24 mb-1.5" />
            <SkeletonBlock className="h-3.5 w-40" />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-8 w-28 rounded-md" />
            <SkeletonBlock className="h-8 w-32 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-md border border-[#e8e5e0] p-3">
                <div className="flex items-start gap-2 mb-2">
                  <SkeletonBlock className="w-3 h-3 shrink-0 mt-0.5" />
                  <SkeletonBlock className="h-3.5 flex-1" />
                  <SkeletonBlock className="w-12 h-4 shrink-0 rounded" />
                </div>
                <SkeletonBlock className="h-2.5 w-32 mb-2 ml-5" />
                <SkeletonBlock className="h-2 w-20 ml-5 mb-2" />
                <div className="pl-5 pt-1 border-t border-[#f5f4f2] flex justify-between">
                  <SkeletonBlock className="h-5 w-20 rounded" />
                  <SkeletonBlock className="w-5 h-5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#bbb]">
          <CheckSquare size={36} className="mb-3" />
          <p className="text-[14px] font-medium text-[#888]">No tasks found</p>
          <p className="text-[12px] mt-1">Tasks assigned to you will show up here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              canChangeStatus
              sortableDisabled
            />
          ))}
        </div>
      )}
    </div>
  );
}
