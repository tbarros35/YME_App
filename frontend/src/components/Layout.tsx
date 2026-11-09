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
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupportModal } from './support/SupportModal';
import { FirstLoginModal } from './auth/FirstLoginModal';
import { ProfileModal } from './profile/ProfileModal';

export const Layout: React.FC = () => {
  const { user, isAdmin, logout, canAccessBackoffice, canReviewWalletRequests } = useAuth();
  const navigate = useNavigate();
  const [isSupportOpen, setIsSupportOpen] = React.useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState<boolean>(false);

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
      label: 'Menu Principal',
      icon: Compass,
      exact: true,
    },
    {
      to: '/wallet',
      label: 'Carteira YME',
      icon: Wallet,
    },
    {
      to: '/sad',
      label: 'SAD´s e Avaliações',
      icon: TrendingUp,
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
    <div className="min-h-screen bg-[#fafbfc] text-[#151e33] flex flex-col selection:bg-[#ff63f6] selection:text-[#151e33] pb-20 md:pb-6">
      {/* Top Header matching Figma design */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#151e33]/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo YME */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            onClick={() => navigate('/')}
          >
            <YmeLogo className="h-10 sm:h-12 w-auto transition-transform duration-200 group-hover:scale-105" />
          </div>

          {/* Desktop Navigation Links with Figma Underline Style */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-12">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-1.5 pb-2 pt-2 text-sm font-semibold transition-all duration-200 select-none border-b-2',
                    isActive
                      ? 'text-[#ff63f6] font-bold border-[#ff63f6]'
                      : 'text-[#151e33] border-slate-700/80 hover:border-[#151e33] hover:text-black'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ff63f6] shrink-0" />
                    )}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-[#ff63f6] text-[#151e33] animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </>
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
                  <div className="flex items-center justify-end gap-1.5 text-xs text-[#151e33]/60 font-medium">
                    <Building2 className="h-3 w-3 text-[#151e33]/40" />
                    <span>
                      {user.department?.name ? `${user.department.name} • ${user.position}` : user.position}
                    </span>
                  </div>
                </div>

                {/* Avatar with Stitch Indicator */}
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setIsProfileOpen(true)}
                  title="Ver Perfil"
                >
                  <div className="h-10 w-10 rounded-full bg-[#151e33] p-0.5 shadow-clean-sm transition-all group-hover:ring-2 group-hover:ring-[#ff63f6] overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#151e33] border border-slate-100">
                        {user.fullName
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#ff63f6] border-2 border-white shadow-stitch-subtle" />
                </div>

                {/* Support Center Quick Button */}
                <button
                  onClick={() => setIsSupportOpen(true)}
                  title="Centro de Apoio & Dúvidas"
                  className="p-2 rounded-xl text-[#151e33]/70 hover:text-[#151e33] hover:bg-[#ff63f6]/10 border border-transparent hover:border-[#ff63f6]/30 transition-all group"
                >
                  <HelpCircle className="h-4 w-4 group-hover:text-[#ff63f6] transition-colors" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Terminar Sessão"
                  className="p-2 rounded-xl text-[#151e33]/50 hover:text-[#151e33] hover:bg-[#151e33]/5 border border-transparent hover:border-[#151e33]/15 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Outlet />
      </main>

      {/* First Login Mandatory Password Change Modal */}
      <FirstLoginModal />

      {/* Member Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Global Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#151e33]/10 bg-white/95 backdrop-blur-md px-2 py-2 shadow-lg safe-area-bottom">
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
                    ? 'text-[#151e33] bg-[#ff63f6]/15 font-bold border border-[#ff63f6]/40'
                    : 'text-[#151e33]/60 hover:text-[#151e33]'
                )
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-0.5 text-[#151e33]" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#ff63f6] text-[#151e33] rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
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
