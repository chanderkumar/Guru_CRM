import React, { useState } from 'react';
import { Customer, Ticket, TicketPriority, TicketStatus, User, CustomerType } from '../types';
import { Calendar, User as UserIcon, AlertCircle, Plus, Building, Search } from 'lucide-react';

interface TicketBoardProps {
  tickets: Ticket[];
  technicians: User[];
  customers: Customer[];
  onAssign: (ticketId: string, techId: string) => void;
  onCreateTicket: (ticket: Partial<Ticket>) => void;
  onAddCustomer: (customer: Customer) => void;
}

export const TicketBoard: React.FC<TicketBoardProps> = ({ tickets, technicians, customers, onAssign, onCreateTicket, onAddCustomer }) => {
  const [filter, setFilter] = useState<TicketStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  
  const [newTicket, setNewTicket] = useState<{
    customerId: string;
    machineModelNo: string;
    description: string;
    priority: TicketPriority;
    type: 'Installation' | 'Repair' | 'AMC Service';
  }>({
    customerId: '',
    machineModelNo: '',
    description: '',
    priority: TicketPriority.MEDIUM,
    type: 'Repair'
  });

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const filteredTickets = filter === 'All' ? tickets : tickets.filter(t => t.status === filter);
  const selectedCustomer = customers.find(c => c.id === newTicket.customerId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === newTicket.customerId);
    onCreateTicket({
      ...newTicket,
      customerName: customer?.name || 'Unknown',
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
    setNewTicket({ customerId: '', machineModelNo: '', description: '', priority: TicketPriority.MEDIUM, type: 'Repair' });
  };
  
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomerObj: Customer = {
        id: `c${Date.now()}`,
        ...newCustomer,
        type: CustomerType.SERVICE_ONLY, // Default for quick add
        machines: []
    }
    onAddCustomer(newCustomerObj);
    setNewTicket(prev => ({ ...prev, customerId: newCustomerObj.id }));
    setQuickAddCustomerOpen(false);
    setNewCustomer({ name: '', phone: '', address: '' });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Service Tickets</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2 transition-colors"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {['All', ...Object.values(TicketStatus)].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            {/* -- Top Section: Customer Info & Description -- */}
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{ticket.customerName}</h3>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 mt-1">
                <span className="font-mono">#{ticket.id}</span>
                <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{ticket.type}</span>
                <span className={`px-1.5 py-0.5 rounded font-semibold ${
                  ticket.priority === TicketPriority.URGENT || ticket.priority === TicketPriority.HIGH
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{ticket.description}</p>
            </div>
            
            {/* -- Bottom Section: Status & Actions (Responsive Redesign) -- */}
            <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
              {/* Left Side: Date and Status */}
              <div className="flex items-center justify-between sm:justify-start sm:items-end gap-4">
                <div className="text-sm">
                  <p className="text-gray-500">Scheduled</p>
                  <p className="font-medium text-gray-800">{ticket.scheduledDate}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full h-fit ${
                  ticket.status === TicketStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                  ticket.status === TicketStatus.ASSIGNED ? 'bg-yellow-100 text-yellow-700' :
                  ticket.status === TicketStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                  'text-orange-500 bg-orange-100'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              {/* Right Side: Technician Assignment */}
              <div className="w-full sm:w-auto sm:max-w-[220px]">
                {ticket.status === TicketStatus.PENDING ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Assign Technician</label>
                    <select 
                      className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                      onChange={(e) => onAssign(ticket.id, e.target.value)}
                      value={ticket.assignedTechnicianId || ''}
                    >
                      <option value="">Select...</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                  </div>
                ) : ticket.assignedTechnicianId ? (
                  <div className="text-sm text-right sm:text-left">
                    <p className="text-gray-500">Assigned To</p>
                    <div className="flex items-center justify-end sm:justify-start gap-2 font-medium text-green-700">
                      <UserIcon size={14} />
                      {technicians.find(t => t.id === ticket.assignedTechnicianId)?.name || 'Unknown'}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
            No tickets found for this filter.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create New Ticket</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <div className="flex gap-2">
                  <select required className="flex-grow w-full border rounded p-2 mt-1" value={newTicket.customerId} onChange={e => setNewTicket({...newTicket, customerId: e.target.value, machineModelNo: ''})}>
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                  <button type="button" onClick={() => setQuickAddCustomerOpen(true)} className="mt-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded">New</button>
                </div>
              </div>
              
              {selectedCustomer && selectedCustomer.machines.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Machine</label>
                  <select required className="w-full border rounded p-2 mt-1" value={newTicket.machineModelNo} onChange={e => setNewTicket({...newTicket, machineModelNo: e.target.value})}>
                     <option value="">-- Select Machine --</option>
                    {selectedCustomer.machines.map(m => <option key={m.modelNo} value={m.modelNo}>{m.modelNo}</option>)}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="w-full border rounded p-2 mt-1" value={newTicket.type} onChange={e => setNewTicket({...newTicket, type: e.target.value as any})}>
                  <option>Repair</option>
                  <option>Installation</option>
                  <option>AMC Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select className="w-full border rounded p-2 mt-1" value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}>
                  <option value={TicketPriority.LOW}>Low</option>
                  <option value={TicketPriority.MEDIUM}>Medium</option>
                  <option value={TicketPriority.HIGH}>High</option>
                  <option value={TicketPriority.URGENT}>Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description / Problem</label>
                <textarea required className="w-full border rounded p-2 mt-1" rows={3} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Quick Add Customer Modal */}
       {isQuickAddCustomerOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold mb-4">Quick Add Customer</h3>
                 <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input required className="w-full border rounded p-2 mt-1" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input required className="w-full border rounded p-2 mt-1" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input required className="w-full border rounded p-2 mt-1" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setQuickAddCustomerOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Customer</button>
                    </div>
                </form>
            </div>
         </div>
       )}
    </div>
  );
};