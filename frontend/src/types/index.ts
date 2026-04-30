export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
    };
    language: string;
  };
}

export interface Employee {
  id: string;
  user: User;
  employeeId: string;
  dateOfBirth?: string;
  hireDate: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  status: 'active' | 'on-leave' | 'suspended' | 'terminated';
  hourlyRate?: number;
  salary?: number;
  skills: string[];
  availability: WeekAvailability;
}

export interface WeekAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface DayAvailability {
  available: boolean;
  start?: string;
  end?: string;
}

export interface Shift {
  id: string;
  title: string;
  description?: string;
  employee: Employee;
  startTime: Date;
  endTime: Date;
  breakDuration: number;
  location?: string;
  department?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  type: 'regular' | 'overtime' | 'on-call' | 'training';
  color: string;
  notes?: string;
}

export interface Attendance {
  id: string;
  employee: Employee;
  shift: Shift;
  clockIn: {
    time: Date;
    location?: { latitude: number; longitude: number };
  };
  clockOut?: {
    time: Date;
    location?: { latitude: number; longitude: number };
  };
  status: 'present' | 'late' | 'absent' | 'half-day' | 'on-break';
  isLate: boolean;
  lateMinutes: number;
  totalHours: number;
  overtimeHours: number;
}

export interface Leave {
  id: string;
  employee: Employee;
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'maternity' | 'paternity' | 'unpaid';
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: User;
  reviewedAt?: Date;
}

export interface SwapRequest {
  id: string;
  requester: Employee;
  requestedWith: Employee;
  requesterShift: Shift;
  requestedShift: Shift;
  reason?: string;
  status: 'pending' | 'peer-accepted' | 'peer-rejected' | 'manager-approved' | 'manager-rejected' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    department?: string;
    position?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
