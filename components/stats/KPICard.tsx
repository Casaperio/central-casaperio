import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
 title: string;
 value: string | number;
 subtitle?: string;
 icon?: React.ReactNode;
 trend?: {
  value: number;
  isPositive: boolean;
 };
 loading?: boolean;
}

export function KPICard({ title, value, subtitle, icon, trend, loading }: KPICardProps) {
 if (loading) {
  return (
   <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
   </div>
  );
 }

 return (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
   <div className="flex items-start justify-between mb-2">
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    {icon && <div className="text-gray-400">{icon}</div>}
   </div>

   <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>

   {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

   {trend && (
    <div
     className={`flex items-center gap-1 mt-2 text-sm ${
      trend.isPositive ? 'text-green-600' : 'text-red-600'
     }`}
    >
     {trend.isPositive ? (
      <TrendingUp className="h-4 w-4" />
     ) : (
      <TrendingDown className="h-4 w-4" />
     )}
     <span>{Math.abs(trend.value)}%</span>
    </div>
   )}
  </div>
 );
}
