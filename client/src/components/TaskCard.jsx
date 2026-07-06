import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, AlertCircle, Calendar } from 'lucide-react';

const priorityStyles = {
  low: 'bg-[#dcfce7] text-[#16a34a]',
  medium: 'bg-[#fef9c3] text-[#ca8a04]',
  high: 'bg-[#fef2f2] text-[#dc2626]',
};

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
  overlay,
  canChangeStatus = false,
  sortableDisabled = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { task }, disabled: sortableDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-md border border-[#e8e5e0] p-3 group relative ${
        isDragging ? 'opacity-40 shadow-lg ring-2 ring-[#2d2d2d]/10' : ''
      } ${overlay ? 'shadow-xl rotate-2' : ''}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className={`mt-0.5 p-0.5 shrink-0 ${
            sortableDisabled
              ? 'text-[#e2e2e2] cursor-default'
              : 'text-[#ccc] hover:text-[#888] cursor-grab active:cursor-grabbing'
          }`}
          disabled={sortableDisabled}
        >
          <GripVertical size={13} />
        </button>
        <h4 className="text-[13px] font-medium text-[#2d2d2d] flex-1 leading-snug">{task.title}</h4>
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-[12px] text-[#888] mb-2 line-clamp-2 pl-5">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-2 pl-5">
        <span className="text-[11px] text-[#aaa]">
          {task.assignedTo?.name || 'Unassigned'}
        </span>
        {isOverdue && (
          <span className="flex items-center gap-0.5 text-[11px] text-[#dc2626] font-medium">
            <AlertCircle size={10} /> Overdue
          </span>
        )}
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-1 text-[11px] text-[#bbb] mb-2 pl-5">
          <Calendar size={10} />
          {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pl-5 pt-1 border-t border-[#f5f4f2]">
        {onStatusChange ? (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            disabled={!canChangeStatus}
            className="text-[11px] border border-[#e8e5e0] rounded px-1.5 py-1 bg-[#faf9f7] text-[#666] focus:outline-none focus:border-[#2d2d2d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        ) : (
          <span />
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task._id)}
            className="p-1 text-[#ccc] hover:text-[#dc2626] rounded transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
