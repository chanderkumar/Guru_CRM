
import React, { useState, useEffect } from 'react';
import { USERS } from './constants';
import { Ticket, User, Role, TicketStatus, Lead, LeadStatus, Customer, Machine, Part } from './types';
import { Dashboard } from './components/Dashboard';
import { TicketBoard } from './components/TicketBoard';
import { TechnicianView } from './components/TechnicianView';
import { SalesFlow } from './components/SalesFlow';
import { CustomerMaster } from './components/CustomerMaster';
import { PartsMaster } from './components/PartsMaster';
import { LayoutDashboard, Ticket as TicketIcon, Users, ShoppingCart, Wrench, Package, Menu, Database, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from './api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  
  // State for Data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'sales' | 'technician' | 'customers' | 'parts'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await api.fetchAllData();
    setTickets(data.tickets);
    setCustomers(data.customers);
    setLeads(data.leads);
    setParts(data.parts);
    setIsOfflineMode(data.isOffline);
    setIsLoading(false);
  };

  // Technician users helper
  const technicians = USERS.filter(u => u.role === Role.TECHNICIAN);

  // --- Handlers (Now Async with Error Handling) ---

  const handleAssignTicket = async (ticketId: string, techId: string) => {
    const previousTickets = [...tickets];
    const updatedTicket = tickets.find(t => t.id === ticketId);
    if (!updatedTicket) return;
    
    const newTicket = { ...updatedTicket, assignedTechnicianId: techId, status: TicketStatus.ASSIGNED };
    
    // Optimistic Update
    setTickets(prev => prev.map(t => t.id === ticketId ? newTicket : t));
    
    try {
      if (!isOfflineMode) await api.updateTicket(newTicket);
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      alert("Failed to assign ticket on server. Reverting changes.");
      setTickets(previousTickets);
    }
  };

  const handleCreateTicket = async (ticket: Partial<Ticket>) => {
    const previousTickets = [...tickets];
    const newTicketObj: Ticket = {
      id: `t${Date.now()}`,
      itemsUsed: [],
      serviceCharge: 0,
      totalAmount: 0,
      status: TicketStatus.PENDING,
      ...ticket
    } as Ticket;
    
    setTickets([...tickets, newTicketObj]);
    
    try {
      if (!isOfflineMode) await api.createTicket(newTicketObj);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert("Failed to create ticket on server. Please try again.");
      setTickets(previousTickets);
    }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    const previousTickets = [...tickets];
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    
    try {
      if (!isOfflineMode) await api.updateTicket(updatedTicket);
    } catch (error) {
      console.error("Failed to update ticket:", error);
      alert("Failed to save ticket update. Reverting changes.");
      setTickets(previousTickets);
    }
  };

  const handleAddLead = async (lead: Lead) => {
    const previousLeads = [...leads];
    setLeads([...leads, lead]);
    
    try {
      if (!isOfflineMode) await api.createLead(lead);
    } catch (error) {
      console.error("Failed to add lead:", error);
      alert("Failed to save lead to server. Please try again.");
      setLeads(previousLeads);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: LeadStatus, extraData: Partial<Lead> = {}) => {
    const previousLeads = [...leads];
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, ...extraData } : l));
    
    try {
      if (!isOfflineMode) await api.updateLeadStatus(id, status, extraData);
    } catch (error) {
      console.error("Failed to update lead status:", error);
      alert("Failed to update lead status on server. Reverting.");
      setLeads(previousLeads);
    }
  };

  const handleAddCustomer = async (customer: Customer) => {
    const previousCustomers = [...customers];
    setCustomers([...customers, customer]);
    
    try {
      if (!isOfflineMode) await api.createCustomer(customer);
    } catch (error) {
      console.error("Failed to add customer:", error);
      alert("Failed to save customer to server. Please try again.");
      setCustomers(previousCustomers);
    }
  };

  const handleAddMachine = async (customerId: string, machine: Machine) => {
    const previousCustomers = [...customers];
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, machines: [...c.machines, machine] };
      }
      return c;
    }));
    
    try {
      if (!isOfflineMode) await api.addMachine(customerId, machine);
    } catch (error) {
      console.error("Failed to add machine:", error);
      alert("Failed to save machine details. Reverting.");
      setCustomers(previousCustomers);
    }
  };
  
  const handleAddPart = async (part: Part) => {
    const previousParts = [...parts];
    setParts([...parts, part]);
    
    try {
      if (!isOfflineMode) await api.createPart(part);
    } catch (error) {
      console.error("Failed to add part:", error);
      alert("Failed to save part to server. Please try again.");
      setParts(previousParts);
    }
  };

  useEffect(() => {
    if (currentUser.role === Role.TECHNICIAN) {
      setActiveTab('technician');
    } else if (activeTab === 'technician') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  const navigate = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  }

  const renderSidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-red-500">Guru<span className="text-white text-lg font-normal ml-2">CRM</span></h1>
        <p className="text-xs text-slate-400 mt-1">Guru Technologies ERP</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {currentUser.role !== Role.TECHNICIAN && (
          <>
            <button onClick={() => navigate('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => navigate('tickets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tickets' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <TicketIcon size={20} /> Service Tickets
            </button>
            <button onClick={() => navigate('sales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'sales' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <ShoppingCart size={20} /> Sales Pipeline
            </button>
            <button onClick={() => navigate('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Users size={20} /> Customers
            </button>
             <button onClick={() => navigate('parts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'parts' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Package size={20} /> Parts Master
            </button>
          </>
        )}
        
        {currentUser.role === Role.TECHNICIAN && (
           <button onClick={() => navigate('technician')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'technician' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
           <Wrench size={20} /> My Work
         </button>
        )}
      </nav>
      
      {/* Server Status Indicator */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-2 text-xs">
          <Database size={14} className={isOfflineMode ? "text-orange-500" : "text-green-500"} />
          <span className="text-slate-300">
            {isOfflineMode ? "Running in Mock Mode" : "Connected to SQL DB"}
          </span>
        </div>
        {isOfflineMode && (
          <button onClick={loadData} className="mt-2 text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300">
            <RefreshCw size={12} /> Retry Connection
          </button>
        )}
      </div>

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
    </>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Loading ERP System...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Static for large screens */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full z-20">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar - Mobile slide-in */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col z-40 transition-transform transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        {renderSidebarContent()}
      </aside>


      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        
        {/* Top Bar with Role Switching and Mobile Menu */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <button className="md:hidden text-gray-600" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="md:hidden font-bold text-gray-800">GuruTech ERP</div>
          
          <div className="flex items-center gap-4 ml-auto">
            {isOfflineMode && (
               <div className="hidden sm:flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                 <AlertCircle size={14} /> Server Offline - Changes will not be saved
               </div>
            )}
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
              customers={customers}
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
               onAddCustomer={handleAddCustomer}
               onAddMachine={handleAddMachine}
             />
          )}
          {activeTab === 'parts' && (
             <PartsMaster 
               parts={parts} 
               onAddPart={handleAddPart}
             />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
