import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import StatsCard from '../components/StatsCard';
import {
  CheckSquare,
  AlertTriangle,
  ListTodo,
  CircleDot,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = ['#2d2d2d', '#eab308', '#22c55e'];
const PRIORITY_COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-[#888]">
        <p className="text-[15px]">No data yet. Create a project to get started.</p>
      </div>
    );
  }

  const statusData = [
    { name: 'To Do', value: stats.todoCount },
    { name: 'In Progress', value: stats.inProgressCount },
    { name: 'Done', value: stats.doneCount },
  ];

  const priorityData = [
    { name: 'Low', value: stats.priorityBreakdown.low },
    { name: 'Medium', value: stats.priorityBreakdown.medium },
    { name: 'High', value: stats.priorityBreakdown.high },
  ];

  const userTaskData = stats.tasksPerUser.map((u) => ({
    name: u.name?.split(' ')[0] || '?',
    Tasks: u.count,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-[#2d2d2d]">Dashboard</h1>
        <p className="text-[13px] text-[#888] mt-0.5">
          How your team is doing this week
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Tasks" value={stats.totalTasks} icon={ListTodo} color="blue" />
        <StatsCard title="In Progress" value={stats.inProgressCount} icon={CircleDot} color="yellow" />
        <StatsCard title="Completed" value={stats.doneCount} icon={CheckSquare} color="green" />
        <StatsCard title="Overdue" value={stats.overdueCount} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e8e5e0] p-4">
          <h2 className="text-[14px] font-semibold text-[#2d2d2d] mb-3">Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={STATUS_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#e8e5e0] p-4">
          <h2 className="text-[14px] font-semibold text-[#2d2d2d] mb-3">Tasks per Person</h2>
          {userTaskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={userTaskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Tasks" fill="#2d2d2d" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-[#bbb] text-[13px]">
              No data yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#e8e5e0] p-4">
          <h2 className="text-[14px] font-semibold text-[#2d2d2d] mb-3">Priority</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label>
                {priorityData.map((_, index) => (
                  <Cell key={index} fill={PRIORITY_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-[#e8e5e0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#2d2d2d]">Recent Tasks</h2>
            <Link to="/tasks" className="text-[12px] text-[#888] hover:text-[#2d2d2d] transition-colors">
              View all
            </Link>
          </div>
          {stats.recentTasks.length > 0 ? (
            <div className="space-y-2">
              {stats.recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-2.5 bg-[#faf9f7] rounded-md border border-[#f0eeeb]"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#2d2d2d] truncate">{task.title}</p>
                    <p className="text-[11px] text-[#aaa]">
                      {task.project?.title} &middot; {task.assignedTo?.name}
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 px-2 py-0.5 rounded text-[11px] font-medium ${
                      task.status === 'done'
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : task.status === 'in_progress'
                        ? 'bg-[#fef9c3] text-[#ca8a04]'
                        : 'bg-[#f0eeeb] text-[#888]'
                    }`}
                  >
                    {task.status === 'in_progress'
                      ? 'In Progress'
                      : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#bbb] text-[13px]">No tasks yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
