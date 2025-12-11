
import { Ticket, Customer, Lead, Part, Machine, LeadStatus, AssignmentHistory, MachineType, User, AmcExpiry, LeadHistory } from './types';
import { MOCK_TICKETS, MOCK_CUSTOMERS, MOCK_LEADS, MOCK_PARTS } from './constants';

const API_URL = 'http://localhost:3001/api';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `API Error: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (url.includes('login')) throw err; // Don't mock login failures
    console.warn(`Server unreachable (${url}). Using Mock Data fallback.`, err);
    throw err;
  }
};

export const api = {
  // --- Auth ---
  login: async (email, password) => {
    return await safeFetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
  },

  // --- Initialization ---
  fetchAllData: async () => {
    try {
      const data = await safeFetch(`${API_URL}/init`);
      return {
        tickets: data.tickets as Ticket[],
        customers: data.customers as Customer[],
        leads: data.leads as Lead[],
        parts: data.parts as Part[],
        machineTypes: (data.machineTypes || []) as MachineType[],
        users: (data.users || []) as User[],
        amcExpiries: (data.amcExpiries || []) as AmcExpiry[],
        isOffline: false
      };
    } catch (error) {
      // Fallback to Mock Data
      return {
        tickets: MOCK_TICKETS,
        customers: MOCK_CUSTOMERS,
        leads: MOCK_LEADS,
        parts: MOCK_PARTS,
        machineTypes: [],
        users: [],
        amcExpiries: [],
        isOffline: true
      };
    }
  },

  // --- Tickets ---
  createTicket: async (ticket: Ticket) => {
    return await safeFetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
  },

  updateTicket: async (ticket: Ticket) => {
    return await safeFetch(`${API_URL}/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
  },

  getTicketHistory: async (ticketId: string): Promise<AssignmentHistory[]> => {
      try {
          return await safeFetch(`${API_URL}/tickets/${ticketId}/history`);
      } catch (e) {
          console.warn("Failed to fetch history, returning empty array");
          return [];
      }
  },

  // --- Customers ---
  createCustomer: async (customer: Customer) => {
    return await safeFetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
  },

  addMachine: async (customerId: string, machine: Machine) => {
    return await safeFetch(`${API_URL}/machines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, ...machine }),
    });
  },

  updateMachine: async (machineId: string | number, machine: Machine) => {
      return await safeFetch(`${API_URL}/machines/${machineId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(machine),
      });
  },

  deleteMachine: async (machineId: string | number) => {
      return await safeFetch(`${API_URL}/machines/${machineId}`, {
          method: 'DELETE',
      });
  },

  // --- Leads ---
  createLead: async (lead: Lead) => {
    return await safeFetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    return await safeFetch(`${API_URL}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },

  deleteLead: async (id: string) => {
      return await safeFetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
  },

  getLeadHistory: async (id: string): Promise<LeadHistory[]> => {
      return await safeFetch(`${API_URL}/leads/${id}/history`);
  },

  convertLeadToCustomer: async (id: string) => {
      return await safeFetch(`${API_URL}/leads/${id}/convert`, { method: 'POST' });
  },

  // --- Parts ---
  createPart: async (part: Part) => {
    return await safeFetch(`${API_URL}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(part),
    });
  },
  
  updatePart: async (part: Part) => {
    return await safeFetch(`${API_URL}/parts/${part.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(part),
    });
  },

  // --- Machine Types ---
  createMachineType: async (machineType: MachineType) => {
    return await safeFetch(`${API_URL}/machine-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(machineType),
    });
  },

  // --- Users ---
  createUser: async (user: User) => {
    return await safeFetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  },
  
  updateUser: async (id: string, updates: Partial<User>) => {
    return await safeFetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
  },

  deleteUser: async (id: string) => {
    return await safeFetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
    });
  }
};
