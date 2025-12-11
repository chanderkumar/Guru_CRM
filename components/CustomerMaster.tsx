
import React, { useState } from 'react';
import { Customer, CustomerType, Machine, Ticket, TicketPriority, TicketStatus, MachineType } from '../types';
import { Search, MapPin, Shield, Plus, Ticket as TicketIcon, Calendar, CheckCircle, X, Monitor, AlertCircle, PenTool, Trash2 } from 'lucide-react';

interface CustomerMasterProps {
  customers: Customer[];
  tickets: Ticket[];
  machineTypes: MachineType[];
  onAddCustomer: (customer: Customer) => void;
  onAddMachine: (customerId: string, machine: Machine) => void;
  onUpdateMachine: (customerId: string, machineId: string | number, machine: Machine) => void;
  onDeleteMachine: (customerId: string, machineId: string | number) => void;
  onCreateTicket: (ticket: Partial<Ticket>) => void;
}

export const CustomerMaster: React.FC<CustomerMasterProps> = ({ customers, tickets, machineTypes, onAddCustomer, onAddMachine, onUpdateMachine, onDeleteMachine, onCreateTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | CustomerType>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Modals State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [selectedCustomerIdForMachine, setSelectedCustomerIdForMachine] = useState<string | null>(null);
  const [editingMachineId, setEditingMachineId] = useState<string | number | null>(null);

  // New Customer State
  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    phone: string;
    address: string;
    type: CustomerType;
  }>({
    name: '',
    phone: '',
    address: '',
    type: CustomerType.GURU_INSTALLED
  });

  // New Machine State
  const [newMachineData, setNewMachineData] = useState<{
    modelNo: string;
    installationDate: string;
    warrantyExpiry: string;
    amcActive: boolean;
    amcExpiry: string;
  }>({
    modelNo: '',
    installationDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: '',
    amcActive: true,
    amcExpiry: ''
  });

  // Ticket Modal State
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedCustomerForTicket, setSelectedCustomerForTicket] = useState<Customer | null>(null);
  const [newTicketData, setNewTicketData] = useState({
      machineModelNo: '',
      type: 'Repair',
      priority: TicketPriority.MEDIUM,
      description: ''
  });


  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
    const matchesType = filterType === 'All' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer({
      id: `c${Date.now()}`,
      ...newCustomer,
      machines: []
    });
    setIsAddCustomerOpen(false);
    setNewCustomer({ name: '', phone: '', address: '', type: CustomerType.GURU_INSTALLED });
  };

  // --- Machine Logic ---
  const openAddMachineModal = (customerId: string) => {
      setSelectedCustomerIdForMachine(customerId);
      setEditingMachineId(null); // Reset editing mode
      const today = new Date().toISOString().split('T')[0];
      
      // Default to 1 year from today
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split('T')[0];

      setNewMachineData({
          modelNo: '',
          installationDate: today,
          warrantyExpiry: nextYearStr,
          amcActive: true,
          amcExpiry: nextYearStr
      });
      setIsAddMachineOpen(true);
  };

  const openEditMachineModal = (customerId: string, machine: Machine) => {
      setSelectedCustomerIdForMachine(customerId);
      setEditingMachineId(machine.id!); 
      setNewMachineData({
          modelNo: machine.modelNo,
          installationDate: machine.installationDate,
          warrantyExpiry: machine.warrantyExpiry,
          amcActive: machine.amcActive,
          amcExpiry: machine.amcExpiry || ''
      });
      setIsAddMachineOpen(true);
  };

  const handleDeleteMachine = (customerId: string, machineId: string | number) => {
      if (confirm('Are you sure you want to delete this machine? This cannot be undone.')) {
          onDeleteMachine(customerId, machineId);
      }
  };

  const handleMachineTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedModelName = e.target.value;
      const machineType = machineTypes.find(m => m.modelName === selectedModelName);
      
      const installDate = new Date(newMachineData.installationDate);
      let warrantyDateStr = '';
      
      if (machineType) {
          const wDate = new Date(installDate);
          wDate.setMonth(wDate.getMonth() + machineType.warrantyMonths);
          warrantyDateStr = wDate.toISOString().split('T')[0];
      }

      setNewMachineData(prev => ({
          ...prev,
          modelNo: selectedModelName,
          warrantyExpiry: warrantyDateStr || prev.warrantyExpiry
      }));
  };

  const handleAddMachineSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCustomerIdForMachine) return;
      
      const machineData: Machine = {
        modelNo: newMachineData.modelNo || 'Unknown Model',
        installationDate: newMachineData.installationDate,
        warrantyExpiry: newMachineData.warrantyExpiry,
        amcActive: newMachineData.amcActive,
        amcExpiry: newMachineData.amcActive ? newMachineData.amcExpiry : undefined,
      };
      
      if (editingMachineId) {
          onUpdateMachine(selectedCustomerIdForMachine, editingMachineId, machineData);
      } else {
          onAddMachine(selectedCustomerIdForMachine, machineData);
      }
      setIsAddMachineOpen(false);
  };

  // --- Ticket Logic ---
  const openTicketModal = (customer: Customer) => {
      setSelectedCustomerForTicket(customer);
      setNewTicketData({
          machineModelNo: customer.machines.length > 0 ? customer.machines[0].modelNo : '',
          type: 'Repair',
          priority: TicketPriority.MEDIUM,
          description: ''
      });
      setTicketModalOpen(true);
  }

  const handleTicketSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCustomerForTicket) return;

      onCreateTicket({
          customerId: selectedCustomerForTicket.id,
          customerName: selectedCustomerForTicket.name,
          ...newTicketData as any,
          scheduledDate: new Date().toISOString().split('T')[0]
      });
      setTicketModalOpen(false);
      setSelectedCustomerForTicket(null);
  }

  const getCustomerTickets = (customerId: string) => {
      return tickets.filter(t => t.customerId === customerId)
                    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer & Machine Master</h2>
          <p className="text-gray-500">Manage customer profiles and machine warranty/AMC details.</p>
        </div>
        <button 
          onClick={() => setIsAddCustomerOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name or Phone..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', CustomerType.GURU_INSTALLED, CustomerType.SERVICE_ONLY].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="grid gap-4">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                  customer.type === CustomerType.GURU_INSTALLED ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-500">
                    <span>{customer.phone}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1"><MapPin size={12}/> {customer.address}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded border ${
                  customer.type === CustomerType.GURU_INSTALLED 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {customer.type}
                </span>
              </div>
            </div>

            {/* Expanded Machine Details & Tickets */}
            {expandedId === customer.id && (
              <div className="bg-slate-50 p-4 border-t border-gray-100 animate-fade-in">
                
                {/* --- Machines Section --- */}
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Installed Machines</h4>
                    <button 
                        onClick={() => openAddMachineModal(customer.id)}
                        className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-2 py-1 rounded flex items-center gap-1"
                    >
                        <Monitor size={12}/> Add Machine
                    </button>
                </div>

                <div className="grid gap-3 mb-6">
                  {customer.machines.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No machines registered.</p>
                  ) : (
                    customer.machines.map((machine, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                <div>
                                    <span className="block text-xs text-gray-400">Model</span>
                                    <span className="font-medium text-gray-800">{machine.modelNo}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-400">Warranty Ends</span>
                                    <span className="font-medium text-gray-800">{machine.warrantyExpiry}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-400">AMC Status</span>
                                    {machine.amcActive ? (
                                        <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                                            <Shield size={12}/> Active (Exp: {machine.amcExpiry})
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">No AMC</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => openEditMachineModal(customer.id, machine)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit Machine"
                                >
                                    <PenTool size={14} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteMachine(customer.id, machine.id!)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Machine"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                  )}
                </div>

                {/* --- Service History Section --- */}
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Service History</h4>
                    <button 
                        onClick={() => openTicketModal(customer)}
                        className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded flex items-center gap-1 transition"
                    >
                        <TicketIcon size={12}/> Raise Ticket
                    </button>
                </div>

                <div className="space-y-2">
                    {getCustomerTickets(customer.id).length === 0 ? (
                         <p className="text-sm text-gray-500 italic">No service history found.</p>
                    ) : (
                        getCustomerTickets(customer.id).map(ticket => (
                            <div key={ticket.id} className="bg-white p-3 rounded border border-gray-100 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            ticket.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>{ticket.status}</span>
                                        <span className="text-xs font-medium text-gray-700">{ticket.type}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate max-w-xs">{ticket.description}</p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <p>{ticket.scheduledDate}</p>
                                    {ticket.assignedTechnicianId && <p className="text-blue-600">Tech Assigned</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

              </div>
            )}
          </div>
        ))}
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500">No customers found matching your search.</p>
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea required className="w-full border rounded p-2 mt-1" rows={2} value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="w-full border rounded p-2 mt-1" value={newCustomer.type} onChange={e => setNewCustomer({...newCustomer, type: e.target.value as CustomerType})}>
                  <option value={CustomerType.GURU_INSTALLED}>{CustomerType.GURU_INSTALLED}</option>
                  <option value={CustomerType.SERVICE_ONLY}>{CustomerType.SERVICE_ONLY}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsAddCustomerOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Machine Modal */}
      {isAddMachineOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold mb-4">{editingMachineId ? 'Edit Machine Details' : 'Add New Machine'}</h3>
                  <form onSubmit={handleAddMachineSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Machine Model</label>
                          <select 
                            required 
                            className="w-full border rounded p-2 mt-1"
                            value={newMachineData.modelNo}
                            onChange={handleMachineTypeSelect}
                          >
                            <option value="">Select Model</option>
                            {machineTypes.map(m => <option key={m.id} value={m.modelName}>{m.modelName}</option>)}
                            <option value="Other">Other / Custom</option>
                          </select>
                          {newMachineData.modelNo === 'Other' && (
                             <input 
                                type="text" 
                                className="w-full border rounded p-2 mt-2" 
                                placeholder="Enter Model Name"
                                onChange={e => setNewMachineData({...newMachineData, modelNo: e.target.value})}
                             />
                          )}
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Installation Date</label>
                          <input type="date" required className="w-full border rounded p-2 mt-1" value={newMachineData.installationDate} onChange={e => setNewMachineData({...newMachineData, installationDate: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Warranty Expiry</label>
                          <input type="date" required className="w-full border rounded p-2 mt-1" value={newMachineData.warrantyExpiry} onChange={e => setNewMachineData({...newMachineData, warrantyExpiry: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" id="amcActive" checked={newMachineData.amcActive} onChange={e => setNewMachineData({...newMachineData, amcActive: e.target.checked})} />
                          <label htmlFor="amcActive" className="text-sm font-medium text-gray-700">Under AMC?</label>
                      </div>
                      {newMachineData.amcActive && (
                          <div>
                              <label className="block text-sm font-medium text-gray-700">AMC Expiry Date</label>
                              <input type="date" required className="w-full border rounded p-2 mt-1" value={newMachineData.amcExpiry} onChange={e => setNewMachineData({...newMachineData, amcExpiry: e.target.value})} />
                          </div>
                      )}
                      <div className="flex justify-end gap-2 mt-6">
                          <button type="button" onClick={() => setIsAddMachineOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                              {editingMachineId ? 'Update Machine' : 'Add Machine'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Create Ticket Modal (From Customer Page) */}
      {ticketModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold mb-4">Raise Ticket: {selectedCustomerForTicket?.name}</h3>
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Machine</label>
                          <select className="w-full border rounded p-2 mt-1" value={newTicketData.machineModelNo} onChange={e => setNewTicketData({...newTicketData, machineModelNo: e.target.value})}>
                             {selectedCustomerForTicket?.machines.map(m => (
                                 <option key={m.modelNo} value={m.modelNo}>{m.modelNo}</option>
                             ))}
                             <option value="">General / Other</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Service Type</label>
                          <select className="w-full border rounded p-2 mt-1" value={newTicketData.type} onChange={e => setNewTicketData({...newTicketData, type: e.target.value})}>
                              <option>Repair</option>
                              <option>AMC Service</option>
                              <option>Installation</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Priority</label>
                          <select className="w-full border rounded p-2 mt-1" value={newTicketData.priority} onChange={e => setNewTicketData({...newTicketData, priority: e.target.value as TicketPriority})}>
                              <option value={TicketPriority.MEDIUM}>Medium</option>
                              <option value={TicketPriority.HIGH}>High</option>
                              <option value={TicketPriority.URGENT}>Urgent</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea required className="w-full border rounded p-2 mt-1" rows={3} value={newTicketData.description} onChange={e => setNewTicketData({...newTicketData, description: e.target.value})} placeholder="Describe the issue..."></textarea>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                          <button type="button" onClick={() => setTicketModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Ticket</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
