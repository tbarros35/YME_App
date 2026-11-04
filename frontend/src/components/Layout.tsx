import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from './ui/Badge';
import { YmeLogo } from './ui/YmeLogo';
import {
  Compass,
  TrendingUp,
  Wallet,
  Calendar,
  ShieldCheck,
  LogOut,
  Building2,
  Bell,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupportModal } from './support/SupportModal';

export const Layout: React.FC = () => {
  const { user, isAdmin, logout, canAccessBackoffice, canReviewWalletRequests } = useAuth();
  const navigate = useNavigate();
  const [isSupportOpen, setIsSupportOpen] = React.useState<boolean>(false);

  // Poll for pending wallet requests if user is Admin or Legal & Finance
  const { data: pendingWalletCount = 0 } = useQuery({
    queryKey: ['pending-wallet-requests-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/wallet/requests/pending-count');
        return res.data.count ?? res.data.data?.count ?? 0;
      } catch (err) {
        return 0;
      }
    },
    enabled: !!user && !!canReviewWalletRequests,
    refetchInterval: 15000,
  });

  // Poll for pending reimbursement requests ONLY for Admins
  const { data: pendingReimbursementsCount = 0 } = useQuery({
    queryKey: ['pending-reimbursements-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/wallet/reimbursements/pending-count');
        return res.data.count ?? res.data.data?.count ?? 0;
      } catch (err) {
        return 0;
      }
    },
    enabled: !!user && !!isAdmin,
    refetchInterval: 15000,
  });

  const totalBackofficePending = pendingWalletCount + (isAdmin ? pendingReimbursementsCount : 0);

  const navItems = [
    {
      to: '/',
      label: 'Minha Jornada',
      icon: Compass,
      exact: true,
    },
    {
      to: '/sad',
      label: 'Avaliação SAD',
      icon: TrendingUp,
    },
    {
      to: '/wallet',
      label: 'Carteira YME',
      icon: Wallet,
    },
    {
      to: '/calendar',
      label: 'Calendário',
      icon: Calendar,
    },
    ...(canAccessBackoffice
      ? [
          {
            to: '/backoffice',
            label: 'Backoffice',
            icon: ShieldCheck,
            isBackoffice: true,
            badge: totalBackofficePending > 0 ? totalBackofficePending : undefined,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#151e33] flex flex-col selection:bg-[#ff6ef6] selection:text-[#151e33] pb-20 md:pb-6">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-clean-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => navigate('/')}
          >
            <YmeLogo className="h-10 sm:h-11 w-auto transition-transform duration-200 group-hover:scale-105" />
            <div className="border-l border-slate-200 pl-3">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#151e33]">
                  APP
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#fff0fd] text-[#d81bb0] border border-[#ff6ef6]/40">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-semibold uppercase tracking-wider">
                Gestão de Membros
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 select-none',
                    isActive
                      ? 'bg-[#151e33] text-white shadow-clean-sm font-bold'
                      : 'text-slate-600 hover:text-[#151e33] hover:bg-white/80'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#151e33]">
                      {user.fullName}
                    </span>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 font-medium">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    <span>
                      {user.department?.name ? `${user.department.name} • ${user.position}` : user.position}
                    </span>
                  </div>
                </div>

                {/* Avatar with Online Indicator */}
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-[#151e33] p-0.5 shadow-clean-sm cursor-pointer transition-transform hover:scale-105">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#151e33] border border-slate-100">
                      {user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                {/* Support Center Quick Button */}
                <button
                  onClick={() => setIsSupportOpen(true)}
                  title="Centro de Apoio & Dúvidas"
                  className="p-2 rounded-xl text-slate-500 hover:text-[#151e33] hover:bg-[#fff0fd] border border-transparent hover:border-[#ff6ef6]/30 transition-all group"
                >
                  <HelpCircle className="h-4 w-4 group-hover:text-[#d81bb0] transition-colors" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Terminar Sessão"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Outlet />
      </main>

      {/* Global Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar (Impeccable Touch Targets) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 py-2 shadow-lg safe-area-bottom">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-semibold transition-all min-h-[44px]',
                  isActive
                    ? 'text-[#151e33] bg-[#fff0fd] font-bold border border-[#ff6ef6]/30'
                    : 'text-slate-500 hover:text-slate-800'
                )
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-0.5 text-[#151e33]" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

