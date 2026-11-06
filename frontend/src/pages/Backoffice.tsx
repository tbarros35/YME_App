import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, Textarea } from '@/components/ui/Select';
import { RoleBadge, Badge, TaskgroupBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import {
  User,
  Role,
  Position,
  DepartmentName,
  WalletType,
  WalletRequest,
  ReimbursementRequest,
  TimelineCategory,
  CalendarCategory,
  Taskgroup,
  SupportTicket,
  SupportMessage,
  SupportCategory,
  SupportStatus,
} from '@/types';
import {
  ShieldCheck,
  Award,
  Wallet,
  Calendar,
  Flag,
  Users,
  CheckCircle2,
  XCircle,
  Bell,
  HandCoins,
  Receipt,
  Paperclip,
  ExternalLink,
  AlertCircle,
  PlusCircle,
  UserPlus,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  Lock,
  Upload,
  FileText,
  MessagesSquare,
  MessageSquare,
  Send,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

const DEPARTMENTS: DepartmentName[] = [
  'Executive Board',
  'Brand Strategy',
  'Digital Development',
  'Human Resources',
  'Legal & Finance',
  'Quality Management',
  'Sales & Commercial',
];

const EXBO_POSITIONS: Position[] = ['CEO', 'COO', 'CMO'];

const DEPT_POSITIONS: Position[] = [
  'Head',
  'Manager',
  'Senior Consultant',
  'Junior Consultant',
  'Trainee',
];

const POSITIONS: Position[] = [
  'CEO',
  'COO',
  'CMO',
  'Head',
  'Manager',
  'Senior Consultant',
  'Junior Consultant',
  'Trainee',
];

const getCategoryLabel = (category: CalendarCategory): string => {
  switch (category) {
    case 'GENERAL_ASSEMBLY':
      return 'Assembleia Geral';
    case 'GENERAL_MEETING':
      return 'Reunião Geral';
    case 'FORMATION':
      return 'Formação & Workshops';
    case 'HR_ACTIVITY':
      return '👥 Atividade de RH';
    case 'CSR_ACTIVITY':
      return '🌱 Atividade de RSC (CSR)';
    case 'OPEN_DAY':
      return '🤝 Open Day';
    case 'OTHER':
      return 'Outros';
    default:
      return category;
  }
};

const computeCareerStepsForUser = (u?: User | null): string[] => {
  if (!u) return [];
  if (u.careerHistory && u.careerHistory.length > 0) {
    return u.careerHistory;
  }
  const dept = u.department?.name || 'Geral';
  const pos = (u.position || '').trim();
  const lowerPos = pos.toLowerCase();

  if (lowerPos === 'trainee') {
    return [`Trainee of ${dept}`];
  }
  if (lowerPos === 'junior consultant') {
    return [`Trainee of ${dept}`, `Junior Consultant of ${dept}`];
  }
  if (lowerPos === 'senior consultant') {
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
    ];
  }
  if (lowerPos === 'manager') {
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
      `Manager of ${dept}`,
    ];
  }
  if (
    u.role === 'DIRECTOR' ||
    lowerPos === 'head' ||
    lowerPos.includes('diretor')
  ) {
    const headTitle = lowerPos.includes('head') ? `Head of ${dept}` : `${pos} of ${dept}`;
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
      `Manager of ${dept}`,
      headTitle,
    ];
  }
  if (
    u.role === 'ADMIN' ||
    ['ceo', 'coo', 'cmo'].some((r) => lowerPos.includes(r))
  ) {
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
      `Head of ${dept}`,
      pos.toUpperCase() || 'Executive Board',
    ];
  }
  return [`${pos || 'Membro'} of ${dept}`];
};

export const Backoffice: React.FC = () => {
  const {
    user,
    isAdmin,
    canManageSAD,
    canManageWallet,
    canReviewWalletRequests,
    canManageUsers,
    canManageTimeline,
    canCreateEvents,
    allowedEventCategories,
  } = useAuth();
  const queryClient = useQueryClient();

  const isLegalHeadOrManager =
    user?.department?.name === 'Legal & Finance' &&
    (user?.position === 'Head' || user?.position === 'Manager');

  const canAccessSupport =
    isAdmin ||
    user?.department?.name === 'Human Resources' ||
    isLegalHeadOrManager;

  const [activeTab, setActiveTab] = useState<
    'MEMBERS' | 'SAD' | 'WALLET' | 'TIMELINE' | 'CALENDAR' | 'SUPPORT'
  >(() => {
    if (isAdmin) return 'MEMBERS';
    if (canManageSAD) return 'SAD';
    if (canManageWallet || canReviewWalletRequests) return 'WALLET';
    if (canCreateEvents) return 'CALENDAR';
    if (canAccessSupport) return 'SUPPORT';
    return 'MEMBERS';
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Fetch Users & Departments
  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ['backoffice-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const { data: deptsData } = useQuery<{ departments: Array<{ id: string; name: string }> }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/users/departments');
      return res.data;
    },
  });

  const users = usersData?.users || [];
  const departments = deptsData?.departments || [];

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4000);
  };

  // ================= Form 1: Create New Member (Admin only) =================
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newAssignedDepartmentId, setNewAssignedDepartmentId] = useState('');
  const [newPosition, setNewPosition] = useState<Position>('Junior Consultant');
  const [newRole, setNewRole] = useState<Role>('MEMBER');
  const [newTaskgroups, setNewTaskgroups] = useState<Taskgroup[]>([]);
  const [newHighestPreviousPos, setNewHighestPreviousPos] = useState<'NONE' | 'TRAINEE' | 'JUNIOR_CONSULTANT'>('JUNIOR_CONSULTANT');
  const [newAdminPreviousRoles, setNewAdminPreviousRoles] = useState<string[]>(['Trainee', 'Junior Consultant', 'Head']);

  const handleNewDepartmentChange = (deptId: string) => {
    setNewDepartmentId(deptId);
    const selectedDept = departments.find((d) => d.id === deptId);
    const isExBo = selectedDept?.name === 'Executive Board';
    if (isExBo) {
      setNewPosition('COO');
      setNewRole('ADMIN');
      setNewAssignedDepartmentId('');
    } else {
      setNewPosition('Junior Consultant');
      setNewRole('MEMBER');
      setNewAssignedDepartmentId('');
    }
  };

  const handleNewPositionChange = (pos: Position) => {
    setNewPosition(pos);
    const selectedDept = departments.find((d) => d.id === newDepartmentId);
    const isExBo = selectedDept?.name === 'Executive Board';
    if (isExBo) {
      setNewRole('ADMIN');
    } else if (pos === 'Head') {
      setNewRole('DIRECTOR');
    } else {
      setNewRole('MEMBER');
    }
  };

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const selectedDeptObj = departments.find((d) => d.id === newDepartmentId);
      const deptName = selectedDeptObj?.name || 'YME';
      const isHR = selectedDeptObj?.name === 'Human Resources';
      const isNonLeaderHR = isHR && ['Trainee', 'Junior Consultant', 'Senior Consultant'].includes(newPosition);

      const res = await api.post('/users', {
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        departmentId: newDepartmentId,
        assignedDepartmentId: isNonLeaderHR ? newAssignedDepartmentId || null : null,
        position: newPosition,
        role: newRole,
        taskgroups: newTaskgroups,
        highestPreviousPosition: newRole === 'DIRECTOR' ? newHighestPreviousPos : undefined,
        previousPositions:
          newRole === 'ADMIN'
            ? newAdminPreviousRoles.map((r) =>
                r.includes('of') ? r : `${r} of ${deptName}`
              )
            : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Novo membro criado com sucesso na organização!');
      queryClient.invalidateQueries({ queryKey: ['backoffice-users'] });
      setIsCreateUserOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('password123');
      setNewDepartmentId('');
      setNewAssignedDepartmentId('');
      setNewTaskgroups([]);
      setNewHighestPreviousPos('JUNIOR_CONSULTANT');
      setNewAdminPreviousRoles(['Trainee', 'Junior Consultant', 'Head']);
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao criar membro.', true);
    },
  });

  // ================= Form 2: Edit Member (Admin only) =================
  const [editFullName, setEditFullName] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editAssignedDepartmentId, setEditAssignedDepartmentId] = useState('');
  const [editPosition, setEditPosition] = useState<Position>('Junior Consultant');
  const [editRole, setEditRole] = useState<Role>('MEMBER');
  const [editTaskgroups, setEditTaskgroups] = useState<Taskgroup[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editCareerHistoryText, setEditCareerHistoryText] = useState('');

  const startEditUser = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditDepartmentId(u.departmentId || u.department?.id || '');
    setEditAssignedDepartmentId(u.assignedDepartmentId || u.assignedDepartment?.id || '');
    setEditPosition(u.position as Position);
    setEditRole(u.role);
    setEditTaskgroups(u.taskgroups || []);
    setEditIsActive(u.isActive !== false);
    const steps = u.careerHistory && u.careerHistory.length > 0 ? u.careerHistory : computeCareerStepsForUser(u);
    setEditCareerHistoryText(steps.join('\n'));
  };

  const handleEditDepartmentChange = (deptId: string) => {
    setEditDepartmentId(deptId);
    const selectedDept = departments.find((d) => d.id === deptId);
    const isExBo = selectedDept?.name === 'Executive Board';
    if (isExBo) {
      if (!EXBO_POSITIONS.includes(editPosition)) {
        setEditPosition('COO');
      }
      setEditRole('ADMIN');
      setEditAssignedDepartmentId('');
    } else {
      if (EXBO_POSITIONS.includes(editPosition)) {
        setEditPosition('Junior Consultant');
      }
      if (editPosition === 'Head') {
        setEditRole('DIRECTOR');
      } else {
        setEditRole('MEMBER');
      }
      if (selectedDept?.name !== 'Human Resources') {
        setEditAssignedDepartmentId('');
      }
    }
  };

  const handleEditPositionChange = (pos: Position) => {
    setEditPosition(pos);
    const selectedDept = departments.find((d) => d.id === editDepartmentId);
    const isExBo = selectedDept?.name === 'Executive Board';
    if (isExBo) {
      setEditRole('ADMIN');
    } else if (pos === 'Head') {
      setEditRole('DIRECTOR');
    } else {
      setEditRole('MEMBER');
    }
  };

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const selectedDeptObj = departments.find((d) => d.id === editDepartmentId);
      const isHR = selectedDeptObj?.name === 'Human Resources';
      const isNonLeaderHR = isHR && ['Trainee', 'Junior Consultant', 'Senior Consultant'].includes(editPosition);

      const res = await api.put(`/users/${editingUser.id}`, {
        fullName: editFullName,
        departmentId: editDepartmentId,
        assignedDepartmentId: isNonLeaderHR ? editAssignedDepartmentId || null : null,
        position: editPosition,
        role: editRole,
        taskgroups: editTaskgroups,
        careerHistory: editCareerHistoryText.split('\n').map((s) => s.trim()).filter(Boolean),
        isActive: editIsActive,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Dados do membro atualizados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['backoffice-users'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao atualizar membro.', true);
    },
  });

  // ================= Form 3: Reset Password (Admin only) =================
  const [newResetPassword, setNewResetPassword] = useState('');

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!passwordResetUser) return;
      const res = await api.put(`/users/${passwordResetUser.id}/password`, {
        password: newResetPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification(`Palavra-passe de ${passwordResetUser?.fullName} redefinida com sucesso!`);
      setPasswordResetUser(null);
      setNewResetPassword('');
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao redefinir password.', true);
    },
  });

  // ================= Form 4: Delete Member (Admin only) =================
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!deleteConfirmUser) return;
      const res = await api.delete(`/users/${deleteConfirmUser.id}`);
      return res.data;
    },
    onSuccess: () => {
      showNotification(`Membro ${deleteConfirmUser?.fullName} excluído com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['backoffice-users'] });
      setDeleteConfirmUser(null);
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao excluir membro.', true);
    },
  });

  // ================= Form 5: SAD Evaluation (Admin + HR) =================
  const isHRLeadership =
    user?.department?.name === 'Human Resources' &&
    (user?.position === 'Head' || user?.position === 'Manager');

  const isHRConsultant =
    user?.department?.name === 'Human Resources' && !isHRLeadership && !isAdmin;

  const availableSadUsers = useMemo<User[]>(() => {
    const active = users.filter((u) => u.isActive !== false);
    if (isAdmin || isHRLeadership) {
      return active;
    }
    if (isHRConsultant) {
      const assignedId = user?.assignedDepartmentId || user?.assignedDepartment?.id;
      if (!assignedId) return [];
      return active.filter((u) => (u.departmentId || u.department?.id) === assignedId);
    }
    return active;
  }, [users, isAdmin, isHRLeadership, isHRConsultant, user]);

  const [sadUserId, setSadUserId] = useState('');
  const [sadTerm, setSadTerm] = useState('2025/2026 - Q2');
  const [sadScore, setSadScore] = useState('5.20');
  const [sadPdfFile, setSadPdfFile] = useState<File | null>(null);
  const [sadNotes, setSadNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createSadMutation = useMutation({
    mutationFn: async () => {
      if (!sadPdfFile) {
        throw new Error('O carregamento do relatório PDF é obrigatório.');
      }
      const formData = new FormData();
      formData.append('userId', sadUserId);
      formData.append('term', sadTerm);
      formData.append('score', sadScore);
      formData.append('reportPdf', sadPdfFile);
      if (sadNotes) {
        formData.append('feedbackNotes', sadNotes);
      }

      const res = await api.post('/sad', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Avaliação SAD e relatório PDF registados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['sad-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSadNotes('');
      setSadPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (err: any) => {
      showNotification(
        err.response?.data?.error?.message || err.message || 'Erro ao submeter SAD',
        true
      );
    },
  });

  // ================= Form 6: Wallet Transaction (Admin + Legal & Finance) =================
  const [walletUserId, setWalletUserId] = useState('');
  const [walletAmount, setWalletAmount] = useState('25.00');
  const [walletType, setWalletType] = useState<WalletType>('SAD_REWARD');
  const [walletDesc, setWalletDesc] = useState('');

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/wallet/transaction', {
        userId: walletUserId,
        amount: parseFloat(walletAmount),
        type: walletType,
        description: walletDesc,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Operação de carteira registada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setWalletDesc('');
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao criar transação', true);
    },
  });

  // ================= Wallet Requests (Review, Approve & Reject) =================
  const [walletRequestsFilter, setWalletRequestsFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [approvingRequest, setApprovingRequest] = useState<WalletRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<WalletRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const { data: walletRequestsData, isLoading: isLoadingWalletRequests } = useQuery({
    queryKey: ['backoffice-wallet-requests'],
    queryFn: async () => {
      const res = await api.get('/wallet/requests');
      return (res.data.requests || res.data.data || []) as WalletRequest[];
    },
    enabled: !!(canManageWallet || canReviewWalletRequests),
    refetchInterval: 10000,
  });

  const walletRequests: WalletRequest[] = walletRequestsData || [];
  const pendingWalletCount = walletRequests.filter((r) => r.status === 'PENDING').length;

  const approveWalletRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.post(`/wallet/requests/${requestId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      showNotification('Pedido aprovado com sucesso! O montante foi debitado da carteira do membro.');
      queryClient.invalidateQueries({ queryKey: ['backoffice-wallet-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-wallet-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setApprovingRequest(null);
    },
    onError: (err: any) => {
      showNotification(
        err.response?.data?.error?.message || err.message || 'Erro ao aprovar pedido',
        true
      );
    },
  });

  const rejectWalletRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const res = await api.post(`/wallet/requests/${requestId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Pedido recusado. O saldo do membro permaneceu intacto na sua conta.');
      queryClient.invalidateQueries({ queryKey: ['backoffice-wallet-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-wallet-requests-count'] });
      setRejectingRequest(null);
      setRejectionReasonInput('');
    },
    onError: (err: any) => {
      showNotification(
        err.response?.data?.error?.message || err.message || 'Erro ao recusar pedido',
        true
      );
    },
  });

  // ================= Reimbursement Requests (Compras para a YME - Exclusivo Admin) =================
  const [walletSubView, setWalletSubView] = useState<'BALANCE_REQUESTS' | 'REIMBURSEMENTS' | 'MANUAL'>('BALANCE_REQUESTS');
  const [reimbursementsFilter, setReimbursementsFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [approvingReimbursement, setApprovingReimbursement] = useState<ReimbursementRequest | null>(null);
  const [rejectingReimbursement, setRejectingReimbursement] = useState<ReimbursementRequest | null>(null);
  const [reimbursementRejectReason, setReimbursementRejectReason] = useState('');
  const [refundProofFile, setRefundProofFile] = useState<File | null>(null);
  const refundProofInputRef = useRef<HTMLInputElement>(null);

  const { data: reimbursementsData, isLoading: isLoadingReimbursements } = useQuery({
    queryKey: ['backoffice-reimbursements'],
    queryFn: async () => {
      const res = await api.get('/wallet/reimbursements');
      return (res.data.reimbursements || res.data.data || []) as ReimbursementRequest[];
    },
    enabled: !!isAdmin,
    refetchInterval: 10000,
  });

  const reimbursements: ReimbursementRequest[] = reimbursementsData || [];
  const pendingReimbursements = reimbursements.filter((r) => r.status === 'PENDING');
  const pendingReimbursementsCount = pendingReimbursements.length;

  const approveReimbursementMutation = useMutation({
    mutationFn: async ({ requestId, file }: { requestId: string; file: File }) => {
      const formData = new FormData();
      formData.append('proof', file);
      const res = await api.post(`/wallet/reimbursements/${requestId}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Pedido de reembolso aprovado e comprovativo de devolução registado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['backoffice-reimbursements'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reimbursements-count'] });
      setApprovingReimbursement(null);
      setRefundProofFile(null);
    },
    onError: (err: any) => {
      showNotification(
        err.response?.data?.error?.message || err.message || 'Erro ao aprovar reembolso',
        true
      );
    },
  });

  const rejectReimbursementMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const res = await api.post(`/wallet/reimbursements/${requestId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Pedido de reembolso recusado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['backoffice-reimbursements'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reimbursements-count'] });
      setRejectingReimbursement(null);
      setReimbursementRejectReason('');
    },
    onError: (err: any) => {
      showNotification(
        err.response?.data?.error?.message || err.message || 'Erro ao recusar reembolso',
        true
      );
    },
  });

  // ================= Form 7: Timeline Milestone (Executive Board / Admin only) =================
  const [timelineUserId, setTimelineUserId] = useState('');
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineCategory, setTimelineCategory] = useState<TimelineCategory>('PROJECT');
  const [timelineDate, setTimelineDate] = useState(new Date().toISOString().split('T')[0]);
  const [timelineDesc, setTimelineDesc] = useState('');
  const [timelineRoleStep, setTimelineRoleStep] = useState('');

  const createTimelineMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/timeline', {
        userId: timelineUserId,
        title: timelineTitle,
        category: timelineCategory,
        roleStep: timelineRoleStep || undefined,
        eventDate: timelineDate,
        description: timelineDesc || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Marco cronológico adicionado à jornada do membro!');
      queryClient.invalidateQueries({ queryKey: ['my-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setTimelineTitle('');
      setTimelineDesc('');
      setTimelineRoleStep('');
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao criar marco', true);
    },
  });

  // ================= Form 8: Calendar Event (Admin, HR, CSR, Partnerships) =================
  const [calTitle, setCalTitle] = useState('');
  const [calCategory, setCalCategory] = useState<CalendarCategory>(
    allowedEventCategories[0] || 'GENERAL_ASSEMBLY'
  );
  const [calStart, setCalStart] = useState('2026-09-10T18:30');
  const [calEnd, setCalEnd] = useState('2026-09-10T20:30');
  const [calLoc, setCalLoc] = useState('');
  const [calDesc, setCalDesc] = useState('');

  // Keep calCategory in sync if allowed categories change
  useEffect(() => {
    if (allowedEventCategories.length > 0 && !allowedEventCategories.includes(calCategory)) {
      setCalCategory(allowedEventCategories[0]);
    }
  }, [allowedEventCategories, calCategory]);

  const createCalendarMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/calendar', {
        title: calTitle,
        category: calCategory,
        startTime: new Date(calStart).toISOString(),
        endTime: new Date(calEnd).toISOString(),
        location: calLoc || undefined,
        description: calDesc || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification('Evento adicionado ao calendário da associação!');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setCalTitle('');
      setCalLoc('');
      setCalDesc('');
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.error?.message || 'Erro ao criar evento', true);
    },
  });

  // ================= SUPPORT TICKETS QUEUE (ADMIN, HR, LEGAL) =================
  const { data: supportData, refetch: refetchSupport } = useQuery<{ tickets: SupportTicket[] }>({
    queryKey: ['backoffice-support-tickets'],
    queryFn: async () => {
      const res = await api.get('/support/tickets/assigned');
      return res.data;
    },
    enabled: canAccessSupport,
    refetchInterval: 5000,
  });

  const supportTickets = supportData?.tickets || [];
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<SupportTicket | null>(null);
  const [supportCategoryFilter, setSupportCategoryFilter] = useState<'ALL' | SupportCategory>('ALL');
  const [supportStatusFilter, setSupportStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [supportSearch, setSupportSearch] = useState('');
  const [supportReplyMessage, setSupportReplyMessage] = useState('');
  const supportChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedSupportTicket) {
      supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSupportTicket?.messages]);

  // Sync selectedSupportTicket when list updates
  useEffect(() => {
    if (selectedSupportTicket && supportTickets.length > 0) {
      const updated = supportTickets.find((t) => t.id === selectedSupportTicket.id);
      if (updated) setSelectedSupportTicket(updated);
    }
  }, [supportTickets]);

  const sendSupportReplyMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const res = await api.post(`/support/tickets/${ticketId}/messages`, { content });
      return res.data;
    },
    onSuccess: (data) => {
      setSupportReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['backoffice-support-tickets'] });
      if (selectedSupportTicket) {
        setSelectedSupportTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, data.data],
                status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status,
              }
            : null
        );
      }
    },
    onError: () => {
      showNotification('Erro ao enviar mensagem no chat.', true);
    },
  });

  const updateSupportStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: SupportStatus }) => {
      const res = await api.patch(`/support/tickets/${ticketId}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backoffice-support-tickets'] });
      setSelectedSupportTicket(data.ticket);
      showNotification(`Estado do ticket atualizado para ${data.ticket.status}`);
    },
    onError: () => {
      showNotification('Erro ao atualizar estado do ticket.', true);
    },
  });

  const filteredSupportTickets = supportTickets.filter((tk) => {
    if (supportCategoryFilter !== 'ALL' && tk.category !== supportCategoryFilter) return false;
    if (supportStatusFilter === 'OPEN' && (tk.status === 'RESOLVED' || tk.status === 'CLOSED')) return false;
    if (supportStatusFilter === 'RESOLVED' && tk.status !== 'RESOLVED' && tk.status !== 'CLOSED') return false;
    if (supportSearch.trim()) {
      const q = supportSearch.toLowerCase();
      const matchName = tk.user.fullName.toLowerCase().includes(q);
      const matchSubject = tk.subject.toLowerCase().includes(q);
      const matchDept = (tk.user.department?.name || '').toLowerCase().includes(q);
      const matchMsg = tk.messages.some((m) => m.content.toLowerCase().includes(q));
      if (!matchName && !matchSubject && !matchDept && !matchMsg) return false;
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const taskgroupsMatch = (u.taskgroups || []).some((tg) => tg.toLowerCase().includes(q));
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department?.name || '').toLowerCase().includes(q) ||
      u.position.toLowerCase().includes(q) ||
      taskgroupsMatch
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-[3px] h-[22px] bg-[#ff63f6] rounded-full inline-block" />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#151e33] tracking-tight">
              Backoffice
            </h1>
            {isAdmin && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#151e33] text-white">
                Executive Board
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#151e33]/60 mt-1.5 ml-4">
            Gestão de membros, taskgroups, SAD, operações de carteira, marcos na jornada e agenda associativa
          </p>
        </div>

        {/* Action Button for Admins: Create Member */}
        {canManageUsers && (
          <button
            onClick={() => setIsCreateUserOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start md:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Criar Novo Membro</span>
          </button>
        )}
      </div>

      {/* Wallet Requests High-Priority Alert Banner for Admin & Legal */}
      {(canManageWallet || canReviewWalletRequests) && pendingWalletCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[32px] sm:rounded-[40px] bg-white border border-[#ff63f6]/40 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#ff63f6]/10 text-[#ff63f6] flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-[#151e33]">
                  {pendingWalletCount} {pendingWalletCount === 1 ? 'Pedido Pendente' : 'Pedidos Pendentes'} de Utilização de Saldo!
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff63f6] text-white text-[10px] font-black uppercase">
                  Ação Necessária
                </span>
              </div>
              <p className="text-xs text-[#151e33]/60 mt-1">
                Membros da associação solicitaram a utilização do respetivo saldo e aguardam aprovação ou recusa pelo Departamento Legal & Finance ou Direção.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('WALLET')}
            className="px-5 py-2.5 rounded-full bg-[#151e33] hover:bg-[#1e2a47] text-white text-xs font-bold shrink-0 transition-all shadow-sm self-start sm:self-auto cursor-pointer"
          >
            Rever Pedidos Agora
          </button>
        </div>
      )}

      {/* Reimbursement Requests High-Priority Alert Banner (ADMIN ONLY) */}
      {isAdmin && pendingReimbursementsCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[32px] sm:rounded-[40px] bg-white border border-[#ff63f6]/40 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#ff63f6]/10 text-[#ff63f6] flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-[#151e33]">
                  {pendingReimbursementsCount} {pendingReimbursementsCount === 1 ? 'Pedido Pendente' : 'Pedidos Pendentes'} de Reembolso de Despesas YME!
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff63f6] text-white text-[10px] font-black uppercase">
                  Exclusivo Admin
                </span>
              </div>
              <p className="text-xs text-[#151e33]/60 mt-1">
                Membros submeteram faturas de despesas feitas para a YME e aguardam validação e devolução do dinheiro com anexo obrigatório do comprovativo.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('WALLET');
              setWalletSubView('REIMBURSEMENTS');
            }}
            className="px-5 py-2.5 rounded-full bg-[#151e33] hover:bg-[#1e2a47] text-white text-xs font-bold shrink-0 transition-all shadow-sm self-start sm:self-auto cursor-pointer"
          >
            Rever Reembolsos
          </button>
        </div>
      )}

      {/* Notifications Banner */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in shadow-sm px-6">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-fade-in shadow-sm px-6">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {canManageUsers && (
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'MEMBERS'
                ? 'bg-[#151e33] text-white shadow-sm'
                : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Gestão de Membros</span>
          </button>
        )}

        {canManageSAD && (
          <button
            onClick={() => setActiveTab('SAD')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'SAD'
                ? 'bg-[#151e33] text-white shadow-sm'
                : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Avaliação SAD</span>
          </button>
        )}

        {(canManageWallet || canReviewWalletRequests) && (
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'WALLET'
                ? 'bg-[#151e33] text-white shadow-sm'
                : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Operações & Pedidos Carteira</span>
            {pendingWalletCount + (isAdmin ? pendingReimbursementsCount : 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff63f6] text-white text-[10px] font-black">
                {pendingWalletCount + (isAdmin ? pendingReimbursementsCount : 0)}
              </span>
            )}
          </button>
        )}

        {canManageTimeline && (
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-[#151e33] text-white shadow-sm'
                : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>Novo Marco Jornada</span>
          </button>
        )}

        {canCreateEvents && (
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'CALENDAR'
                ? 'bg-[#151e33] text-white shadow-sm'
                : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Agendar Evento</span>
          </button>
        )}

        {canAccessSupport && (
          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'SUPPORT'
                ? 'bg-[#151e33] text-white shadow-sm'
                : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
            }`}
          >
            <MessagesSquare className="h-4 w-4" />
            <span>Suporte & Dúvidas</span>
            {supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff63f6] text-white text-[10px] font-black">
                {supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: GESTÃO DE MEMBROS (EXECUTIVE BOARD ONLY) */}
      {activeTab === 'MEMBERS' && canManageUsers && (
        <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#151e33]/5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
                <h2 className="text-xl font-bold text-[#151e33]">
                  Diretório & Gestão de Membros
                </h2>
              </div>
              <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
                Permite à Executive Board alterar cargos, gerir taskgroups, palavras-passe, criar e excluir membros.
              </p>
            </div>

            <div className="w-full sm:w-80">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#151e33]/40" />
                <input
                  type="text"
                  placeholder="Pesquisar membro, taskgroup, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#151e33]/15 rounded-full text-xs text-[#151e33] placeholder:text-[#151e33]/40 focus:outline-none focus:border-[#ff63f6] focus:ring-1 focus:ring-[#ff63f6] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#151e33]/10 text-[#ff63f6] text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Taskgroups</th>
                  <th className="px-4 py-3">Permissão</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Ações (Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151e33]/5 text-[#151e33]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#151e33]/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-bold whitespace-nowrap">
                      {u.fullName}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#151e33]/60 text-[11px]">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2.5 py-1 rounded-full bg-[#151e33]/5 text-[#151e33] font-medium text-[11px]">
                          {u.department?.name || 'N/A'}
                        </span>
                        {u.department?.name === 'Human Resources' && u.assignedDepartment && (
                          <span className="px-2 py-0.5 rounded-full bg-[#ff63f6]/10 text-[#ff63f6] font-semibold text-[10px]">
                            Alocado a: {u.assignedDepartment.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold">
                      <Badge variant="outline">{u.position}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.taskgroups && u.taskgroups.length > 0 ? (
                          u.taskgroups.map((tg) => (
                            <TaskgroupBadge key={tg} taskgroup={tg} />
                          ))
                        ) : (
                          <span className="text-[#151e33]/30 italic text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => startEditUser(u)}
                        title="Alterar Cargo / Departamento / Taskgroups"
                        className="p-2 rounded-full bg-[#151e33]/5 hover:bg-[#ff63f6]/10 text-[#151e33] hover:text-[#ff63f6] transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setPasswordResetUser(u);
                          setNewResetPassword('');
                        }}
                        title="Redefinir Palavra-passe"
                        className="p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 transition-all cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmUser(u)}
                        title="Excluir Membro"
                        className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AVALIAÇÃO SAD (ADMIN + HUMAN RESOURCES) */}
      {activeTab === 'SAD' && canManageSAD && (
        <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
              <h2 className="text-xl font-bold text-[#151e33]">
                Lançamento de Avaliação SAD
              </h2>
            </div>
            <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
              {isAdmin ? (
                <span>
                  Como membro da <strong>Executive Board</strong>, tens permissão total para lançar relatórios SAD para membros de qualquer departamento.
                </span>
              ) : isHRLeadership ? (
                <span>
                  Como <strong>{user?.position} de Recursos Humanos</strong>, tens permissão para lançar relatórios SAD para membros de qualquer departamento.
                </span>
              ) : isHRConsultant && user?.assignedDepartment ? (
                <span>
                  Como consultor de Recursos Humanos alocado ao departamento <strong>{user.assignedDepartment.name}</strong>, podes lançar relatórios SAD exclusivamente para membros desse departamento.
                </span>
              ) : (
                <span>
                  Atribuído aos membros de Recursos Humanos e Executive Board. Escala oficial de 0 a 6 valores com carregamento obrigatório do relatório PDF.
                </span>
              )}
            </p>
          </div>

          {isHRConsultant && !user?.assignedDepartment && (
            <div className="p-4 rounded-[20px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>
                Ainda não tens nenhum departamento alocado à tua conta de Recursos Humanos. Solicita a um membro da Executive Board a alocação de um departamento para poderes lançar avaliações SAD.
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!sadUserId) {
                showNotification('Por favor, seleciona um membro.', true);
                return;
              }
              if (!sadPdfFile) {
                showNotification('Por favor, carrega o ficheiro PDF do relatório.', true);
                return;
              }
              createSadMutation.mutate();
            }}
            className="space-y-5"
          >
            <Select
              label="Membro a Avaliar *"
              value={sadUserId}
              onChange={(e) => setSadUserId(e.target.value)}
              disabled={isHRConsultant && !user?.assignedDepartment}
              required
            >
              <option value="">
                {isHRConsultant && !user?.assignedDepartment
                  ? '-- Sem departamento alocado --'
                  : availableSadUsers.length === 0
                  ? '-- Nenhum membro ativo disponível no teu departamento alocado --'
                  : '-- Selecionar Membro Ativo --'}
              </option>
              {availableSadUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.department?.name || 'Sem Dept'} • {u.position})
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quadrimestre *"
                placeholder="ex: 2025/2026 - Q2"
                value={sadTerm}
                onChange={(e) => setSadTerm(e.target.value)}
                required
              />

              <Input
                label="Média do SAD (0.00 - 6.00) *"
                type="number"
                step="0.01"
                min="0"
                max="6"
                placeholder="ex: 5.20"
                value={sadScore}
                onChange={(e) => setSadScore(e.target.value)}
                required
              />
            </div>

            {/* Upload do Relatório PDF Obrigatório */}
            <div>
              <label className="text-xs font-semibold text-[#151e33] block mb-1.5 uppercase tracking-wider">
                Relatório PDF Oficial da Avaliação SAD *
              </label>
              <div className="p-6 rounded-[24px] border-2 border-dashed border-[#151e33]/15 hover:border-[#ff63f6] bg-[#151e33]/[0.02] transition-colors text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="sadPdfUpload"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSadPdfFile(file);
                  }}
                  required
                />
                <label
                  htmlFor="sadPdfUpload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-12 w-12 rounded-full bg-white shadow-sm border border-[#151e33]/10 flex items-center justify-center text-[#ff63f6]">
                    <Upload className="h-5 w-5" />
                  </div>
                  {sadPdfFile ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FileText className="h-3.5 w-3.5" />
                        {sadPdfFile.name} ({(sadPdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <p className="text-[11px] text-[#151e33]/60 font-medium">
                        Clica para substituir o ficheiro PDF
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-[#151e33] hover:text-[#ff63f6] transition-colors">
                        Clica para carregar o ficheiro PDF
                      </span>
                      <p className="text-[11px] text-[#151e33]/50 font-medium mt-0.5">
                        Documentos em formato PDF (máx. 25 MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Textarea
              label="Notas e Feedback de Desempenho"
              placeholder="Pontos fortes observados, metas atingidas e recomendações dos Recursos Humanos..."
              value={sadNotes}
              onChange={(e) => setSadNotes(e.target.value)}
              rows={4}
            />

            <button
              type="submit"
              disabled={createSadMutation.isPending}
              className="w-full h-12 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Award className="h-4 w-4" />
              <span>{createSadMutation.isPending ? 'A registar...' : 'Registar Avaliação & Publicar Relatório'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: OPERAÇÕES & PEDIDOS DE CARTEIRA (ADMIN + LEGAL & FINANCE) */}
      {activeTab === 'WALLET' && (canManageWallet || canReviewWalletRequests) && (
        <div className="space-y-6 max-w-5xl">
          {/* Sub-view Navigation */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setWalletSubView('BALANCE_REQUESTS')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                walletSubView === 'BALANCE_REQUESTS'
                  ? 'bg-[#151e33] text-white shadow-sm'
                  : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
              }`}
            >
              <HandCoins className="h-4 w-4" />
              <span>Pedidos de Saldo</span>
              {pendingWalletCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#ff63f6] text-white text-[10px] font-black">
                  {pendingWalletCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setWalletSubView('REIMBURSEMENTS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  walletSubView === 'REIMBURSEMENTS'
                    ? 'bg-[#151e33] text-white shadow-sm'
                    : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
                }`}
              >
                <Receipt className="h-4 w-4" />
                <span>Reembolsos YME (Faturas)</span>
                {pendingReimbursementsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#ff63f6] text-white text-[10px] font-black animate-pulse">
                    {pendingReimbursementsCount}
                  </span>
                )}
              </button>
            )}

            {canManageWallet && (
              <button
                type="button"
                onClick={() => setWalletSubView('MANUAL')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  walletSubView === 'MANUAL'
                    ? 'bg-[#151e33] text-white shadow-sm'
                    : 'bg-white border border-[#151e33]/15 text-[#151e33]/70 hover:border-[#ff63f6] hover:text-[#151e33]'
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span>Atribuição & Movimentos Manuais</span>
              </button>
            )}
          </div>

          {/* Sub-Section 1: Pedidos de Utilização de Saldo Submetidos por Membros */}
          {walletSubView === 'BALANCE_REQUESTS' && (
            <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#151e33]/5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
                    <h2 className="text-xl font-bold text-[#151e33] flex items-center gap-2">
                      <span>Pedidos de Utilização de Saldo</span>
                      {pendingWalletCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ff63f6] text-white text-xs font-black">
                          {pendingWalletCount} pendente{pendingWalletCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </h2>
                  </div>
                  <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
                    Revisão de requisições financeiras feitas pelos membros. Aprovação debita o valor da conta do membro; recusa mantém o saldo intacto.
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const).map((filter) => {
                    const count =
                      filter === 'ALL'
                        ? walletRequests.length
                        : walletRequests.filter((r) => r.status === filter).length;
                    return (
                      <button
                        key={filter}
                        onClick={() => setWalletRequestsFilter(filter)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          walletRequestsFilter === filter
                            ? 'bg-[#151e33] text-white shadow-sm'
                            : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                        }`}
                      >
                        {filter === 'ALL'
                          ? `Todos (${count})`
                          : filter === 'PENDING'
                          ? `Pendentes (${count})`
                          : filter === 'APPROVED'
                          ? `Aprovados (${count})`
                          : `Recusados (${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                {isLoadingWalletRequests ? (
                  <div className="space-y-3 py-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-[24px] bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : walletRequests.filter((r) => walletRequestsFilter === 'ALL' || r.status === walletRequestsFilter).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#151e33]/10 rounded-[32px]">
                    <HandCoins className="h-10 w-10 text-[#151e33]/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#151e33]">Sem pedidos nesta categoria</p>
                    <p className="text-xs text-[#151e33]/50 mt-1">
                      Não existem pedidos de utilização de saldo que correspondam ao filtro selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walletRequests
                      .filter((r) => walletRequestsFilter === 'ALL' || r.status === walletRequestsFilter)
                      .map((req) => (
                        <div
                          key={req.id}
                          className={`p-6 rounded-[28px] border transition-all ${
                            req.status === 'PENDING'
                              ? 'bg-white border-[#ff63f6]/40 shadow-sm'
                              : req.status === 'APPROVED'
                              ? 'bg-[#151e33]/[0.02] border-[#151e33]/10'
                              : 'bg-slate-50 border-[#151e33]/5'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            {/* Member info & Request details */}
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="h-10 w-10 rounded-full bg-[#151e33] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {req.user?.fullName
                                    ?.split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('') || 'MB'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[#151e33]">
                                      {req.user?.fullName}
                                    </h4>
                                    <span className="text-xs text-[#151e33]/50">({req.user?.email})</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-[#151e33]/60 font-medium mt-0.5">
                                    <span>{req.user?.department?.name || 'Geral'}</span>
                                    <span>•</span>
                                    <span>{req.user?.position}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Financial info badges */}
                              <div className="flex items-center gap-3 flex-wrap pt-1">
                                <div className="px-3.5 py-1.5 rounded-full bg-[#151e33]/5 border border-[#151e33]/10 flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold text-[#151e33]/50">
                                    Montante Solicitado:
                                  </span>
                                  <span className="text-sm font-black text-[#151e33]">
                                    {req.amount.toFixed(2)} €
                                  </span>
                                </div>

                                <div className="px-3.5 py-1.5 rounded-full bg-[#151e33]/5 border border-[#151e33]/10 flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold text-[#151e33]/50">
                                    Saldo Atual do Membro:
                                  </span>
                                  <span
                                    className={`text-xs font-extrabold ${
                                      (req.currentMemberBalance ?? 0) >= req.amount
                                        ? 'text-emerald-600'
                                        : 'text-amber-600'
                                    }`}
                                  >
                                    {(req.currentMemberBalance ?? 0).toFixed(2)} €
                                  </span>
                                </div>

                                {req.status === 'PENDING' && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ff63f6]/10 text-[#151e33] border border-[#ff63f6]/30 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-[#ff63f6]" />
                                    <span>Pendente de Decisão</span>
                                  </span>
                                )}

                                {req.status === 'APPROVED' && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Aprovado — Debitado</span>
                                  </span>
                                )}

                                {req.status === 'REJECTED' && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                    <span>Recusado — Saldo Mantido</span>
                                  </span>
                                )}
                              </div>

                              {/* Justification Box */}
                              <div className="p-3.5 rounded-[20px] bg-slate-50 border border-[#151e33]/10 text-xs text-[#151e33]">
                                <span className="font-bold text-[#151e33] block mb-1">
                                  Efeito / Justificação do Pedido:
                                </span>
                                <p className="whitespace-pre-wrap text-[#151e33]/80">{req.justification}</p>
                              </div>

                              {/* Rejection reason if applicable */}
                              {req.status === 'REJECTED' && req.rejectionReason && (
                                <div className="p-3 rounded-[20px] bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start gap-1.5">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                                  <div>
                                    <span className="font-bold">Motivo da Recusa: </span>
                                    <span>{req.rejectionReason}</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-[#151e33]/40 pt-1">
                                <span>
                                  Solicitado em{' '}
                                  {new Date(req.createdAt).toLocaleDateString('pt-PT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {req.reviewedBy && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Revisto por: <strong className="text-[#151e33]">{req.reviewedBy.fullName}</strong>
                                      {req.reviewedAt && (
                                        <span>
                                          {' '}em{' '}
                                          {new Date(req.reviewedAt).toLocaleDateString('pt-PT', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </span>
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons for PENDING */}
                            {req.status === 'PENDING' && (
                              <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                                <button
                                  onClick={() => setApprovingRequest(req)}
                                  className="w-full px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Aprovar</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectingRequest(req);
                                    setRejectionReasonInput('');
                                  }}
                                  className="w-full px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Recusar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Section 2: Reembolsos de Despesas YME (Exclusivo Administradores) */}
          {walletSubView === 'REIMBURSEMENTS' && isAdmin && (
            <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#151e33]/5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
                    <h2 className="text-xl font-bold text-[#151e33] flex items-center gap-2">
                      <span>Pedidos de Reembolso YME (Faturas)</span>
                      {pendingReimbursementsCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ff63f6] text-white text-xs font-black animate-pulse">
                          {pendingReimbursementsCount} pendente{pendingReimbursementsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </h2>
                  </div>
                  <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
                    Membros que realizaram compras para a YME e pediram devolução de dinheiro com fatura anexada. Apenas Administradores podem decidir e, para aprovar, é obrigatório submeter o comprovativo da devolução.
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const).map((filter) => {
                    const count =
                      filter === 'ALL'
                        ? reimbursements.length
                        : reimbursements.filter((r) => r.status === filter).length;
                    return (
                      <button
                        key={filter}
                        onClick={() => setReimbursementsFilter(filter)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          reimbursementsFilter === filter
                            ? 'bg-[#151e33] text-white shadow-sm'
                            : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                        }`}
                      >
                        {filter === 'ALL'
                          ? `Todos (${count})`
                          : filter === 'PENDING'
                          ? `Pendentes (${count})`
                          : filter === 'APPROVED'
                          ? `Aprovados (${count})`
                          : `Recusados (${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                {isLoadingReimbursements ? (
                  <div className="space-y-3 py-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 rounded-[24px] bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : reimbursements.filter((r) => reimbursementsFilter === 'ALL' || r.status === reimbursementsFilter).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#151e33]/10 rounded-[32px]">
                    <Receipt className="h-10 w-10 text-[#151e33]/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#151e33]">Sem pedidos de reembolso nesta categoria</p>
                    <p className="text-xs text-[#151e33]/50 mt-1">
                      Não existem pedidos de reembolso que correspondam ao filtro selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reimbursements
                      .filter((r) => reimbursementsFilter === 'ALL' || r.status === reimbursementsFilter)
                      .map((req) => (
                        <div
                          key={req.id}
                          className={`p-6 rounded-[28px] border transition-all ${
                            req.status === 'PENDING'
                              ? 'bg-white border-[#ff63f6]/40 shadow-sm'
                              : req.status === 'APPROVED'
                              ? 'bg-[#151e33]/[0.02] border-[#151e33]/10'
                              : 'bg-slate-50 border-[#151e33]/5'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            {/* Member info & Reimbursement details */}
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="h-10 w-10 rounded-full bg-[#151e33] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {req.user?.fullName
                                    ?.split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('') || 'MB'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[#151e33]">
                                      {req.user?.fullName}
                                    </h4>
                                    <span className="text-xs text-[#151e33]/50">({req.user?.email})</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-[#151e33]/60 font-medium mt-0.5">
                                    <span>{req.user?.department?.name || 'Geral'}</span>
                                    <span>•</span>
                                    <span>{req.user?.position}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Value & Status Badges */}
                              <div className="flex items-center gap-3 flex-wrap pt-1">
                                <div className="px-3.5 py-1.5 rounded-full bg-[#151e33]/5 border border-[#151e33]/10 flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold text-[#151e33]/50">
                                    Valor a Reembolsar:
                                  </span>
                                  <span className="text-sm font-black text-[#151e33]">
                                    {req.amount.toFixed(2)} €
                                  </span>
                                </div>

                                {req.status === 'PENDING' && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ff63f6]/10 text-[#151e33] border border-[#ff63f6]/30 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-[#ff63f6]" />
                                    <span>Pendente de Decisão</span>
                                  </span>
                                )}

                                {req.status === 'APPROVED' && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Aprovado & Devolvido</span>
                                  </span>
                                )}

                                {req.status === 'REJECTED' && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                    <span>Recusado</span>
                                  </span>
                                )}
                              </div>

                              {/* Justification Box */}
                              <div className="p-3.5 rounded-[20px] bg-slate-50 border border-[#151e33]/10 text-xs text-[#151e33]">
                                <span className="font-bold text-[#151e33] block mb-1">
                                  Justificação da Compra:
                                </span>
                                <p className="whitespace-pre-wrap text-[#151e33]/80">{req.justification}</p>
                              </div>

                              {/* Member Invoice Attachment Link */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <a
                                  href={req.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#151e33]/5 hover:bg-[#151e33]/10 text-[#151e33] text-xs font-bold border border-[#151e33]/10 transition-colors"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-[#ff63f6]" />
                                  <span>Ver Fatura / Recibo Submetido</span>
                                  <ExternalLink className="h-3 w-3 text-[#151e33]/40" />
                                </a>

                                {req.status === 'APPROVED' && req.refundProofUrl && (
                                  <a
                                    href={req.refundProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Ver Comprovativo de Devolução (Anexo Admin)</span>
                                    <ExternalLink className="h-3 w-3 text-emerald-500" />
                                  </a>
                                )}
                              </div>

                              {/* Rejection reason if applicable */}
                              {req.status === 'REJECTED' && req.rejectionReason && (
                                <div className="p-3 rounded-[20px] bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start gap-1.5">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                                  <div>
                                    <span className="font-bold">Motivo da Recusa: </span>
                                    <span>{req.rejectionReason}</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-[#151e33]/40 pt-1">
                                <span>
                                  Solicitado em{' '}
                                  {new Date(req.createdAt).toLocaleDateString('pt-PT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {req.reviewedBy && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Decidido por: <strong className="text-[#151e33]">{req.reviewedBy.fullName}</strong>
                                      {req.reviewedAt && (
                                        <span>
                                          {' '}em{' '}
                                          {new Date(req.reviewedAt).toLocaleDateString('pt-PT', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </span>
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons for PENDING */}
                            {req.status === 'PENDING' && (
                              <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                                <button
                                  onClick={() => {
                                    setApprovingReimbursement(req);
                                    setRefundProofFile(null);
                                  }}
                                  className="w-full px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Aprovar Devolução</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectingReimbursement(req);
                                    setReimbursementRejectReason('');
                                  }}
                                  className="w-full px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Recusar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Section 3: Atribuição e Movimentos Manuais (Admins + Legal Head/Manager) */}
          {walletSubView === 'MANUAL' && canManageWallet && (
            <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 max-w-3xl space-y-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
                  <h2 className="text-xl font-bold text-[#151e33]">
                    Atribuição & Movimentos Manuais de Carteira
                  </h2>
                </div>
                <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
                  Lançamento manual de prémios SAD, bónus de presença ou débitos associativos diretamente na carteira do membro.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!walletUserId) {
                    showNotification('Por favor, seleciona um membro.', true);
                    return;
                  }
                  createWalletMutation.mutate();
                }}
                className="space-y-5"
              >
                <Select
                  label="Membro Destinatário *"
                  value={walletUserId}
                  onChange={(e) => setWalletUserId(e.target.value)}
                  required
                >
                  <option value="">-- Selecionar Membro Ativo --</option>
                  {users
                    .filter((u) => u.isActive !== false)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.department?.name || 'Sem Dept'})
                      </option>
                    ))}
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Montante (€) *"
                    type="number"
                    step="0.01"
                    placeholder="ex: 25.00 ou -15.00"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    required
                  />

                  <Select
                    label="Tipo de Movimento *"
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value as WalletType)}
                    required
                  >
                    <option value="SAD_REWARD">Prémio SAD (Crédito)</option>
                    <option value="PRESENCE_BONUS">Bónus de Presença / Evento (Crédito)</option>
                    <option value="EVENT_SPEND">Inscrição em Evento / Merchandising (Débito)</option>
                    <option value="ADJUSTMENT">Ajuste Manual / Outro</option>
                  </Select>
                </div>

                <Input
                  label="Descrição do Movimento *"
                  placeholder="ex: Bónus de Excelência Trimestral Q1"
                  value={walletDesc}
                  onChange={(e) => setWalletDesc(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={createWalletMutation.isPending}
                  className="w-full h-12 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4" />
                  <span>{createWalletMutation.isPending ? 'A processar...' : 'Processar Transação na Carteira'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ADICIONAR MARCO NA JORNADA (EXECUTIVE BOARD / ADMIN ONLY) */}
      {activeTab === 'TIMELINE' && canManageTimeline && (
        <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
              <h2 className="text-xl font-bold text-[#151e33]">
                Adicionar Marco à Jornada do Membro
              </h2>
            </div>
            <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
              Competência exclusiva da Executive Board para registar distinções, formações, projetos e momentos-chave.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!timelineUserId) {
                showNotification('Por favor, seleciona um membro.', true);
                return;
              }
              createTimelineMutation.mutate();
            }}
            className="space-y-5"
          >
            <Select
              label="Membro *"
              value={timelineUserId}
              onChange={(e) => setTimelineUserId(e.target.value)}
              required
            >
              <option value="">-- Selecionar Membro --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.department?.name || 'Sem Dept'})
                </option>
              ))}
            </Select>

            {timelineUserId && (
              <Select
                label="Cargo em que atingiu o Marco *"
                value={timelineRoleStep}
                onChange={(e) => setTimelineRoleStep(e.target.value)}
                required
              >
                <option value="">-- Selecionar Cargo do Membro --</option>
                {computeCareerStepsForUser(users.find((u) => u.id === timelineUserId)).map((step) => (
                  <option key={step} value={step}>
                    {step}
                  </option>
                ))}
              </Select>
            )}

            <Input
              label="Título do Marco *"
              placeholder="ex: Nomeação como Tech Lead no Projeto Alfa"
              value={timelineTitle}
              onChange={(e) => setTimelineTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Categoria do Marco *"
                value={timelineCategory}
                onChange={(e) => setTimelineCategory(e.target.value as TimelineCategory)}
                required
              >
                <option value="PROJECT">Projeto</option>
                <option value="FORMATION">Formação</option>
                <option value="TASKGROUP">Task Group</option>
                <option value="AWARD">Distinção / Reconhecimento</option>
                <option value="RECRUITMENT">Recrutamento</option>
              </Select>

              <Input
                label="Data do Acontecimento *"
                type="date"
                value={timelineDate}
                onChange={(e) => setTimelineDate(e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Descrição Detalhada"
              placeholder="Contexto sobre o marco atingido pelo membro..."
              value={timelineDesc}
              onChange={(e) => setTimelineDesc(e.target.value)}
              rows={3}
            />

            <button
              type="submit"
              disabled={createTimelineMutation.isPending}
              className="w-full h-12 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{createTimelineMutation.isPending ? 'A publicar...' : 'Publicar na Jornada'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AGENDAR EVENTO NO CALENDÁRIO (ADMIN, HR, CSR, PARTNERSHIPS) */}
      {activeTab === 'CALENDAR' && canCreateEvents && (
        <div className="bg-white rounded-[44px] p-6 sm:p-9 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
              <h2 className="text-xl font-bold text-[#151e33]">
                Agendar Novo Evento Associativo
              </h2>
            </div>
            <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
              {isAdmin ? (
                <span>Como membro da <strong>Executive Board</strong>, tens permissão total para agendar qualquer tipo de evento.</span>
              ) : user?.department?.name === 'Human Resources' ? (
                <span>Como membro de <strong>Recursos Humanos</strong>, tens permissão para agendar <strong>Atividades de RH</strong>.</span>
              ) : user?.taskgroups?.includes('CSR') ? (
                <span>Como membro da <strong>Taskgroup CSR</strong>, tens permissão para agendar <strong>Atividades de RSC</strong>.</span>
              ) : user?.taskgroups?.includes('PARTNERSHIPS') ? (
                <span>Como membro da <strong>Taskgroup Partnerships</strong>, tens permissão para agendar <strong>Open Days</strong>.</span>
              ) : (
                <span>Cria uma nova atividade no calendário associativo.</span>
              )}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCalendarMutation.mutate();
            }}
            className="space-y-5"
          >
            <Input
              label="Título do Evento *"
              placeholder="ex: Workshop de Integração / Ação Solidária"
              value={calTitle}
              onChange={(e) => setCalTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Categoria Permitida *"
                value={calCategory}
                onChange={(e) => setCalCategory(e.target.value as CalendarCategory)}
                required
              >
                {allowedEventCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </Select>

              <Input
                label="Data e Hora de Início *"
                type="datetime-local"
                value={calStart}
                onChange={(e) => setCalStart(e.target.value)}
                required
              />

              <Input
                label="Data e Hora de Fim *"
                type="datetime-local"
                value={calEnd}
                onChange={(e) => setCalEnd(e.target.value)}
                required
              />
            </div>

            <Input
              label="Localização / Link da Sessão"
              placeholder="ex: Sala 2.04 / Google Meet"
              value={calLoc}
              onChange={(e) => setCalLoc(e.target.value)}
            />

            <Textarea
              label="Descrição e Instruções"
              placeholder="Informações adicionais para os participantes..."
              value={calDesc}
              onChange={(e) => setCalDesc(e.target.value)}
              rows={3}
            />

            <button
              type="submit"
              disabled={createCalendarMutation.isPending}
              className="w-full h-12 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{createCalendarMutation.isPending ? 'A agendar...' : 'Publicar no Calendário'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SUPORTE & CHATS AOS MEMBROS (ADMIN, HR, LEGAL & FINANCE) */}
      {activeTab === 'SUPPORT' && canAccessSupport && (
        <div className="space-y-6">
          <div className="bg-white rounded-[36px] p-6 sm:p-7 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#151e33]/5 space-y-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] bg-[#ff63f6] rounded-full flex-shrink-0" />
                <h2 className="text-xl font-bold text-[#151e33]">
                  Fila de Atendimento & Suporte aos Membros
                </h2>
              </div>
              <p className="text-xs text-[#151e33]/60 mt-1 ml-3.5">
                {isAdmin ? (
                  <span>
                    Como membro da <strong>Executive Board</strong>, tens acesso universal a todos os pedidos de suporte (Avaliação SAD, Carteira e Assuntos Gerais).
                  </span>
                ) : user?.department?.name === 'Human Resources' ? (
                  user?.position === 'Head' || user?.position === 'Manager' ? (
                    <span>
                      Como <strong>{user?.position} de Recursos Humanos</strong>, tens acesso a todos os tickets e dúvidas de <strong>Avaliação SAD</strong>.
                    </span>
                  ) : user?.assignedDepartment ? (
                    <span>
                      Como consultor de <strong>Recursos Humanos</strong> alocado ao departamento <strong>{user.assignedDepartment.name}</strong>, tens acesso aos tickets de <strong>Avaliação SAD</strong> submetidos pelos membros desse departamento.
                    </span>
                  ) : (
                    <span>
                      Como membro de <strong>Recursos Humanos</strong>, tens acesso aos pedidos e dúvidas de <strong>Avaliação SAD</strong>.
                    </span>
                  )
                ) : user?.department?.name === 'Legal & Finance' ? (
                  <span>
                    Como <strong>{user?.position} de Legal & Finance</strong>, tens acesso aos pedidos e dúvidas sobre a <strong>Carteira YME</strong>.
                  </span>
                ) : (
                  <span>Painel de atendimento e resolução de dúvidas.</span>
                )}
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#151e33]/40" />
                <input
                  type="text"
                  placeholder="Pesquisar por membro, assunto ou conteúdo..."
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#151e33]/15 bg-white text-xs font-medium text-[#151e33] placeholder:text-[#151e33]/40 focus:outline-none focus:ring-1 focus:ring-[#ff63f6] focus:border-[#ff63f6] transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setSupportStatusFilter('ALL')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    supportStatusFilter === 'ALL'
                      ? 'bg-[#151e33] text-white shadow-sm'
                      : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                  }`}
                >
                  Todos ({supportTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupportStatusFilter('OPEN')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    supportStatusFilter === 'OPEN'
                      ? 'bg-[#151e33] text-white shadow-sm'
                      : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                  }`}
                >
                  Abertos ({supportTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupportStatusFilter('RESOLVED')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    supportStatusFilter === 'RESOLVED'
                      ? 'bg-[#151e33] text-white shadow-sm'
                      : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                  }`}
                >
                  Resolvidos ({supportTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length})
                </button>
              </div>

              {/* Category Filter for Admins */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setSupportCategoryFilter('ALL')}
                    className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      supportCategoryFilter === 'ALL'
                        ? 'bg-[#151e33] text-white shadow-sm'
                        : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                    }`}
                  >
                    Categorias (Todas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupportCategoryFilter('SAD_EVALUATION')}
                    className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      supportCategoryFilter === 'SAD_EVALUATION'
                        ? 'bg-[#ff63f6] text-white shadow-sm'
                        : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#ff63f6]'
                    }`}
                  >
                    SAD
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupportCategoryFilter('WALLET')}
                    className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      supportCategoryFilter === 'WALLET'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-emerald-600'
                    }`}
                  >
                    Carteira
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupportCategoryFilter('OTHER')}
                    className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      supportCategoryFilter === 'OTHER'
                        ? 'bg-[#151e33] text-white shadow-sm'
                        : 'bg-white border border-[#151e33]/10 text-[#151e33]/60 hover:text-[#151e33]'
                    }`}
                  >
                    Outros
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Split View: Tickets List on Left, Active Chat on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
            {/* Left Column: Tickets Queue */}
            <div className="lg:col-span-5 space-y-3">
              {filteredSupportTickets.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-[32px] border border-[#151e33]/10 shadow-[0px_4px_24px_rgba(0,0,0,0.04)]">
                  <HelpCircle className="h-10 w-10 text-[#151e33]/20 mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#151e33]">Sem tickets na fila de atendimento</p>
                  <p className="text-[11px] text-[#151e33]/50 mt-1">
                    Não existem pedidos que correspondam aos filtros selecionados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {filteredSupportTickets.map((tk) => {
                    const isSelected = selectedSupportTicket?.id === tk.id;
                    const lastMsg = tk.messages[tk.messages.length - 1];

                    let catBadgeClass = 'bg-[#151e33]/5 text-[#151e33] border-[#151e33]/10';
                    let catLabel = 'Outros Assuntos';
                    if (tk.category === 'SAD_EVALUATION') {
                      catBadgeClass = 'bg-[#ff63f6]/10 text-[#151e33] border-[#ff63f6]/30';
                      catLabel = 'Avaliação SAD';
                    } else if (tk.category === 'WALLET') {
                      catBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      catLabel = 'Carteira YME';
                    }

                    return (
                      <div
                        key={tk.id}
                        onClick={() => setSelectedSupportTicket(tk)}
                        className={`p-4 sm:p-5 rounded-[28px] border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#151e33] bg-[#151e33]/[0.03] shadow-sm scale-[1.01]'
                            : 'border-[#151e33]/10 hover:border-[#ff63f6]/40 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${catBadgeClass}`}
                          >
                            {catLabel}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {tk.status === 'OPEN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff63f6]/10 text-[#151e33] border border-[#ff63f6]/30">
                                <Clock className="h-2.5 w-2.5 text-[#ff63f6]" /> Aberto
                              </span>
                            )}
                            {tk.status === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <RefreshCw className="h-2.5 w-2.5" /> Em análise
                              </span>
                            )}
                            {(tk.status === 'RESOLVED' || tk.status === 'CLOSED') && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Resolvido
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Requester details */}
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="h-7 w-7 rounded-full bg-[#151e33] text-white flex items-center justify-center text-[10px] font-bold">
                            {tk.user.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#151e33] leading-tight">
                              {tk.user.fullName}
                            </h4>
                            <p className="text-[10px] text-[#151e33]/50 font-medium">
                              {tk.user.department?.name || 'Sem Dept'} • {tk.user.position}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs font-medium text-[#151e33]/80 line-clamp-2 bg-slate-50 p-2.5 rounded-[18px] border border-[#151e33]/5">
                          {lastMsg?.content || tk.subject}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#151e33]/5 text-[10px] text-[#151e33]/40 font-semibold">
                          <span>
                            {new Date(tk.updatedAt || tk.createdAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[#ff63f6] font-bold flex items-center gap-1">
                            {tk.messages.length} {tk.messages.length === 1 ? 'msg' : 'msgs'} →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Active Live Chat with Member */}
            <div className="lg:col-span-7">
              {selectedSupportTicket ? (
                <div className="bg-white rounded-[36px] border border-[#151e33]/10 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] flex flex-col h-full overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-4 sm:p-5 border-b border-[#151e33]/5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#151e33] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {selectedSupportTicket.user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#151e33]">
                            {selectedSupportTicket.user.fullName}
                          </h3>
                          <RoleBadge role={selectedSupportTicket.user.role} />
                        </div>
                        <p className="text-[11px] text-[#151e33]/50 font-medium mt-0.5">
                          {selectedSupportTicket.user.email} • {selectedSupportTicket.user.department?.name} ({selectedSupportTicket.user.position})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {selectedSupportTicket.status !== 'RESOLVED' && selectedSupportTicket.status !== 'CLOSED' ? (
                        <button
                          onClick={() =>
                            updateSupportStatusMutation.mutate({
                              ticketId: selectedSupportTicket.id,
                              status: 'RESOLVED',
                            })
                          }
                          disabled={updateSupportStatusMutation.isPending}
                          className="px-4 py-2 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Marcar como Resolvido</span>
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateSupportStatusMutation.mutate({
                              ticketId: selectedSupportTicket.id,
                              status: 'IN_PROGRESS',
                            })
                          }
                          disabled={updateSupportStatusMutation.isPending}
                          className="px-4 py-2 rounded-full text-xs font-bold text-[#151e33] bg-[#151e33]/5 border border-[#151e33]/15 hover:bg-[#151e33]/10 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Reabrir Pedido</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/40 max-h-[380px] min-h-[300px]">
                    {selectedSupportTicket.messages.map((msg) => {
                      const isStaff = msg.senderId !== selectedSupportTicket.userId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-[#151e33]/40">
                            <span>{msg.sender?.fullName || 'Utilizador'}</span>
                            {msg.sender?.department?.name && (
                              <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#151e33]/5 text-[#151e33] font-bold">
                                {msg.sender.department.name}
                              </span>
                            )}
                            {isStaff && (
                              <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#ff63f6]/20 text-[#151e33] font-bold">
                                Equipa de Resposta
                              </span>
                            )}
                            <span>•</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-4 rounded-[22px] max-w-[85%] text-xs leading-relaxed font-medium shadow-sm ${
                              isStaff
                                ? 'bg-[#151e33] text-white rounded-tr-none'
                                : 'bg-white text-[#151e33] border border-[#151e33]/10 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={supportChatEndRef} />
                  </div>

                  {/* Staff Reply Form */}
                  <div className="p-4 border-t border-[#151e33]/5 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!supportReplyMessage.trim()) return;
                        sendSupportReplyMutation.mutate({
                          ticketId: selectedSupportTicket.id,
                          content: supportReplyMessage.trim(),
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Escreve a resposta oficial para o membro..."
                        value={supportReplyMessage}
                        onChange={(e) => setSupportReplyMessage(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-full border border-[#151e33]/15 bg-white text-xs font-medium text-[#151e33] placeholder:text-[#151e33]/40 focus:outline-none focus:ring-1 focus:ring-[#ff63f6] focus:border-[#ff63f6] transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!supportReplyMessage.trim() || sendSupportReplyMutation.isPending}
                        className="h-10 px-5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        <span>Responder</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="h-full rounded-[36px] bg-white border border-[#151e33]/10 shadow-[0px_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center p-12 text-center">
                  <div className="h-14 w-14 rounded-full bg-[#ff63f6]/10 flex items-center justify-center text-[#ff63f6] mb-3">
                    <MessagesSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-bold text-[#151e33]">Nenhum pedido de suporte selecionado</h3>
                  <p className="text-xs text-[#151e33]/50 max-w-sm mt-1">
                    Seleciona um ticket na lista à esquerda para analisar a dúvida, ver o perfil do membro e responder diretamente no chat.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CRIAR NOVO MEMBRO (ADMIN) ================= */}
      <Dialog
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        title="Criar Novo Membro da YME"
        description="Atribuição de credenciais institucionais, departamento oficial, cargo e taskgroups."
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newDepartmentId) {
              showNotification('Por favor seleciona um departamento.', true);
              return;
            }
            createUserMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Nome Completo *"
            placeholder="ex: Mariana Costa"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Institucional *"
              type="email"
              placeholder="mariana.costa@yme.pt"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />

            <Input
              label="Palavra-passe Provisória *"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Departamento Oficial *"
              value={newDepartmentId}
              onChange={(e) => handleNewDepartmentChange(e.target.value)}
              required
            >
              <option value="">-- Selecionar --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Cargo / Position *"
              value={newPosition}
              onChange={(e) => handleNewPositionChange(e.target.value as Position)}
              required
            >
              {(departments.find((d) => d.id === newDepartmentId)?.name === 'Executive Board'
                ? EXBO_POSITIONS
                : DEPT_POSITIONS
              ).map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </Select>

            <Select
              label="Permissão / Role *"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              disabled={true}
              required
            >
              <option value="MEMBER">Membro</option>
              <option value="DIRECTOR">Diretor (Head)</option>
              <option value="ADMIN">Admin (Executive Board)</option>
            </Select>
          </div>

          {/* Conditional field for Human Resources: Departamento a que está alocado */}
          {departments.find((d) => d.id === newDepartmentId)?.name === 'Human Resources' &&
            ['Trainee', 'Junior Consultant', 'Senior Consultant'].includes(newPosition) && (
              <div className="p-4 bg-[#ff63f6]/10 rounded-[20px] border border-[#ff63f6]/30 space-y-2">
                <label className="text-xs font-bold text-[#151e33] block">
                  Departamento a que está alocado *
                </label>
                <p className="text-[11px] text-[#151e33]/70">
                  Como membro de RH, este consultor terá acesso e poderá responder aos tickets de SAD submetidos pelos membros do departamento selecionado.
                </p>
                <Select
                  value={newAssignedDepartmentId}
                  onChange={(e) => setNewAssignedDepartmentId(e.target.value)}
                  required
                >
                  <option value="">-- Selecionar Departamento Alocado --</option>
                  {departments
                    .filter((d) => d.name !== 'Executive Board' && d.name !== 'Human Resources')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}

          {newRole === 'DIRECTOR' && (
            <div className="p-4 bg-[#ff63f6]/10 rounded-[20px] border border-[#ff63f6]/30">
              <label className="text-xs font-bold text-[#151e33] block mb-1">
                Cargo mais alto antes de ser Diretor *
              </label>
              <p className="text-[11px] text-[#151e33]/70 mb-2">
                Um diretor pode ter sido no máximo Junior Consultant antes de ser diretor. Isto define as etapas do seu percurso.
              </p>
              <Select
                value={newHighestPreviousPos}
                onChange={(e) => setNewHighestPreviousPos(e.target.value as any)}
                required
              >
                <option value="NONE">Nenhum (Entrada direta como Diretor/Head)</option>
                <option value="TRAINEE">Trainee</option>
                <option value="JUNIOR_CONSULTANT">Junior Consultant (Trainee ➔ Junior Consultant)</option>
              </Select>
            </div>
          )}

          {newRole === 'ADMIN' && (
            <div className="p-4 bg-[#ff63f6]/10 rounded-[20px] border border-[#ff63f6]/30 space-y-2">
              <label className="text-xs font-bold text-[#151e33] block">
                Cargos anteriores na YME (Executive Board) *
              </label>
              <p className="text-[11px] text-[#151e33]/70">
                Seleciona todos os cargos que teve anteriormente para que a sua linha temporal fique correta:
              </p>
              <div className="flex flex-wrap gap-3">
                {['Trainee', 'Junior Consultant', 'Senior Consultant', 'Head'].map((cargo) => (
                  <label key={cargo} className="flex items-center gap-1.5 text-xs text-[#151e33] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminPreviousRoles.includes(cargo)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewAdminPreviousRoles([...newAdminPreviousRoles, cargo]);
                        } else {
                          setNewAdminPreviousRoles(newAdminPreviousRoles.filter((c) => c !== cargo));
                        }
                      }}
                      className="rounded border-slate-300 text-[#ff63f6] focus:ring-[#ff63f6]"
                    />
                    <span>{cargo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#151e33] uppercase tracking-wider block mb-1.5">
              Taskgroups Associadas
            </label>
            <div className="flex flex-wrap gap-4 p-3.5 rounded-[20px] bg-slate-50 border border-[#151e33]/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#151e33]">
                <input
                  type="checkbox"
                  checked={newTaskgroups.includes('CSR')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewTaskgroups([...newTaskgroups, 'CSR']);
                    } else {
                      setNewTaskgroups(newTaskgroups.filter((t) => t !== 'CSR'));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-[#ff63f6] focus:ring-[#ff63f6]"
                />
                <span>🌱 Taskgroup CSR (RSC)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#151e33]">
                <input
                  type="checkbox"
                  checked={newTaskgroups.includes('PARTNERSHIPS')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewTaskgroups([...newTaskgroups, 'PARTNERSHIPS']);
                    } else {
                      setNewTaskgroups(newTaskgroups.filter((t) => t !== 'PARTNERSHIPS'));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-[#ff63f6] focus:ring-[#ff63f6]"
                />
                <span>🤝 Taskgroup Partnerships</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              <span>{createUserMutation.isPending ? 'A criar...' : 'Criar Membro'}</span>
            </button>
          </div>
        </form>
      </Dialog>

      {/* ================= MODAL 2: EDITAR MEMBRO (ADMIN) ================= */}
      <Dialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Editar Membro: ${editingUser?.fullName}`}
        description="Alteração de departamento, cargo, taskgroups, permissões e estado da conta."
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateUserMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Nome Completo *"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Departamento Oficial *"
              value={editDepartmentId}
              onChange={(e) => handleEditDepartmentChange(e.target.value)}
              required
            >
              <option value="">-- Selecionar --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Cargo / Position *"
              value={editPosition}
              onChange={(e) => handleEditPositionChange(e.target.value as Position)}
              required
            >
              {(departments.find((d) => d.id === editDepartmentId)?.name === 'Executive Board'
                ? EXBO_POSITIONS
                : DEPT_POSITIONS
              ).map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </Select>

            <Select
              label="Permissão / Role *"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as Role)}
              disabled={true}
              required
            >
              <option value="MEMBER">Membro</option>
              <option value="DIRECTOR">Diretor (Head)</option>
              <option value="ADMIN">Admin (Executive Board)</option>
            </Select>
          </div>

          {/* Conditional field for Human Resources: Departamento a que está alocado */}
          {departments.find((d) => d.id === editDepartmentId)?.name === 'Human Resources' &&
            ['Trainee', 'Junior Consultant', 'Senior Consultant'].includes(editPosition) && (
              <div className="p-4 bg-[#ff63f6]/10 rounded-[20px] border border-[#ff63f6]/30 space-y-2">
                <label className="text-xs font-bold text-[#151e33] block">
                  Departamento a que está alocado *
                </label>
                <p className="text-[11px] text-[#151e33]/70">
                  Como membro de RH, este consultor terá acesso e poderá responder aos tickets de SAD submetidos pelos membros do departamento selecionado.
                </p>
                <Select
                  value={editAssignedDepartmentId}
                  onChange={(e) => setEditAssignedDepartmentId(e.target.value)}
                  required
                >
                  <option value="">-- Selecionar Departamento Alocado --</option>
                  {departments
                    .filter((d) => d.name !== 'Executive Board' && d.name !== 'Human Resources')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}

          <div>
            <label className="text-xs font-bold text-[#151e33] uppercase tracking-wider block mb-1.5">
              Taskgroups Associadas
            </label>
            <div className="flex flex-wrap gap-4 p-3.5 rounded-[20px] bg-slate-50 border border-[#151e33]/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#151e33]">
                <input
                  type="checkbox"
                  checked={editTaskgroups.includes('CSR')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditTaskgroups([...editTaskgroups, 'CSR']);
                    } else {
                      setEditTaskgroups(editTaskgroups.filter((t) => t !== 'CSR'));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-[#ff63f6] focus:ring-[#ff63f6]"
                />
                <span>🌱 Taskgroup CSR (RSC)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#151e33]">
                <input
                  type="checkbox"
                  checked={editTaskgroups.includes('PARTNERSHIPS')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditTaskgroups([...editTaskgroups, 'PARTNERSHIPS']);
                    } else {
                      setEditTaskgroups(editTaskgroups.filter((t) => t !== 'PARTNERSHIPS'));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-[#ff63f6] focus:ring-[#ff63f6]"
                />
                <span>🤝 Taskgroup Partnerships</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#151e33] uppercase tracking-wider block mb-1">
              Etapas do Percurso do Membro (uma por linha)
            </label>
            <p className="text-[11px] text-[#151e33]/60 mb-1.5">
              Define os títulos a rosa na linha temporal do Menu Principal (ex: Trainee of Brand Strategy, Junior Consultant of Brand Strategy, etc.).
            </p>
            <Textarea
              value={editCareerHistoryText}
              onChange={(e) => setEditCareerHistoryText(e.target.value)}
              rows={3}
              placeholder="Trainee of Digital Development&#10;Junior Consultant of Digital Development&#10;Senior Consultant of Digital Development"
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-[20px] bg-slate-50 border border-[#151e33]/10">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-[#ff63f6] focus:ring-[#ff63f6]"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-bold text-[#151e33] cursor-pointer">
              Conta de Membro Ativa na YME APP
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {updateUserMutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* ================= MODAL 3: REDEFINIR PASSWORD (ADMIN) ================= */}
      <Dialog
        isOpen={!!passwordResetUser}
        onClose={() => setPasswordResetUser(null)}
        title="Redefinir Palavra-passe"
        description={`Introduz uma nova palavra-passe para o membro ${passwordResetUser?.fullName} (${passwordResetUser?.email}).`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newResetPassword.length < 6) {
              showNotification('A palavra-passe deve ter pelo menos 6 caracteres.', true);
              return;
            }
            resetPasswordMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Nova Palavra-passe *"
            type="password"
            placeholder="••••••••••••"
            value={newResetPassword}
            onChange={(e) => setNewResetPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
          />

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setPasswordResetUser(null)}
              className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-[#ff63f6] hover:bg-[#e045d6] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {resetPasswordMutation.isPending ? 'A atualizar...' : 'Atualizar Palavra-passe'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* ================= MODAL 4: CONFIRMAR EXCLUSÃO (ADMIN) ================= */}
      <Dialog
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        title="Confirmar Exclusão de Membro"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs sm:text-sm text-[#151e33]">
            Tens a certeza de que pretendes excluir o membro{' '}
            <strong className="text-[#151e33]">{deleteConfirmUser?.fullName}</strong> (
            {deleteConfirmUser?.email})?
          </p>
          <div className="p-3.5 rounded-[20px] bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            ⚠️ Esta ação apagará permanentemente o perfil, avaliações associadas e histórico de movimentos.
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteConfirmUser(null)}
              className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending}
              className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {deleteUserMutation.isPending ? 'A excluir...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* ================= MODAL 5: APROVAR PEDIDO DE UTILIZAÇÃO DE SALDO ================= */}
      <Dialog
        isOpen={!!approvingRequest}
        onClose={() => !approveWalletRequestMutation.isPending && setApprovingRequest(null)}
        title="Aprovar Pedido de Utilização de Saldo"
        description="Confirmação de débito financeiro da carteira do membro"
      >
        {approvingRequest && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-[20px] border border-[#151e33]/10 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Membro Requerente:</span>
                <span className="font-bold text-[#151e33]">{approvingRequest.user?.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Saldo Atual Disponível:</span>
                <span className="font-bold text-emerald-600">
                  {(approvingRequest.currentMemberBalance ?? 0).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Montante a Debitar:</span>
                <span className="font-black text-rose-600 text-sm">
                  -{approvingRequest.amount.toFixed(2)} €
                </span>
              </div>
              <div className="pt-2 border-t border-[#151e33]/10">
                <span className="text-[#151e33]/60 font-bold block mb-1">Justificação do Membro:</span>
                <p className="text-[#151e33] bg-white p-3 rounded-[16px] border border-[#151e33]/10">
                  {approvingRequest.justification}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-[20px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Impacto Financeiro:</span>
              </p>
              <p>
                Ao aprovar, o valor de <strong>{approvingRequest.amount.toFixed(2)} €</strong> será imediatamente subtraído da conta do membro e registado no histórico de despesas associativas.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                disabled={approveWalletRequestMutation.isPending}
                className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => approveWalletRequestMutation.mutate(approvingRequest.id)}
                disabled={approveWalletRequestMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {approveWalletRequestMutation.isPending ? 'A aprovar...' : 'Confirmar Aprovação & Débito'}
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ================= MODAL 6: RECUSAR PEDIDO DE UTILIZAÇÃO DE SALDO ================= */}
      <Dialog
        isOpen={!!rejectingRequest}
        onClose={() => !rejectWalletRequestMutation.isPending && setRejectingRequest(null)}
        title="Recusar Pedido de Utilização de Saldo"
        description="O dinheiro permanecerá intacto na conta do membro"
      >
        {rejectingRequest && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              rejectWalletRequestMutation.mutate({
                requestId: rejectingRequest.id,
                reason: rejectionReasonInput,
              });
            }}
            className="space-y-4 pt-2"
          >
            <div className="bg-slate-50 p-4 rounded-[20px] border border-[#151e33]/10 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Membro Requerente:</span>
                <span className="font-bold text-[#151e33]">{rejectingRequest.user?.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Montante Solicitado:</span>
                <span className="font-bold text-[#151e33]">{rejectingRequest.amount.toFixed(2)} €</span>
              </div>
              <div className="pt-2 border-t border-[#151e33]/10">
                <span className="text-[#151e33]/60 font-bold block mb-1">Justificação do Membro:</span>
                <p className="text-[#151e33] bg-white p-3 rounded-[16px] border border-[#151e33]/10">
                  {rejectingRequest.justification}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-[20px] bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Sem impacto no saldo:</span>
              </p>
              <p>
                O montante <strong>não será debitado</strong>. O saldo do membro permanece inalterado na sua conta YME.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#151e33] uppercase tracking-wider block">
                Motivo da Recusa (opcional / justificação para o membro)
              </label>
              <Textarea
                rows={3}
                placeholder="Ex: Justificação insuficiente, o evento já possui orçamento aprovado pelo departamento, etc."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                disabled={rejectWalletRequestMutation.isPending}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                disabled={rejectWalletRequestMutation.isPending}
                className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={rejectWalletRequestMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {rejectWalletRequestMutation.isPending ? 'A recusar...' : 'Confirmar Recusa'}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ================= MODAL 7: APROVAR REEMBOLSO (ADMIN EXCLUSIVO COM ANEXO OBRIGATÓRIO) ================= */}
      <Dialog
        isOpen={!!approvingReimbursement}
        onClose={() => !approveReimbursementMutation.isPending && setApprovingReimbursement(null)}
        title="Aprovar Pedido de Reembolso YME"
        description="Confirmação de reembolso com submissão obrigatória do comprovativo de devolução"
      >
        {approvingReimbursement && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!refundProofFile) {
                showNotification('É obrigatório anexar o comprovativo da devolução de dinheiro.', true);
                return;
              }
              approveReimbursementMutation.mutate({
                requestId: approvingReimbursement.id,
                file: refundProofFile,
              });
            }}
            className="space-y-4 pt-2"
          >
            <div className="bg-slate-50 p-4 rounded-[20px] border border-[#151e33]/10 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Membro Requerente:</span>
                <span className="font-bold text-[#151e33]">{approvingReimbursement.user?.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Valor da Despesa a Devolver:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {approvingReimbursement.amount.toFixed(2)} €
                </span>
              </div>
              <div className="pt-2 border-t border-[#151e33]/10">
                <span className="text-[#151e33]/60 font-bold block mb-1">Justificação da Despesa:</span>
                <p className="text-[#151e33] bg-white p-3 rounded-[16px] border border-[#151e33]/10 whitespace-pre-wrap">
                  {approvingReimbursement.justification}
                </p>
              </div>
              <div className="pt-2 border-t border-[#151e33]/10">
                <a
                  href={approvingReimbursement.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#ff63f6] hover:underline font-bold"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Consultar Fatura Submetida pelo Membro</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Mandatory Proof Upload Field */}
            <div className="space-y-2 p-4 rounded-[20px] bg-[#ff63f6]/5 border border-[#ff63f6]/20">
              <label className="text-xs font-bold text-[#151e33] flex items-center justify-between">
                <span>Comprovativo da Devolução (Transferência) *</span>
                <span className="text-[10px] text-[#ff63f6] uppercase font-black">Obrigatório</span>
              </label>
              <p className="text-[11px] text-[#151e33]/60">
                Para poder clicar no botão de confirmação, é obrigatório submeter o comprovativo da devolução ou transferência efetuada (PDF ou Imagem).
              </p>

              <input
                ref={refundProofInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 25 * 1024 * 1024) {
                      showNotification('O ficheiro não pode exceder 25MB', true);
                      return;
                    }
                    setRefundProofFile(file);
                  }
                }}
              />

              <div
                onClick={() => refundProofInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[18px] p-5 text-center cursor-pointer transition-colors ${
                  refundProofFile
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-[#151e33]/20 hover:border-[#ff63f6] bg-white'
                }`}
              >
                {refundProofFile ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="truncate max-w-[280px]">{refundProofFile.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({(refundProofFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Paperclip className="h-5 w-5 text-[#ff63f6] mx-auto" />
                    <p className="text-xs font-bold text-[#151e33]">
                      Clica para anexar o comprovativo da devolução
                    </p>
                    <p className="text-[10px] text-[#151e33]/50">PDF, JPG, PNG até 25MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setApprovingReimbursement(null);
                  setRefundProofFile(null);
                }}
                disabled={approveReimbursementMutation.isPending}
                className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!refundProofFile || approveReimbursementMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approveReimbursementMutation.isPending ? 'A enviar...' : 'Confirmar Reembolso & Enviar Comprovativo'}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ================= MODAL 8: RECUSAR REEMBOLSO (ADMIN) ================= */}
      <Dialog
        isOpen={!!rejectingReimbursement}
        onClose={() => !rejectReimbursementMutation.isPending && setRejectingReimbursement(null)}
        title="Recusar Pedido de Reembolso YME"
        description="Indica a justificação para a recusa da fatura submetida"
      >
        {rejectingReimbursement && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              rejectReimbursementMutation.mutate({
                requestId: rejectingReimbursement.id,
                reason: reimbursementRejectReason,
              });
            }}
            className="space-y-4 pt-2"
          >
            <div className="bg-slate-50 p-4 rounded-[20px] border border-[#151e33]/10 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Membro Requerente:</span>
                <span className="font-bold text-[#151e33]">{rejectingReimbursement.user?.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#151e33]/60 font-semibold">Valor da Despesa:</span>
                <span className="font-bold text-[#151e33]">{rejectingReimbursement.amount.toFixed(2)} €</span>
              </div>
              <div className="pt-2 border-t border-[#151e33]/10">
                <span className="text-[#151e33]/60 font-bold block mb-1">Justificação do Membro:</span>
                <p className="text-[#151e33] bg-white p-3 rounded-[16px] border border-[#151e33]/10 whitespace-pre-wrap">
                  {rejectingReimbursement.justification}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#151e33] uppercase tracking-wider block">
                Motivo da Recusa (opcional / justificação para o membro)
              </label>
              <Textarea
                rows={3}
                placeholder="Ex: Fatura não legível, despesa não autorizada pela direção, NIF ausente, etc."
                value={reimbursementRejectReason}
                onChange={(e) => setReimbursementRejectReason(e.target.value)}
                disabled={rejectReimbursementMutation.isPending}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingReimbursement(null)}
                disabled={rejectReimbursementMutation.isPending}
                className="px-5 py-2.5 rounded-full border border-[#151e33]/20 hover:border-[#151e33]/40 text-[#151e33] text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={rejectReimbursementMutation.isPending}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {rejectReimbursementMutation.isPending ? 'A recusar...' : 'Confirmar Recusa'}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
