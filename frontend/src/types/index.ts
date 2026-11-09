export type Role = 'MEMBER' | 'DIRECTOR' | 'ADMIN';

export type Position =
  | 'CEO'
  | 'COO'
  | 'CMO'
  | 'Head'
  | 'Manager'
  | 'Senior Consultant'
  | 'Junior Consultant'
  | 'Trainee';

export type Taskgroup = string;

export interface TaskgroupItem {
  id: string;
  name: string;
  createdAt?: string;
}

export type DepartmentName =
  | 'Executive Board'
  | 'Brand Strategy'
  | 'Digital Development'
  | 'Human Resources'
  | 'Legal & Finance'
  | 'Quality Management'
  | 'Sales & Commercial';

export type WalletType =
  | 'SAD_REWARD'
  | 'PRESENCE_BONUS'
  | 'EVENT_SPEND'
  | 'ADJUSTMENT';

export type TimelineCategory =
  | 'RECRUITMENT'
  | 'PROJECT'
  | 'TASKGROUP'
  | 'FORMATION'
  | 'AWARD';

export type CalendarCategory =
  | 'GENERAL_ASSEMBLY'
  | 'GENERAL_MEETING'
  | 'FORMATION'
  | 'HR_ACTIVITY'
  | 'CSR_ACTIVITY'
  | 'OPEN_DAY'
  | 'OTHER'
  | 'TEAMBUILDING'
  | 'DEADLINE';

export interface Department {
  id: string;
  name: string;
  createdAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  departmentId?: string;
  department?: Department;
  assignedDepartmentId?: string | null;
  assignedDepartment?: Department | null;
  position: string;
  careerHistory?: string[];
  taskgroups?: Taskgroup[];
  mustChangePassword?: boolean;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface EvaluationSAD {
  id: string;
  userId: string;
  term: string;
  score: number;
  reportPdfUrl: string;
  feedbackNotes?: string | null;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: WalletType;
  description: string;
  createdAt: string;
}

export type WalletRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReimbursementRequest {
  id: string;
  userId: string;
  amount: number;
  justification: string;
  receiptUrl: string;
  refundProofUrl?: string | null;
  status: ReimbursementStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    fullName: string;
  } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    position: string;
    department?: {
      name: string;
    };
  };
}

export interface WalletRequest {
  id: string;
  userId: string;
  amount: number;
  justification: string;
  status: WalletRequestStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    fullName: string;
  } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    position: string;
    department?: {
      name: string;
    };
  };
  currentMemberBalance?: number;
}

export interface WalletSummary {
  balance: number;
  totalEarnings: number;
  totalSpendings: number;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  transactions: WalletTransaction[];
}

export interface TimelineEvent {
  id: string;
  userId: string;
  title: string;
  category: TimelineCategory;
  description?: string | null;
  roleStep?: string | null;
  eventDate: string;
  createdAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  category: CalendarCategory;
  startTime: string;
  endTime: string;
  location?: string | null;
  createdAt?: string;
}

export interface DashboardSummary {
  balance: number;
  sadAverage: number | null;
  totalSadCount: number;
  latestSad: {
    id: string;
    term: string;
    score: number;
    reportPdfUrl: string;
  } | null;
  nextEvent: {
    id: string;
    title: string;
    category: CalendarCategory;
    startTime: string;
    endTime: string;
    location?: string | null;
  } | null;
  totalMilestones: number;
}

export type SupportCategory = 'SAD_EVALUATION' | 'WALLET' | 'OTHER';
export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: Role;
    position: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    position: string;
    department?: {
      id: string;
      name: string;
    };
  };
  messages: SupportMessage[];
}

