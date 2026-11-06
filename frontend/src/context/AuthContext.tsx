import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { User, Role, CalendarCategory } from '@/types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, passwordPlain: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isDirector: boolean;
  canManageSAD: boolean;
  canManageWallet: boolean;
  canReviewWalletRequests: boolean;
  canManageUsers: boolean;
  canManageTimeline: boolean;
  canCreateEvents: boolean;
  allowedEventCategories: CalendarCategory[];
  canAccessSupport: boolean;
  canAccessBackoffice: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('yme_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('yme_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('yme_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user session:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('yme_access_token');
      if (token) {
        try {
          await refreshUserData();
        } catch (error) {
          // Silent refresh will attempt if token is expired
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    const response = await api.post('/auth/login', {
      email,
      password: passwordPlain,
    });

    const { user: loggedUser, accessToken: token } = response.data;
    setUser(loggedUser);
    setAccessToken(token);
    localStorage.setItem('yme_access_token', token);
    localStorage.setItem('yme_user', JSON.stringify(loggedUser));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed or network offline:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('yme_access_token');
      localStorage.removeItem('yme_user');
      window.location.href = '/login';
    }
  };

  // Fine-grained RBAC and functional authorization
  const isAdmin = user?.role === 'ADMIN';
  const isDirector = user?.role === 'DIRECTOR';

  // Requirement 1: Admins (Executive Board) manage users (create, edit, password reset, delete)
  const canManageUsers = isAdmin;

  // Requirement: Only Admins (Executive Board) can add milestones to a member's timeline
  const canManageTimeline = isAdmin;

  // Requirement: All members of Human Resources + Admins can submit SAD
  const isHumanResources = user?.department?.name === 'Human Resources';
  const canManageSAD = isAdmin || isHumanResources;

  // Requirement: Head and Manager of Legal & Finance + Admins can manage member Wallets
  const isLegalAndFinance = user?.department?.name === 'Legal & Finance';
  const isLegalHeadOrManager =
    isLegalAndFinance && (user?.position === 'Head' || user?.position === 'Manager');
  const canManageWallet = isAdmin || isLegalHeadOrManager;

  // Requirement: Admins + Any member of Legal & Finance can review wallet withdrawal/usage requests
  const canReviewWalletRequests = isAdmin || isLegalAndFinance;

  // Requirement: Event creation permissions:
  // - Admin: All 7 categories
  // - HR: 'HR_ACTIVITY' only
  // - CSR Taskgroup: 'CSR_ACTIVITY' only
  // - Partnerships Taskgroup: 'OPEN_DAY' only
  // - Legal & Finance / others: None
  const allowedEventCategories = useMemo<CalendarCategory[]>(() => {
    if (!user) return [];
    if (isAdmin) {
      return [
        'GENERAL_ASSEMBLY',
        'GENERAL_MEETING',
        'FORMATION',
        'HR_ACTIVITY',
        'CSR_ACTIVITY',
        'OPEN_DAY',
        'OTHER',
      ];
    }
    const categories: CalendarCategory[] = [];
    if (isHumanResources) {
      categories.push('HR_ACTIVITY');
    }
    if (user.taskgroups?.some((tg) => tg.toUpperCase() === 'CSR')) {
      categories.push('CSR_ACTIVITY');
    }
    if (user.taskgroups?.some((tg) => tg.toUpperCase() === 'PARTNERSHIPS')) {
      categories.push('OPEN_DAY');
    }
    return categories;
  }, [user, isAdmin, isHumanResources]);

  const canCreateEvents = allowedEventCategories.length > 0;

  // Requirement: Support Tickets (Admin, all HR, Head/Manager of Legal & Finance)
  const canAccessSupport =
    isAdmin ||
    isHumanResources ||
    isLegalHeadOrManager;

  // Backoffice Access
  const canAccessBackoffice =
    isAdmin ||
    canManageSAD ||
    canManageWallet ||
    canReviewWalletRequests ||
    canManageTimeline ||
    canCreateEvents ||
    canAccessSupport;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        logout,
        isAdmin,
        isDirector,
        canManageSAD,
        canManageWallet,
        canReviewWalletRequests,
        canManageUsers,
        canManageTimeline,
        canCreateEvents,
        allowedEventCategories,
        canAccessSupport,
        canAccessBackoffice,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
