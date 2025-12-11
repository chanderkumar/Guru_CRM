import React, { useState, useEffect } from 'react';
import { USERS } from './constants';
import { Ticket, User, Role, TicketStatus, Lead, LeadStatus, Customer, Machine, Part, MachineType, TicketPriority, AmcExpiry, GlobalSearchResult } from './types';
import { Dashboard } from './components/Dashboard';
import { TicketBoard } from './components/TicketBoard';
import { TechnicianView } from './components/TechnicianView';
import { SalesFlow } from './components/SalesFlow';
import { CustomerMaster } from './components/CustomerMaster';
import { PartsMaster } from './components/PartsMaster';
import { MachineMaster } from './components/MachineMaster';
import { UserManagement } from './components/UserManagement';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { LayoutDashboard, Ticket as TicketIcon, Users, ShoppingCart, Wrench, Package, Menu, Database, AlertCircle, RefreshCw, Monitor, X, Shield, LogOut, BarChart3, Search, Phone, History, MapPin } from 'lucide-react';
import { api } from './api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Search State
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<GlobalSearchResult | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Application State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [amcExpiries, setAmcExpiries] = useState<AmcExpiry[]>([]);

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
      if (data.amcExpiries) {
          setAmcExpiries(data.amcExpiries);
      }
      setIsOffline(data.isOffline);
    } catch (e) {
      console.error("Failed to load data", e);
      showToast("Failed to load data. Please check server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('guru_user', JSON.stringify(user));
      setActiveTab(user.role === Role.TECHNICIAN ? 'technician' : 'dashboard');
      showToast(`Welcome back, ${user.name}`, 'success');
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('guru_user');
  };
  
  const handleGlobalSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchPhone.trim()) return;
      try {
          const res = await api.searchByPhone(searchPhone);
          setSearchResult(res);
          setIsSearchModalOpen(true);
      } catch (e) {
          showToast("Search failed or no connection.", "error");
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
    setTickets(prev => [newTicket, ...prev]);
    try { 
        await api.createTicket(newTicket);
        showToast("Ticket created successfully", "success");
    } 
    catch (error) { 
        showToast("Failed to create ticket. Reverting.", "error"); 
        setTickets(prev => prev.filter(t => t.id !== newTicket.id)); 
    }
  };

  const handleAssignTicket = async (ticketId: string, techId: string, scheduledDate: string) => {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) return;
    const oldTicket = tickets[ticketIndex];
    const updatedTicket = { ...oldTicket, status: TicketStatus.ASSIGNED, assignedTechnicianId: techId, scheduledDate };
    setTickets(prev => { const n = [...prev]; n[ticketIndex] = updatedTicket; return n; });
    try { 
        await api.updateTicket(updatedTicket); 
        showToast("Ticket assigned successfully", "success");
    } 
    catch (error) { 
        showToast("Assignment failed. Reverting.", "error"); 
        setTickets(prev => { const n = [...prev]; n[ticketIndex] = oldTicket; return n; }); 
    }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    const ticketIndex = tickets.findIndex(t => t.id === updatedTicket.id);
    const oldTicket = tickets[ticketIndex];
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    try { 
        await api.updateTicket(updatedTicket); 
        // Reload parts stock if completed
        if (updatedTicket.status === TicketStatus.COMPLETED) {
            loadData(); 
            showToast("Ticket marked as completed!", "success");
        }
    } 
    catch (error) { 
        showToast("Failed to update ticket.", "error"); 
        setTickets(prev => { const n = [...prev]; n[ticketIndex] = oldTicket; return n; }); 
    }
  };

  const handleCancelTicket = async (ticketId: string, reason: string) => {
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex === -1) return;
      const oldTicket = tickets[ticketIndex];
      const updatedTicket = { 
          ...oldTicket, 
          status: TicketStatus.CANCELLED, 
          cancellationReason: reason 
      };
      
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      
      try {
          await api.updateTicket(updatedTicket);
          showToast("Ticket cancelled.", "info");
      } catch (error) {
          showToast("Failed to cancel ticket.", "error");
          setTickets(prev => { const n = [...prev]; n[ticketIndex] = oldTicket; return n; });
      }
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    try { 
        await api.createCustomer(newCustomer); 
        showToast("Customer added successfully", "success");
    } 
    catch (error: any) { 
        showToast(error.message || "Failed to add customer.", "error"); 
        setCustomers(prev => prev.filter(c => c.id !== newCustomer.id)); 
    }
  };

  const handleAddMachine = async (customerId: string, machine: Machine) => {
    try { 
        const res = await api.addMachine(customerId, machine); 
        if(res.success && res.id) {
            const machineWithId = { ...machine, id: res.id };
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, machines: [...c.machines, machineWithId] } : c));
            showToast("Machine added successfully", "success");
        }
    } 
    catch (error) { showToast("Failed to add machine.", "error"); }
  };

  const handleUpdateMachine = async (customerId: string, machineId: string | number, updatedMachine: Machine) => {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      const oldCustomers = [...customers];
      
      const newCustomers = [...customers];
      const customer = newCustomers[customerIndex];
      customer.machines = customer.machines.map(m => m.id === machineId ? { ...updatedMachine, id: machineId } : m);
      
      setCustomers(newCustomers);

      try {
          await api.updateMachine(machineId, updatedMachine);
          showToast("Machine updated", "success");
      } catch (e) {
          showToast("Failed to update machine.", "error");
          setCustomers(oldCustomers);
      }
  };

  const handleDeleteMachine = async (customerId: string, machineId: string | number) => {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      const oldCustomers = [...customers];

      const newCustomers = [...customers];
      const customer = newCustomers[customerIndex];
      customer.machines = customer.machines.filter(m => m.id !== machineId);

      setCustomers(newCustomers);

      try {
          await api.deleteMachine(machineId);
          showToast("Machine deleted", "info");
      } catch (e) {
          showToast("Failed to delete machine.", "error");
          setCustomers(oldCustomers);
      }
  }

  const handleAddLead = async (lead: Lead) => {
    setLeads(prev => [...prev, lead]);
    try { 
        await api.createLead(lead); 
        showToast("Lead created", "success");
    } 
    catch (error) { 
        showToast("Failed to create lead.", "error"); 
        setLeads(prev => prev.filter(l => l.id !== lead.id)); 
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    const leadIndex = leads.findIndex(l => l.id === id);
    const oldLead = leads[leadIndex];
    const updatedLead = { ...oldLead, ...updates };
    setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
    try { 
        await api.updateLead(id, updates); 
        showToast("Lead updated", "success");
    } 
    catch (error) { 
        showToast("Failed update.", "error"); 
        setLeads(prev => { const n = [...prev]; n[leadIndex] = oldLead; return n; }); 
    }
  };

  const handleDeleteLead = async (id: string) => {
      const oldLeads = [...leads];
      setLeads(prev => prev.filter(l => l.id !== id));
      try { 
          await api.deleteLead(id); 
          showToast("Lead deleted", "info");
      }
      catch (error) { 
          showToast("Failed to delete lead.", "error"); 
          setLeads(oldLeads); 
      }
  }

  const handleConvertLead = async (id: string, details: any) => {
      // This is primarily handled in SalesFlow but we refresh data here
      await loadData();
      showToast("Lead converted to Customer!", "success");
  }

  const handleAddPart = async (part: Part) => {
    setParts(prev => [...prev, part]);
    try { 
        await api.createPart(part); 
        showToast("Part added", "success");
    } 
    catch (error) { 
        showToast("Failed to add part.", "error"); 
        setParts(prev => prev.filter(p => p.id !== part.id)); 
    }
  };

  const handleUpdatePart = async (part: Part) => {
      const idx = parts.findIndex(p => p.id === part.id);
      const oldPart = parts[idx];
      setParts(prev => prev.map(p => p.id === part.id ? part : p));
      try { 
          await api.updatePart(part); 
          showToast("Part updated", "success");
      }
      catch (e) { 
          showToast("Failed to update part.", "error"); 
          setParts(prev => { const n = [...prev]; n[idx] = oldPart; return n; }); 
      }
  }

  const handleAddMachineType = async (type: MachineType) => {
      setMachineTypes(prev => [...prev, type]);
      try { 
          await api.createMachineType(type); 
          showToast("Machine model added", "success");
      } 
      catch (error) { 
          showToast("Failed.", "error"); 
          setMachineTypes(prev => prev.filter(m => m.id !== type.id)); 
      }
  };

  // --- User Management Handlers ---
  const handleAddUser = async (user: User) => {
      setUsers(prev => [...prev, user]);
      try { 
          await api.createUser(user); 
          showToast("User created", "success");
      } 
      catch (error: any) { 
          showToast(error.message || "Failed to save user.", "error"); 
          setUsers(prev => prev.filter(u => u.id !== user.id)); 
      }
  };
  
  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
      const idx = users.findIndex(u => u.id === id);
      const oldUser = users[idx];
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      try { 
          await api.updateUser(id, updates);
          showToast("User updated", "success");
      }
      catch (e: any) { 
          showToast(e.message || "Failed update", "error"); 
          setUsers(prev => { const n = [...prev]; n[idx] = oldUser; return n; }); 
      }
  };

  const handleDeleteUser = async (id: string) => {
      const oldUsers = [...users];
      setUsers(prev => prev.filter(u => u.id !== id));
      try { 
          await api.deleteUser(id); 
          showToast("User deleted", "info");
      }
      catch (e: any) { 
          showToast("Failed delete. " + e.message, "error"); 
          setUsers(oldUsers); 
      }
  }


  // --- Render ---

  if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'tickets', label: 'Service Tickets', icon: TicketIcon, role: [Role.ADMIN, Role.MANAGER, Role.TECHNICIAN] },
    { id: 'sales', label: 'Sales Pipeline', icon: Users, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'reports', label: 'Reports', icon: BarChart3, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'customers', label: 'Customer Master', icon: Database, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'parts', label: 'Parts Master', icon: Package, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'machines', label: 'Machine Master', icon: Monitor, role: [Role.ADMIN, Role.MANAGER] },
    { id: 'users', label: 'User Management', icon: Shield, role: [Role.ADMIN] },
    { id: 'technician', label: 'Technician View', icon: Wrench, role: [Role.TECHNICIAN] },
  ];

  const visibleNavItems = navItems.filter(item => item.role.includes(currentUser!.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20 relative">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <Menu className="cursor-pointer" onClick={() => setSidebarOpen(true)} />
          <span>GuruTech ERP</span>
        </div>
        <div className="flex items-center gap-2">
             <button onClick={() => setIsSearchModalOpen(true)} className="p-2 text-gray-500">
                 <Search size={20} />
             </button>
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
      <main className="flex-1 h-[calc(100vh-60px)] md:h-screen overflow-y-auto bg-gray-50 p-4 md:p-8 relative">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}
            </h2>
            <form onSubmit={handleGlobalSearch} className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Universal Search (Enter Phone Number)..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                />
            </form>
        </div>

        <div className="max-w-7xl mx-auto animate-fade-in">
            {isOffline && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Offline Mode: </strong>
                    <span className="block sm:inline">Cannot connect to server. Using local mock data. Changes will not be saved.</span>
                </div>
            )}

          {activeTab === 'dashboard' && <Dashboard tickets={tickets} amcExpiries={amcExpiries} onCreateTicket={handleCreateTicket} showToast={showToast} />}
          {activeTab === 'tickets' && <TicketBoard tickets={tickets} technicians={technicians} customers={customers} onAssign={handleAssignTicket} onCreateTicket={handleCreateTicket} onAddCustomer={handleAddCustomer} onCancelTicket={handleCancelTicket} showToast={showToast} />}
          {activeTab === 'technician' && <TechnicianView tickets={tickets} parts={parts} onUpdateTicket={handleUpdateTicket} onCancelTicket={handleCancelTicket} currentUserId={currentUser!.id} showToast={showToast} />}
          {activeTab === 'sales' && <SalesFlow leads={leads} onAddLead={handleAddLead} onUpdateLead={handleUpdateLead} onDeleteLead={handleDeleteLead} onConvertLead={handleConvertLead} machineTypes={machineTypes} showToast={showToast} />}
          {activeTab === 'reports' && <Reports tickets={tickets} />}
          {activeTab === 'customers' && (
            <CustomerMaster 
                customers={customers} 
                tickets={tickets} 
                machineTypes={machineTypes}
                onAddCustomer={handleAddCustomer}
                onAddMachine={handleAddMachine}
                onUpdateMachine={handleUpdateMachine}
                onDeleteMachine={handleDeleteMachine}
                onCreateTicket={handleCreateTicket}
                showToast={showToast}
            />
          )}
          {activeTab === 'parts' && <PartsMaster parts={parts} onAddPart={handleAddPart} onUpdatePart={handleUpdatePart} showToast={showToast} />}
          {activeTab === 'machines' && <MachineMaster machineTypes={machineTypes} onAddMachineType={handleAddMachineType} showToast={showToast} />}
          {activeTab === 'users' && <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} showToast={showToast} />}
        </div>
      </main>

      {/* Global Search Modal */}
      {isSearchModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                              <Phone size={24} />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold">Search Results</h3>
                              <p className="text-gray-500 text-sm">Query: {searchResult?.phone || searchPhone}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsSearchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>

                  {!searchResult || (searchResult.leads.length === 0 && searchResult.customers.length === 0 && searchResult.tickets.length === 0) ? (
                      <div className="text-center py-12 text-gray-500">
                          <p>No records found for this phone number.</p>
                      </div>
                  ) : (
                      <div className="space-y-8">
                          {/* Leads Section */}
                          {searchResult.leads.length > 0 && (
                              <div>
                                  <h4 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
                                      <Users size={16}/> Leads / Inquiries
                                  </h4>
                                  <div className="grid gap-3">
                                      {searchResult.leads.map(lead => (
                                          <div key={lead.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                              <div className="flex justify-between">
                                                  <span className="font-bold">{lead.name}</span>
                                                  <span className="text-xs font-bold bg-white px-2 py-1 rounded">{lead.status}</span>
                                              </div>
                                              <p className="text-sm text-gray-600 mt-1">{lead.notes}</p>
                                              <p className="text-xs text-gray-400 mt-2">Created: {lead.createdAt}</p>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* Customers Section */}
                          {searchResult.customers.length > 0 && (
                              <div>
                                  <h4 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
                                      <Database size={16}/> Customer Profiles
                                  </h4>
                                  <div className="grid gap-3">
                                      {searchResult.customers.map(cust => (
                                          <div key={cust.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                              <div className="flex justify-between">
                                                  <span className="font-bold text-lg">{cust.name}</span>
                                                  <span className="text-sm text-blue-700">{cust.type}</span>
                                              </div>
                                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><MapPin size={14}/> {cust.address}</p>
                                              
                                              {cust.machines && cust.machines.length > 0 && (
                                                  <div className="mt-3 bg-white p-2 rounded">
                                                      <p className="text-xs font-bold text-gray-500 uppercase">Machines</p>
                                                      {cust.machines.map((m, idx) => (
                                                          <div key={idx} className="text-sm flex justify-between mt-1">
                                                              <span>{m.modelNo}</span>
                                                              <span className={m.amcActive ? "text-green-600 font-bold" : "text-gray-400"}>{m.amcActive ? 'AMC Active' : 'No AMC'}</span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* Tickets Section */}
                          {searchResult.tickets.length > 0 && (
                              <div>
                                  <h4 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
                                      <TicketIcon size={16}/> Service History
                                  </h4>
                                  <div className="space-y-2">
                                      {searchResult.tickets.map(t => (
                                          <div key={t.id} className="bg-white p-3 border rounded flex justify-between items-center">
                                              <div>
                                                  <div className="flex items-center gap-2">
                                                      <span className="font-mono text-xs text-gray-400">#{t.id}</span>
                                                      <span className="font-bold text-sm">{t.type}</span>
                                                  </div>
                                                  <p className="text-sm text-gray-600">{t.description}</p>
                                              </div>
                                              <div className="text-right">
                                                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                      t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                  }`}>
                                                      {t.status}
                                                  </span>
                                                  <p className="text-xs text-gray-400 mt-1">{t.scheduledDate}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default App;