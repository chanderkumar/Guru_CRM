
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
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { LayoutDashboard, Ticket as TicketIcon, Users, ShoppingCart, Wrench, Package, Menu, Database, AlertCircle, RefreshCw, Monitor, X, Shield, LogOut } from 'lucide-react';
import { api } from './api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Application State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Technicians (Derived from users state)
  const technicians = users.filter(u => u.role === Role.TECHNICIAN);

  // --- Data Loading ---
  useEffect(() => {
    // Check local session (mock) - In real app, check cookie/token
    const storedUser = localStorage.getItem('guru_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
    } else {
        setIsLoading(false); // Stop loading to show login
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchAllData();
      setTickets(data.tickets);
      setCustomers(data.customers);
      setLeads(data.leads);
      setParts(data.parts);
      setMachineTypes(data.machineTypes);
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
      }
      setIsOffline(data.isOffline);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('guru_user', JSON.stringify(user));
      setActiveTab(user.role === Role.TECHNICIAN ? 'technician' : 'dashboard');
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('guru_user');
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
    setTickets(prev => [newTicket, ...prev]);
    try { await api.createTicket(newTicket); } 
    catch (error) { alert("Failed. Reverting."); setTickets(prev => prev.filter(t => t.id !== newTicket.id)); }
  };

  const handleAssignTicket = async (ticketId: string, techId: string, scheduledDate: string) => {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) return;
    const oldTicket = tickets[ticketIndex];
    const updatedTicket = { ...oldTicket, status: TicketStatus.ASSIGNED, assignedTechnicianId: techId, scheduledDate };
    setTickets(prev => { const n = [...prev]; n[ticketIndex] = updatedTicket; return n; });
    try { await api.updateTicket(updatedTicket); } 
    catch (error) { alert("Failed. Reverting."); setTickets(prev => { const n = [...prev]; n[ticketIndex] = oldTicket; return n; }); }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    const ticketIndex = tickets.findIndex(t => t.id === updatedTicket.id);
    const oldTicket = tickets[ticketIndex];
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    try { await api.updateTicket(updatedTicket); } 
    catch (error) { alert("Failed. Reverting."); setTickets(prev => { const n = [...prev]; n[ticketIndex] = oldTicket; return n; }); }
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    try { await api.createCustomer(newCustomer); } 
    catch (error) { alert("Failed. Reverting."); setCustomers(prev => prev.filter(c => c.id !== newCustomer.id)); }
  };

  const handleAddMachine = async (customerId: string, machine: Machine) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, machines: [...c.machines, machine] } : c));
    try { await api.addMachine(customerId, machine); } 
    catch (error) { alert("Failed. Reverting."); loadData(); }
  };

  const handleAddLead = async (lead: Lead) => {
    setLeads(prev => [...prev, lead]);
    try { await api.createLead(lead); } 
    catch (error) { alert("Failed. Reverting."); setLeads(prev => prev.filter(l => l.id !== lead.id)); }
  };

  const handleUpdateLeadStatus = async (id: string, status: LeadStatus, extraData?: Partial<Lead>) => {
    const leadIndex = leads.findIndex(l => l.id === id);
    const oldLead = leads[leadIndex];
    const updatedLead = { ...oldLead, status, ...extraData };
    setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
    try { await api.updateLeadStatus(id, status, extraData); } 
    catch (error) { alert("Failed. Reverting."); setLeads(prev => { const n = [...prev]; n[leadIndex] = oldLead; return n; }); }
  };

  const handleAddPart = async (part: Part) => {
    setParts(prev => [...prev, part]);
    try { await api.createPart(part); } 
    catch (error) { alert("Failed. Reverting."); setParts(prev => prev.filter(p => p.id !== part.id)); }
  };

  const handleAddMachineType = async (type: MachineType) => {
      setMachineTypes(prev => [...prev, type]);
      try { await api.createMachineType(type); } 
      catch (error) { alert("Failed. Reverting."); setMachineTypes(prev => prev.filter(m => m.id !== type.id)); }
  };

  // --- User Management Handlers ---
  const handleAddUser = async (user: User) => {
      setUsers(prev => [...prev, user]);
      try { await api.createUser(user); } 
      catch (error) { alert("Failed to save user."); setUsers(prev => prev.filter(u => u.id !== user.id)); }
  };
  
  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
      const idx = users.findIndex(u => u.id === id);
      const oldUser = users[idx];
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      try { await api.updateUser(id, updates); }
      catch (e) { alert("Failed update"); setUsers(prev => { const n = [...prev]; n[idx] = oldUser; return n; }); }
  };

  const handleDeleteUser = async (id: string) => {
      const oldUsers = [...users];
      setUsers(prev => prev.filter(u => u.id !== id));
      try { await api.deleteUser(id); }
      catch (e) { alert("Failed delete. " + e.message); setUsers(oldUsers); }
  }


  // --- Render ---

  if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'tickets', label: 'Service Tickets', icon: TicketIcon, role: [Role.ADMIN, Role.MANAGER, Role.TECHNICIAN] },
    { id: 'sales', label: 'Sales Pipeline', icon: Users, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'customers', label: 'Customer Master', icon: Database, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'parts', label: 'Parts Master', icon: Package, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'machines', label: 'Machine Master', icon: Monitor, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'users', label: 'User Management', icon: Shield, role: [Role.ADMIN] },
    { id: 'technician', label: 'Technician View', icon: Wrench, role: [Role.TECHNICIAN] },
  ];

  const visibleNavItems = navItems.filter(item => item.role.includes(currentUser!.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20 relative">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <Menu className="cursor-pointer" onClick={() => setSidebarOpen(true)} />
          <span>GuruTech ERP</span>
        </div>
        <div className="flex items-center gap-2">
            {isOffline && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle size={12}/> Offline</span>}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name.charAt(0)}
            </div>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">GuruTech ERP</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={20} /></button>
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

        <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-700">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
                {currentUser?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">{currentUser?.role}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm transition">
               <LogOut size={16} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-[calc(100vh-60px)] md:h-screen overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
            {isOffline && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Offline Mode: </strong>
                    <span className="block sm:inline">Cannot connect to server. Using local mock data. Changes will not be saved.</span>
                </div>
            )}

          {activeTab === 'dashboard' && <Dashboard tickets={tickets} />}
          {activeTab === 'tickets' && <TicketBoard tickets={tickets} technicians={technicians} customers={customers} onAssign={handleAssignTicket} onCreateTicket={handleCreateTicket} onAddCustomer={handleAddCustomer} />}
          {activeTab === 'technician' && <TechnicianView tickets={tickets} parts={parts} onUpdateTicket={handleUpdateTicket} currentUserId={currentUser!.id} />}
          {activeTab === 'sales' && <SalesFlow leads={leads} onAddLead={handleAddLead} onUpdateStatus={handleUpdateLeadStatus} />}
          {activeTab === 'customers' && <CustomerMaster customers={customers} tickets={tickets} machineTypes={machineTypes} onAddCustomer={handleAddCustomer} onAddMachine={handleAddMachine} onCreateTicket={handleCreateTicket} />}
          {activeTab === 'parts' && <PartsMaster parts={parts} onAddPart={handleAddPart} />}
          {activeTab === 'machines' && <MachineMaster machineTypes={machineTypes} onAddMachineType={handleAddMachineType} />}
          {activeTab === 'users' && <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;
