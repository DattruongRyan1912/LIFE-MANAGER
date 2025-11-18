import { formatCurrency, formatDateTime } from '@/lib/formatter';

interface Expense {
  id: number;
  amount: number;
  category: string;
  note?: string;
  spent_at: string;
}

interface ExpenseItemProps {
  expense: Expense;
  onDelete?: (id: number) => void;
}

export default function ExpenseItem({ expense, onDelete }: ExpenseItemProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{expense.category}</h3>
            <span className="text-lg font-bold text-red-600">
              {formatCurrency(expense.amount)}
            </span>
          </div>
          {expense.note && (
            <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {formatDateTime(expense.spent_at)}
          </p>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(expense.id)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
