
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: any;
  color: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, trend, icon: Icon, color }) => {
  const isPositive = trend && trend > 0;

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mt-8 ${color}`}></div>
      
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-opacity-10 ${color} text-white`}>
          <Icon size={24} className="opacity-80" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <span>{isPositive ? '+' : ''}{trend}%</span>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </div>
        )}
      </div>

      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>
    </div>
  );
};
