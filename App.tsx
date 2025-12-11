import React, { useState, useEffect } from 'react';
import { USERS } from './constants';
import { Ticket, User, Role, TicketStatus, Lead, LeadStatus, Customer, Machine, Part, MachineType, TicketPriority } from './types';
import { Dashboard } from './components/Dashboard';
import { TicketBoard } from './components/TicketBoard';
import { TechnicianView } from './components/TechnicianView';
import { SalesFlow } from './components/SalesFlow';
import { CustomerMaster } from './components/CustomerMaster';
import { PartsMaster } from './components/PartsMaster';
import { MachineMaster } from './components/MachineMaster';
import { LayoutDashboard, Ticket as TicketIcon, Users, ShoppingCart, Wrench, Package, Menu, Database, AlertCircle, RefreshCw, Monitor, X } from 'lucide-react';
import { api } from './api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); // Default Admin
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Application State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);

  // Technicians (Mock Users)
  const technicians = USERS.filter(u => u.role === Role.TECHNICIAN);

  // --- Data Loading ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchAllData();
      setTickets(data.tickets);
      setCustomers(data.customers);
      setLeads(data.leads);
      setParts(data.parts);
      setMachineTypes(data.machineTypes);
      setIsOffline(data.isOffline);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---

  const handleCreateTicket = async (ticketData: Partial<Ticket>) => {
    const newTicket: Ticket = {
      id: `t${Date.now()}`,
      customerId: ticketData.customerId!,
      customerName: ticketData.customerName!,
      type: ticketData.type || 'Repair',
      description: ticketData.description || '',
      priority: ticketData.priority || TicketPriority.MEDIUM,
      status: TicketStatus.PENDING,
      scheduledDate: ticketData.scheduledDate || new Date().toISOString().split('T')[0],
      itemsUsed: [],
      serviceCharge: 0,
      totalAmount: 0,
      technicianNotes: '',
      paymentMode: undefined,
    };

    // Optimistic Update
    setTickets(prev => [newTicket, ...prev]);

    try {
      await api.createTicket(newTicket);
    } catch (error) {
      alert("Failed to create ticket on server. Reverting.");
      setTickets(prev => prev.filter(t => t.id !== newTicket.id));
    }
  };

  const handleAssignTicket = async (ticketId: string, techId: string, scheduledDate: string) => {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) return;

    const oldTicket = tickets[ticketIndex];
    const updatedTicket = { 
        ...oldTicket, 
        status: TicketStatus.ASSIGNED, 
        assignedTechnicianId: techId,
        scheduledDate: scheduledDate 
    };

    setTickets(prev => {
      const newTickets = [...prev];
      newTickets[ticketIndex] = updatedTicket;
      return newTickets;
    });

    try {
      await api.updateTicket(updatedTicket);
    } catch (error) {
      alert("Failed to assign ticket on server. Reverting.");
      setTickets(prev => {
        const reverted = [...prev];
        reverted[ticketIndex] = oldTicket;
        return reverted;
      });
    }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    const ticketIndex = tickets.findIndex(t => t.id === updatedTicket.id);
    const oldTicket = tickets[ticketIndex];

    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

    try {
      await api.updateTicket(updatedTicket);
    } catch (error) {
      alert("Failed to update ticket on server. Reverting.");
      setTickets(prev => {
          const reverted = [...prev];
          reverted[ticketIndex] = oldTicket;
          return reverted;
      });
    }
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    try {
      await api.createCustomer(newCustomer);
    } catch (error) {
      alert("Failed to save customer. Reverting.");
      setCustomers(prev => prev.filter(c => c.id !== newCustomer.id));
    }
  };

  const handleAddMachine = async (customerId: string, machine: Machine) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, machines: [...c.machines, machine] };
      }
      return c;
    }));
    
    try {
      await api.addMachine(customerId, machine);
    } catch (error) {
      alert("Failed to add machine. Reverting.");
      loadData(); // Reload to sync
    }
  };

  const handleAddLead = async (lead: Lead) => {
    setLeads(prev => [...prev, lead]);
    try {
      await api.createLead(lead);
    } catch (error) {
      alert("Failed to save lead. Reverting.");
      setLeads(prev => prev.filter(l => l.id !== lead.id));
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: LeadStatus, extraData?: Partial<Lead>) => {
    const leadIndex = leads.findIndex(l => l.id === id);
    const oldLead = leads[leadIndex];
    
    const updatedLead = { ...oldLead, status, ...extraData };
    setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));

    try {
      await api.updateLeadStatus(id, status, extraData);
    } catch (error) {
      alert("Failed to update lead. Reverting.");
      setLeads(prev => {
          const reverted = [...prev];
          reverted[leadIndex] = oldLead;
          return reverted;
      });
    }
  };

  const handleAddPart = async (part: Part) => {
    setParts(prev => [...prev, part]);
    try {
      await api.createPart(part);
    } catch (error) {
      alert("Failed to save part. Reverting.");
      setParts(prev => prev.filter(p => p.id !== part.id));
    }
  };

  const handleAddMachineType = async (type: MachineType) => {
      setMachineTypes(prev => [...prev, type]);
      try {
          await api.createMachineType(type);
      } catch (error) {
          alert("Failed to save machine type. Reverting.");
          setMachineTypes(prev => prev.filter(m => m.id !== type.id));
      }
  }

  // --- Navigation Items ---
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'tickets', label: 'Service Tickets', icon: TicketIcon, role: [Role.ADMIN, Role.MANAGER, Role.TECHNICIAN] },
    { id: 'sales', label: 'Sales Pipeline', icon: Users, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'customers', label: 'Customer Master', icon: Database, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'parts', label: 'Parts Master', icon: Package, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'machines', label: 'Machine Master', icon: Monitor, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'technician', label: 'Technician View', icon: Wrench, role: [Role.TECHNICIAN] },
  ];

  const visibleNavItems = navItems.filter(item => item.role.includes(currentUser.role));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20 relative">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <Menu className="cursor-pointer" onClick={() => setSidebarOpen(true)} />
          <span>GuruTech ERP</span>
        </div>
        <div className="flex items-center gap-2">
            {isOffline && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle size={12}/> Offline Mode</span>}
             <select 
              className="text-xs bg-gray-100 border-none rounded p-1"
              value={currentUser.id}
              onChange={(e) => {
                const user = USERS.find(u => u.id === e.target.value);
                if (user) {
                   setCurrentUser(user);
                   setActiveTab(user.role === Role.TECHNICIAN ? 'technician' : 'dashboard');
                }
              }}
            >
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">GuruTech ERP</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
             <X size={20} />
          </button>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 bg-slate-900">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-slate-400">{currentUser.role}</p>
              </div>
           </div>

           {/* User Switcher (For Demo) */}
           <label className="text-xs text-slate-500 block mb-1">Switch User (Demo):</label>
           <select 
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-300 outline-none"
            value={currentUser.id}
            onChange={(e) => {
              const user = USERS.find(u => u.id === e.target.value);
              if (user) {
                 setCurrentUser(user);
                 setActiveTab(user.role === Role.TECHNICIAN ? 'technician' : 'dashboard');
              }
            }}
          >
            {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-[calc(100vh-60px)] md:h-screen overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
            {isOffline && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Offline Mode: </strong>
                    <span className="block sm:inline">Cannot connect to server. Using local mock data. Changes will not be saved permanently.</span>
                </div>
            )}

          {activeTab === 'dashboard' && <Dashboard tickets={tickets} />}
          
          {activeTab === 'tickets' && (
            <TicketBoard 
              tickets={tickets} 
              technicians={technicians}
              customers={customers}
              onAssign={handleAssignTicket}
              onCreateTicket={handleCreateTicket}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {activeTab === 'technician' && (
            <TechnicianView 
              tickets={tickets} 
              parts={parts}
              onUpdateTicket={handleUpdateTicket}
              currentUserId={currentUser.id}
            />
          )}

          {activeTab === 'sales' && (
            <SalesFlow 
              leads={leads}
              onAddLead={handleAddLead}
              onUpdateStatus={handleUpdateLeadStatus}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerMaster 
              customers={customers}
              tickets={tickets}
              machineTypes={machineTypes}
              onAddCustomer={handleAddCustomer}
              onAddMachine={handleAddMachine}
              onCreateTicket={handleCreateTicket}
            />
          )}

          {activeTab === 'parts' && (
            <PartsMaster 
              parts={parts}
              onAddPart={handleAddPart}
            />
          )}

          {activeTab === 'machines' && (
              <MachineMaster
                machineTypes={machineTypes}
                onAddMachineType={handleAddMachineType}
              />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;