interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
}

export default function KpiCard({ title, value, icon, trend }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>
    </div>
  );
}
