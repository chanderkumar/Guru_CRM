import React, { useState } from 'react';
import { Customer, Ticket, TicketPriority, TicketStatus, User, CustomerType, AssignmentHistory } from '../types';
import { Calendar, User as UserIcon, AlertCircle, Plus, Building, Search, X, Edit2, History as HistoryIcon, Clock, FileText, Trash2, Ban } from 'lucide-react';
import { api } from '../api';
import { InvoiceView } from './InvoiceView';
import { ToastType } from './Toast';

interface TicketBoardProps {
  tickets: Ticket[];
  technicians: User[];
  customers: Customer[];
  onAssign: (ticketId: string, techId: string, scheduledDate: string) => void;
  onCreateTicket: (ticket: Partial<Ticket>) => void;
  onAddCustomer: (customer: Customer) => void;
  onCancelTicket: (ticketId: string, reason: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

export const TicketBoard: React.FC<TicketBoardProps> = ({ tickets, technicians, customers, onAssign, onCreateTicket, onAddCustomer, onCancelTicket, showToast }) => {
  const [filter, setFilter] = useState<TicketStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  
  // Assignment Modal State
  const [assignModal, setAssignModal] = useState<{
    ticketId: string;
    techId: string;
    techName: string;
    isReschedule?: boolean;
  } | null>(null);
  const [assignDateTime, setAssignDateTime] = useState('');
  
  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [currentTicketHistory, setCurrentTicketHistory] = useState<AssignmentHistory[]>([]);
  const [currentTicketIdForHistory, setCurrentTicketIdForHistory] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Invoice State
  const [invoiceTicket, setInvoiceTicket] = useState<Ticket | null>(null);

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

  const handleTechSelect = (ticket: Ticket, techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;

    // Use existing scheduled date if available, otherwise current date/time
    const initialDate = ticket.scheduledDate && ticket.scheduledDate.includes('T') 
      ? ticket.scheduledDate 
      : `${new Date().toISOString().split('T')[0]}T09:00`;

    setAssignDateTime(initialDate);
    setAssignModal({
      ticketId: ticket.id,
      techId: techId,
      techName: tech.name,
      isReschedule: ticket.status === TicketStatus.ASSIGNED
    });
  };

  const confirmAssignment = () => {
    if (assignModal && assignDateTime) {
      onAssign(assignModal.ticketId, assignModal.techId, assignDateTime);
      setAssignModal(null);
      setAssignDateTime('');
    } else {
        showToast("Please select date and time", "error");
    }
  };

  const fetchAndShowHistory = async (ticketId: string) => {
      setCurrentTicketIdForHistory(ticketId);
      setHistoryModalOpen(true);
      setCurrentTicketHistory([]); // clear prev
      const history = await api.getTicketHistory(ticketId);
      setCurrentTicketHistory(history);
  };
  
  const initiateCancel = (ticketId: string) => {
      setTicketToCancel(ticketId);
      setCancelReason('');
      setCancelModalOpen(true);
  }

  const confirmCancel = () => {
      if (ticketToCancel && cancelReason) {
          onCancelTicket(ticketToCancel, cancelReason);
          setCancelModalOpen(false);
          setTicketToCancel(null);
          setCancelReason('');
      }
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Not Scheduled';
    if (dateStr.includes('T')) {
      return new Date(dateStr).toLocaleString('en-IN', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
    }
    return dateStr;
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
              <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-800">{ticket.customerName}</h3>
                  {(ticket.status === TicketStatus.PENDING || ticket.status === TicketStatus.ASSIGNED) && (
                      <button 
                        onClick={() => initiateCancel(ticket.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Cancel Ticket"
                      >
                          <Trash2 size={16} />
                      </button>
                  )}
              </div>
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
                {/* History Button */}
                <button 
                  onClick={() => fetchAndShowHistory(ticket.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors ml-auto"
                  title="View Assignment History"
                >
                  <HistoryIcon size={14} /> History
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-2">{ticket.description}</p>
              {ticket.status === TicketStatus.CANCELLED && ticket.cancellationReason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-1">
                      <Ban size={14} className="mt-0.5 shrink-0" />
                      <span><strong>Cancelled:</strong> {ticket.cancellationReason}</span>
                  </div>
              )}
            </div>
            
            {/* -- Bottom Section: Status & Actions -- */}
            <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
              <div className="flex items-center justify-between sm:justify-start sm:items-end gap-4">
                <div className="text-sm">
                  <p className="text-gray-500">Scheduled</p>
                  <p className="font-medium text-gray-800">{formatDisplayDate(ticket.scheduledDate)}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full h-fit ${
                  ticket.status === TicketStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                  ticket.status === TicketStatus.ASSIGNED ? 'bg-yellow-100 text-yellow-700' :
                  ticket.status === TicketStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                  ticket.status === TicketStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                  'text-orange-500 bg-orange-100'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              <div className="w-full sm:w-auto sm:max-w-[220px]">
                {ticket.status === TicketStatus.PENDING ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Assign Technician</label>
                    <select 
                      className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                      onChange={(e) => handleTechSelect(ticket, e.target.value)}
                      value={ticket.assignedTechnicianId || ''}
                    >
                      <option value="">Select...</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                  </div>
                ) : ticket.status === TicketStatus.COMPLETED ? (
                    <button 
                        onClick={() => setInvoiceTicket(ticket)}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <FileText size={16} /> Print Invoice
                    </button>
                ) : ticket.assignedTechnicianId ? (
                  <div className="text-sm text-right sm:text-left">
                    <p className="text-gray-500">Assigned To</p>
                    <div className="flex items-center justify-end sm:justify-start gap-2 font-medium text-green-700">
                      <UserIcon size={14} />
                      {technicians.find(t => t.id === ticket.assignedTechnicianId)?.name || 'Unknown'}
                      {(ticket.status === TicketStatus.ASSIGNED) && (
                          <button 
                            onClick={() => handleTechSelect(ticket, ticket.assignedTechnicianId!)} 
                            className="p-1 text-gray-400 hover:text-blue-600 bg-gray-50 rounded"
                            title="Reschedule / Reassign"
                          >
                              <Edit2 size={14} />
                          </button>
                      )}
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

      {/* Assignment/Reschedule Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{assignModal.isReschedule ? 'Reschedule Ticket' : 'Confirm Assignment'}</h3>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              {assignModal.isReschedule ? 'Updating assignment for' : 'Assigning ticket to'} <span className="font-bold text-gray-800">{assignModal.techName}</span>.
            </p>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                <select 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={assignModal.techId}
                    onChange={(e) => {
                        const newTech = technicians.find(t => t.id === e.target.value);
                        setAssignModal({
                            ...assignModal, 
                            techId: e.target.value, 
                            techName: newTech?.name || ''
                        });
                    }}
                >
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Date & Time</label>
              <input 
                type="datetime-local" 
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={assignDateTime}
                onChange={(e) => setAssignDateTime(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setAssignModal(null)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAssignment}
                className="flex-1 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                {assignModal.isReschedule ? 'Update' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold">Assignment History</h3>
                <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
             </div>
             
             <div className="space-y-4">
                {currentTicketHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No history found.</p>
                ) : (
                    currentTicketHistory.map((h, index) => {
                        const tech = technicians.find(t => t.id === h.technicianId);
                        return (
                            <div key={h.id} className="relative flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                    {index !== currentTicketHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1"></div>}
                                </div>
                                <div className="pb-4">
                                    <p className="font-semibold text-gray-800 text-sm">
                                        Assigned to {tech ? tech.name : 'Unknown Tech'}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Calendar size={12}/> Scheduled: {formatDisplayDate(h.scheduledDate)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Updated: {new Date(h.assignedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
             </div>
           </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
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

       {/* Cancel Reason Modal */}
       {cancelModalOpen && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
               <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                   <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                       <Ban size={20} /> Cancel Ticket
                   </h3>
                   <p className="text-sm text-gray-600 mb-4">
                       Please provide a reason for cancelling this ticket.
                   </p>
                   <textarea 
                       className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                       rows={3}
                       placeholder="Enter reason..."
                       value={cancelReason}
                       onChange={e => setCancelReason(e.target.value)}
                   ></textarea>
                   <div className="flex gap-3 mt-4">
                       <button 
                           onClick={() => setCancelModalOpen(false)}
                           className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                       >
                           Close
                       </button>
                       <button 
                           onClick={confirmCancel}
                           disabled={!cancelReason.trim()}
                           className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50"
                       >
                           Confirm Cancel
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Invoice Modal */}
       {invoiceTicket && (
           <InvoiceView 
                ticket={invoiceTicket} 
                customer={customers.find(c => c.id === invoiceTicket.customerId)!}
                onClose={() => setInvoiceTicket(null)}
           />
       )}
    </div>
  );
};