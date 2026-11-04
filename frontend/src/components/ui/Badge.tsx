import React from 'react';
import { cn } from '@/lib/utils';
import { Role, WalletType, TimelineCategory, CalendarCategory, Taskgroup } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'accent' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-[#151e33]/5 text-[#151e33] border-[#151e33]/10',
      primary: 'bg-[#151e33] text-white border-transparent shadow-sm',
      accent: 'bg-[#ff63f6]/10 text-[#151e33] border-[#ff63f6]/40 font-bold',
      secondary: 'bg-white text-[#151e33] border-[#151e33]/15',
      outline: 'bg-white text-[#151e33] border-[#151e33]/20',
      success: 'bg-[#151e33] text-[#ff63f6] border border-[#ff63f6]/30 font-bold',
      warning: 'bg-[#ff63f6]/10 text-[#151e33] border-[#ff63f6]/30 font-semibold',
      danger: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      info: 'bg-[#151e33]/5 text-[#151e33] border-[#151e33]/15 font-semibold',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-xl border px-2.5 py-0.5 text-[11px] font-semibold transition-colors select-none',
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#151e33] text-white border border-[#ff63f6]/50 shadow-clean-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff63f6] animate-pulse" />
          Admin
        </span>
      );
    case 'DIRECTOR':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#ff63f6]/10 text-[#151e33] border border-[#ff63f6]/40">
          Diretor
        </span>
      );
    case 'MEMBER':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white text-[#151e33] border border-[#151e33]/15 shadow-2xs">
          Membro
        </span>
      );
  }
};

export const TaskgroupBadge: React.FC<{ taskgroup: Taskgroup }> = ({ taskgroup }) => {
  switch (taskgroup) {
    case 'CSR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33] text-white border border-[#151e33]">
          🌱 CSR
        </span>
      );
    case 'PARTNERSHIPS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ff63f6]/10 text-[#151e33] border border-[#ff63f6]/30">
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
        <Badge variant="accent" className="font-extrabold">
          🏆 Prémio SAD
        </Badge>
      );
    case 'PRESENCE_BONUS':
      return (
        <Badge variant="primary" className="font-bold border border-[#ff63f6]/30">
          ⚡ Bónus Presença
        </Badge>
      );
    case 'EVENT_SPEND':
      return (
        <Badge variant="secondary" className="font-bold">
          🎟️ Inscrição Evento
        </Badge>
      );
    case 'ADJUSTMENT':
    default:
      return isPositive ? (
        <Badge variant="accent">Crédito Direto</Badge>
      ) : (
        <Badge variant="secondary">Débito</Badge>
      );
  }
};

export const TimelineCategoryBadge: React.FC<{ category: TimelineCategory }> = ({ category }) => {
  switch (category) {
    case 'RECRUITMENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33]/5 text-[#151e33] border border-[#151e33]/15">
          Recrutamento
        </span>
      );
    case 'PROJECT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ff63f6]/10 text-[#151e33] border border-[#ff63f6]/40">
          Projeto
        </span>
      );
    case 'TASKGROUP':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33] text-white">
          Task Group
        </span>
      );
    case 'FORMATION':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#151e33] border border-[#151e33]/20">
          Formação
        </span>
      );
    case 'AWARD':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-[#ff63f6] text-[#151e33] shadow-stitch-subtle">
          Distinção
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33]/5 text-[#151e33]">
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#151e33] border border-[#151e33]/20">
          Formação
        </span>
      );
    case 'TEAMBUILDING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#ff63f6]/15 text-[#151e33] border border-[#ff63f6]/40">
          Team Building
        </span>
      );
    case 'DEADLINE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33] text-[#ff63f6] border border-[#ff63f6]/30">
          Prazo Limite
        </span>
      );
    case 'HR_ACTIVITY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#ff63f6]/20 text-[#151e33] border border-[#ff63f6]/40">
          Recursos Humanos
        </span>
      );
    case 'CSR_ACTIVITY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33]/5 text-[#151e33] border border-[#151e33]/20">
          Iniciativa RSC
        </span>
      );
    case 'OPEN_DAY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#ff63f6] text-[#151e33]">
          Open Day
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#151e33]/5 text-[#151e33] border border-[#151e33]/10">
          Evento
        </span>
      );
  }
};
