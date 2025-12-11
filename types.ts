
export enum Role {
  ADMIN = 'Admin',
  TECHNICIAN = 'Technician',
  MANAGER = 'Manager'
}

export enum TicketPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  URGENT = 'Urgent'
}

export enum TicketStatus {
  PENDING = 'Pending',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum PaymentMode {
  CASH = 'Cash',
  UPI = 'UPI',
  CARD = 'Card',
  PENDING = 'Not Paid'
}

export enum CustomerType {
  GURU_INSTALLED = 'Guru-Installed',
  SERVICE_ONLY = 'Service-Only'
}

export enum LeadStatus {
  NEW = 'New',
  FOLLOW_UP = 'Follow-Up',
  ESTIMATE = 'Estimate Sent',
  SOLD = 'Sold',
  INSTALLED = 'Installed'
}

export interface Part {
  id: string;
  name: string;
  category: string;
  price: number;
  warrantyMonths: number;
}

export interface MachineType {
  id: string;
  modelName: string;
  description: string;
  warrantyMonths: number;
  price: number;
}

export interface Machine {
  modelNo: string; // This can be the model name or specific serial
  installationDate: string;
  warrantyExpiry: string;
  amcActive: boolean;
  amcExpiry?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: CustomerType;
  machines: Machine[];
}

export interface ServiceItem {
  partId: string;
  quantity: number;
  cost: number;
}

export interface Ticket {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for display ease
  type: 'Installation' | 'Repair' | 'AMC Service';
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTechnicianId?: string;
  scheduledDate: string;
  completedDate?: string;
  itemsUsed: ServiceItem[];
  serviceCharge: number;
  totalAmount: number;
  paymentMode?: PaymentMode;
  technicianNotes?: string;
  nextFollowUp?: string;
}

export interface AssignmentHistory {
  id: number;
  ticketId: string;
  technicianId: string;
  assignedAt: string;
  scheduledDate: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  nextFollowUp?: string;
  estimateValue?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional on frontend, mandatory on creation
  role: Role;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}
