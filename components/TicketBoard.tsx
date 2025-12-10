import React, { useState } from 'react';
import { Ticket, TicketPriority, TicketStatus, User, Role } from '../types';
import { Calendar, User as UserIcon, AlertCircle, Plus } from 'lucide-react';

interface TicketBoardProps {
  tickets: Ticket[];
  technicians: User[];
  onAssign: (ticketId: string, techId: string) => void;
  onCreateTicket: (ticket: Partial<Ticket>) => void;
}

export const TicketBoard: React.FC<TicketBoardProps> = ({ tickets, technicians, onAssign, onCreateTicket }) => {
  const [filter, setFilter] = useState<TicketStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Ticket Form State
  const [newTicket, setNewTicket] = useState<{
    customerName: string;
    phone: string;
    description: string;
    priority: TicketPriority;
    type: 'Installation' | 'Repair' | 'AMC Service';
  }>({
    customerName: '',
    phone: '',
    description: '',
    priority: TicketPriority.MEDIUM,
    type: 'Repair'
  });

  const filteredTickets = filter === 'All' ? tickets : tickets.filter(t => t.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket({
      ...newTicket,
      customerId: 'temp-id', // Simplified for demo
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Service Tickets</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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
          <div key={ticket.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  ticket.priority === TicketPriority.URGENT || ticket.priority === TicketPriority.HIGH
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-gray-500">#{ticket.id}</span>
                <span className="text-xs font-medium text-blue-600">{ticket.type}</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-800">{ticket.customerName}</h3>
              <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {ticket.scheduledDate}
                </div>
                {ticket.assignedTechnicianId && (
                   <div className="flex items-center gap-1 text-green-600">
                   <UserIcon size={14} />
                   {technicians.find(t => t.id === ticket.assignedTechnicianId)?.name || 'Unknown'}
                 </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center min-w-[200px]">
              {ticket.status === TicketStatus.PENDING && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500 font-medium">Assign Technician</label>
                  <select 
                    className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => onAssign(ticket.id, e.target.value)}
                    value={ticket.assignedTechnicianId || ''}
                  >
                    <option value="">Select Technician</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-2 text-right">
                <span className={`text-sm font-medium ${
                  ticket.status === TicketStatus.COMPLETED ? 'text-green-600' : 'text-orange-500'
                }`}>
                  {ticket.status}
                </span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create New Ticket</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" value={newTicket.customerName} onChange={e => setNewTicket({...newTicket, customerName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input required type="tel" className="w-full border rounded p-2 mt-1" value={newTicket.phone} onChange={e => setNewTicket({...newTicket, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="w-full border rounded p-2 mt-1" value={newTicket.type} onChange={e => setNewTicket({...newTicket, type: e.target.value as any})}>
                  <option>Installation</option>
                  <option>Repair</option>
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
                <label className="block text-sm font-medium text-gray-700">Description</label>
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
    </div>
  );
};