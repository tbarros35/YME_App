import React from 'react';
import { cn } from '@/lib/utils';
import { Role, WalletType, TimelineCategory, CalendarCategory, Taskgroup } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'accent' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-700 border-slate-200',
      primary: 'bg-[#151e33] text-white border-transparent shadow-sm',
      accent: 'bg-[#fff0fd] text-[#d81bb0] border-[#ff6ef6]/40 font-bold',
      secondary: 'bg-slate-100 text-slate-700 border-slate-200',
      outline: 'bg-white text-slate-700 border-slate-300',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
      warning: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
      danger: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      info: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-medium transition-colors select-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          Admin
        </span>
      );
    case 'DIRECTOR':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#fff0fd] text-[#b81898] border border-[#ff6ef6]/40">
          Diretor
        </span>
      );
    case 'MEMBER':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          Membro
        </span>
      );
  }
};

export const TaskgroupBadge: React.FC<{ taskgroup: Taskgroup }> = ({ taskgroup }) => {
  switch (taskgroup) {
    case 'CSR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          🌱 CSR
        </span>
      );
    case 'PARTNERSHIPS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          🤝 Partnerships
        </span>
      );
    default:
      return null;
  }
};

export const WalletTypeBadge: React.FC<{ type: WalletType; amount: number }> = ({ type, amount }) => {
  const isPositive = amount > 0;
  switch (type) {
    case 'SAD_REWARD':
      return (
        <Badge variant="accent" className="font-semibold">
          🏆 Prémio SAD
        </Badge>
      );
    case 'PRESENCE_BONUS':
      return (
        <Badge variant="success" className="font-semibold">
          ⚡ Bónus Presença
        </Badge>
      );
    case 'EVENT_SPEND':
      return (
        <Badge variant="warning" className="font-semibold">
          🎟️ Inscrição Evento
        </Badge>
      );
    case 'ADJUSTMENT':
    default:
      return isPositive ? (
        <Badge variant="info">Crédito Direto</Badge>
      ) : (
        <Badge variant="danger">Débito</Badge>
      );
  }
};

export const TimelineCategoryBadge: React.FC<{ category: TimelineCategory }> = ({ category }) => {
  switch (category) {
    case 'RECRUITMENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Recrutamento
        </span>
      );
    case 'PROJECT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fff0fd] text-[#b81898] border border-[#ff6ef6]/40">
          Projeto
        </span>
      );
    case 'TASKGROUP':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Task Group
        </span>
      );
    case 'FORMATION':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Formação
        </span>
      );
    case 'AWARD':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          Distinção
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
          Geral
        </span>
      );
  }
};

export const CalendarCategoryBadge: React.FC<{ category: CalendarCategory }> = ({ category }) => {
  switch (category) {
    case 'GENERAL_ASSEMBLY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33] text-white">
          Assembleia Geral
        </span>
      );
    case 'FORMATION':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Formação
        </span>
      );
    case 'TEAMBUILDING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#fff0fd] text-[#b81898] border border-[#ff6ef6]/40">
          Teambuilding
        </span>
      );
    case 'DEADLINE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Prazo Limite
        </span>
      );
    case 'HR_ACTIVITY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
          👥 Atividade de RH
        </span>
      );
    case 'CSR_ACTIVITY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          🌱 Atividade de RSC
        </span>
      );
    case 'OPEN_DAY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          🤝 Open Day
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
          Evento
        </span>
      );
  }
};
