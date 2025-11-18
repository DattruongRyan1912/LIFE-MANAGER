import { formatDateTime, getPriorityColor, getPriorityLabel } from '@/lib/formatter';

interface Task {
  id: number;
  title: string;
  priority: string;
  due_at: string;
  estimated_minutes?: number;
  done: boolean;
}

interface TaskCardProps {
  task: Task;
  onToggle?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggle?.(task.id)}
            className="mt-1 h-5 w-5 rounded border-gray-300"
          />
          <div className="flex-1">
            <h3 className={`font-medium ${task.done ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              <span>{formatDateTime(task.due_at)}</span>
              {task.estimated_minutes && (
                <span>⏱️ {task.estimated_minutes} phút</span>
              )}
            </div>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
