import { formatDate } from '@/lib/formatter';

interface StudyGoal {
  id: number;
  name: string;
  progress: number;
  deadline: string;
}

interface StudyProgressProps {
  goal: StudyGoal;
  onUpdate?: (id: number, progress: number) => void;
}

export default function StudyProgress({ goal, onUpdate }: StudyProgressProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{goal.name}</h3>
        <span className="text-sm font-bold text-blue-600">{goal.progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all"
          style={{ width: `${goal.progress}%` }}
        ></div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Deadline: {formatDate(goal.deadline)}</span>
        {onUpdate && (
          <input
            type="range"
            min="0"
            max="100"
            value={goal.progress}
            onChange={(e) => onUpdate(goal.id, parseInt(e.target.value))}
            className="w-24"
          />
        )}
      </div>
    </div>
  );
}
