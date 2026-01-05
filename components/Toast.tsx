
import React from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { useUIStore, ToastMessage } from '../lib/store';

// Fix: Use React.FC to properly handle intrinsic props like 'key' in mapped components
const Toast: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const { removeToast } = useUIStore();

  const configs = {
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    error: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    info: { icon: Info, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  };

  const config = configs[toast.type];
  const Icon = config.icon;

  return (
    <div className={`w-80 glass-panel p-4 rounded-2xl border ${config.border} flex items-start gap-3 shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300`}>
      <div className={`p-2 rounded-xl ${config.bg} ${config.color} shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white truncate">{toast.title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{toast.message}</p>
      </div>
      <button 
        onClick={() => removeToast(toast.id)}
        className="text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastManager = () => {
  const { toasts } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
