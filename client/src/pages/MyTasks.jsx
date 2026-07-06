import { useState, useEffect } from 'react';
import { getMyTasks, updateTaskStatus } from '../services/api';
import TaskCard from '../components/TaskCard';
import { CheckSquare, Filter } from 'lucide-react';

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
    try {
      await updateTaskStatus(taskId, status);
      fetchTasks();
    } catch (err) {
      console.error(err);
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
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
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
