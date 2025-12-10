import React, { useState, useEffect } from 'react';
import { USERS, MOCK_TICKETS, PARTS_MASTER, MOCK_CUSTOMERS, MOCK_LEADS } from './constants';
import { Ticket, User, Role, TicketStatus, Lead, LeadStatus, Customer, Machine } from './types';
import { Dashboard } from './components/Dashboard';
import { TicketBoard } from './components/TicketBoard';
import { TechnicianView } from './components/TechnicianView';
import { SalesFlow } from './components/SalesFlow';
import { CustomerMaster } from './components/CustomerMaster';
import { LayoutDashboard, Ticket as TicketIcon, Users, ShoppingCart, Wrench } from 'lucide-react';

const App: React.FC = () => {
  // Global State (Mocking a database)
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); // Default Admin
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'sales' | 'technician' | 'customers'>('dashboard');

  // Technician users helper
  const technicians = USERS.filter(u => u.role === Role.TECHNICIAN);

  // Handlers
  const handleAssignTicket = (ticketId: string, techId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assignedTechnicianId: techId, status: TicketStatus.ASSIGNED } : t));
  };

  const handleCreateTicket = (ticket: Partial<Ticket>) => {
    const newTicketObj: Ticket = {
      id: `t${Date.now()}`,
      itemsUsed: [],
      serviceCharge: 0,
      totalAmount: 0,
      status: TicketStatus.PENDING,
      ...ticket
    } as Ticket;
    setTickets([...tickets, newTicketObj]);
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const handleAddLead = (lead: Lead) => {
    setLeads([...leads, lead]);
  };

  const handleUpdateLeadStatus = (id: string, status: LeadStatus, extraData: Partial<Lead> = {}) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, ...extraData } : l));
  };

  const handleAddCustomer = (customer: Customer) => {
    setCustomers([...customers, customer]);
  };

  const handleAddMachine = (customerId: string, machine: Machine) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, machines: [...c.machines, machine] };
      }
      return c;
    }));
  };

  // Effect to handle Role Switching automatically for demo purposes
  useEffect(() => {
    if (currentUser.role === Role.TECHNICIAN) {
      setActiveTab('technician');
    } else if (activeTab === 'technician') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-red-500">Sai<span className="text-white text-lg font-normal ml-2">Tech</span></h1>
          <p className="text-xs text-slate-400 mt-1">Guru Technologies ERP</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {currentUser.role !== Role.TECHNICIAN && (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <LayoutDashboard size={20} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('tickets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tickets' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <TicketIcon size={20} /> Service Tickets
              </button>
              <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'sales' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <ShoppingCart size={20} /> Sales Pipeline
              </button>
              <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Users size={20} /> Customers
              </button>
            </>
          )}
          
          {currentUser.role === Role.TECHNICIAN && (
             <button onClick={() => setActiveTab('technician')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'technician' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
             <Wrench size={20} /> My Work
           </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        
        {/* Mobile Header / Top Bar for Role Switching */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="md:hidden font-bold text-gray-800">GuruTech ERP</div>
          
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-500 hidden md:inline">Viewing as:</span>
            <select 
              className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
              value={currentUser.id}
              onChange={(e) => setCurrentUser(USERS.find(u => u.id === e.target.value) || USERS[0])}
            >
              {USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </header>

        {/* Content Area */}
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard tickets={tickets} />}
          {activeTab === 'tickets' && (
            <TicketBoard 
              tickets={tickets} 
              technicians={technicians} 
              onAssign={handleAssignTicket} 
              onCreateTicket={handleCreateTicket}
            />
          )}
          {activeTab === 'technician' && (
            <TechnicianView 
              tickets={tickets} 
              parts={PARTS_MASTER} 
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
               onAddCustomer={handleAddCustomer}
               onAddMachine={handleAddMachine}
             />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;