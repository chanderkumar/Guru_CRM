import { Customer, CustomerType, Part, Role, Ticket, TicketPriority, TicketStatus, User, Lead, LeadStatus } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Admin User', role: Role.ADMIN },
  { id: 'u2', name: 'Ramesh Tech', role: Role.TECHNICIAN },
  { id: 'u3', name: 'Suresh Tech', role: Role.TECHNICIAN },
  { id: 'u4', name: 'Manager Boss', role: Role.MANAGER },
];

export const MOCK_PARTS: Part[] = [
  { id: 'p1', name: 'RO Membrane 100GPD', category: 'Filters', price: 1200, warrantyMonths: 12 },
  { id: 'p2', name: 'Sediment Filter', category: 'Filters', price: 350, warrantyMonths: 0 },
  { id: 'p3', name: 'Carbon Filter', category: 'Filters', price: 400, warrantyMonths: 0 },
  { id: 'p4', name: 'Booster Pump', category: 'Motors', price: 2500, warrantyMonths: 12 },
  { id: 'p5', name: 'UV Lamp', category: 'Electronics', price: 800, warrantyMonths: 6 },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Anitha Kumar',
    phone: '9876543210',
    address: '12, North St, Madurai',
    type: CustomerType.GURU_INSTALLED,
    machines: [
      {
        modelNo: 'GURU-RO-PRO',
        installationDate: '2023-05-15',
        warrantyExpiry: '2024-05-15',
        amcActive: true,
        amcExpiry: '2025-05-15'
      }
    ]
  },
  {
    id: 'c2',
    name: 'Hotel Saravana',
    phone: '9988776655',
    address: '45, Bypass Road, Madurai',
    type: CustomerType.SERVICE_ONLY,
    machines: [
      {
        modelNo: 'KENT-PEARL',
        installationDate: '2022-01-10',
        warrantyExpiry: '2023-01-10',
        amcActive: false
      }
    ]
  },
  {
    id: 'c3',
    name: 'Ravi Verma',
    phone: '9123456780',
    address: '88, Lake View, Madurai',
    type: CustomerType.GURU_INSTALLED,
    machines: [
      {
        modelNo: 'GURU-SLIM',
        installationDate: '2024-01-20',
        warrantyExpiry: '2025-01-20',
        amcActive: false
      }
    ]
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    customerId: 'c1',
    customerName: 'Anitha Kumar',
    type: 'AMC Service',
    description: 'Quarterly routine service',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.PENDING,
    scheduledDate: '2024-06-20',
    itemsUsed: [],
    serviceCharge: 0,
    totalAmount: 0
  },
  {
    id: 't2',
    customerId: 'c2',
    customerName: 'Hotel Saravana',
    type: 'Repair',
    description: 'Motor making loud noise',
    priority: TicketPriority.URGENT,
    status: TicketStatus.ASSIGNED,
    assignedTechnicianId: 'u2',
    scheduledDate: '2024-06-18',
    itemsUsed: [],
    serviceCharge: 0,
    totalAmount: 0
  },
  {
    id: 't3',
    customerId: 'c1',
    customerName: 'Anitha Kumar',
    type: 'Repair',
    description: 'Leakage from tap',
    priority: TicketPriority.HIGH,
    status: TicketStatus.COMPLETED,
    assignedTechnicianId: 'u3',
    scheduledDate: '2024-06-10',
    completedDate: '2024-06-10',
    itemsUsed: [{ partId: 'p2', quantity: 1, cost: 350 }],
    serviceCharge: 200,
    totalAmount: 550,
    technicianNotes: 'Replaced washer and filter',
    nextFollowUp: '2024-09-10'
  }
];

export const MOCK_LEADS: Lead[] = [
  { id: 'l1', name: 'New Resident A', phone: '1231231234', source: 'Referral', status: LeadStatus.NEW, notes: 'Interested in RO', createdAt: '2024-06-15' },
  { id: 'l2', name: 'Office B', phone: '3213214321', source: 'Web', status: LeadStatus.ESTIMATE, notes: 'Sent quote for commercial plant', createdAt: '2024-06-10', estimateValue: 15000 },
  { id: 'l3', name: 'Dr. Priya', phone: '9898989898', source: 'Walk-in', status: LeadStatus.FOLLOW_UP, notes: 'Call back next week', createdAt: '2024-06-12', nextFollowUp: '2024-06-25' },
];