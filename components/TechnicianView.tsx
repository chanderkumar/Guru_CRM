
import React, { useState } from 'react';
import { Ticket, TicketStatus, Part, PaymentMode } from '../types';
import { MapPin, Phone, Clock, Package, Check, ChevronDown, ChevronUp, Trash2, FileText, XCircle } from 'lucide-react';

interface TechnicianViewProps {
  tickets: Ticket[];
  parts: Part[];
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onCancelTicket: (ticketId: string, reason: string) => void;
  currentUserId: string;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ tickets, parts, onUpdateTicket, onCancelTicket, currentUserId }) => {
  const myTickets = tickets.filter(t => t.assignedTechnicianId === currentUserId && t.status !== TicketStatus.CANCELLED);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  
  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form state for closing a ticket
  const [closureData, setClosureData] = useState<{
    items: { partId: string; quantity: number }[];
    serviceCharge: number;
    notes: string;
    paymentMode: PaymentMode;
    nextFollowUp: string;
  }>({
    items: [],
    serviceCharge: 0,
    notes: '',
    paymentMode: PaymentMode.CASH,
    nextFollowUp: ''
  });

  const handleStartTicket = (ticket: Ticket) => {
    onUpdateTicket({ ...ticket, status: TicketStatus.IN_PROGRESS });
  };
  
  const initiateCancel = (e: React.MouseEvent, ticketId: string) => {
      e.stopPropagation();
      setTicketToCancel(ticketId);
      setCancelReason('');
      setCancelModalOpen(true);
  };
  
  const confirmCancel = () => {
      if (ticketToCancel && cancelReason) {
          onCancelTicket(ticketToCancel, cancelReason);
          setCancelModalOpen(false);
          setTicketToCancel(null);
          setCancelReason('');
      }
  };

  const handleAddItem = () => {
    setClosureData({
      ...closureData,
      items: [...closureData.items, { partId: parts[0].id, quantity: 1 }]
    });
  };
  
  const handleRemoveItem = (indexToRemove: number) => {
    setClosureData(prev => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== indexToRemove),
    }));
  };

  const calculateTotal = () => {
    const partsTotal = closureData.items.reduce((sum, item) => {
      const part = parts.find(p => p.id === item.partId);
      return sum + (part ? part.price * item.quantity : 0);
    }, 0);
    return partsTotal + Number(closureData.serviceCharge);
  };

  const handleSubmitClosure = (ticket: Ticket) => {
    const itemsUsed = closureData.items.map(item => {
      const part = parts.find(p => p.id === item.partId)!;
      return { partId: item.partId, quantity: item.quantity, cost: part.price };
    });

    onUpdateTicket({
      ...ticket,
      status: TicketStatus.COMPLETED,
      itemsUsed,
      serviceCharge: Number(closureData.serviceCharge),
      totalAmount: calculateTotal(),
      technicianNotes: closureData.notes,
      paymentMode: closureData.paymentMode,
      completedDate: new Date().toISOString().split('T')[0],
      nextFollowUp: closureData.nextFollowUp
    });
    setActiveTicketId(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Tasks</h2>
      
      {myTickets.length === 0 && (
         <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm">
           <Check className="mx-auto mb-2 text-green-500" size={32} />
           All caught up! No assigned tickets.
         </div>
      )}

      {myTickets.map(ticket => {
        const isOpen = activeTicketId === ticket.id;
        
        return (
          <div key={ticket.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4" onClick={() => setActiveTicketId(isOpen ? null : ticket.id)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="font-bold text-gray-800">{ticket.customerName}</h3>
                   <span className="text-xs text-gray-500">#{ticket.id} • {ticket.type}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  ticket.status === TicketStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 
                  ticket.status === TicketStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                 <div className="flex items-center gap-2">
                   <Phone size={14} /> <span>Call Customer</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <MapPin size={14} /> <span>View Address</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Clock size={14} /> <span>{ticket.scheduledDate}</span>
                 </div>
              </div>

              <div className="flex justify-center mt-2">
                {isOpen ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
              </div>
            </div>

            {isOpen && ticket.status !== TicketStatus.COMPLETED && (
              <div className="bg-gray-50 p-4 border-t border-gray-100 animate-fade-in">
                <div className="mb-4 border-b border-gray-200 pb-4">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                    <FileText size={16} />
                    Problem Description
                  </h4>
                  <p className="text-gray-600 text-sm">{ticket.description}</p>
                </div>
                
                {ticket.status === TicketStatus.ASSIGNED && (
                  <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStartTicket(ticket); }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Start Service
                      </button>
                      <button 
                        onClick={(e) => initiateCancel(e, ticket.id)}
                        className="bg-red-100 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-200 transition"
                        title="Reject / Cancel"
                      >
                        <XCircle size={20} />
                      </button>
                  </div>
                )}

                {ticket.status === TicketStatus.IN_PROGRESS && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Completion Details</h4>
                    
                    {/* Parts Used */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Parts Used</label>
                      {closureData.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 mb-1 items-center">
                          <select 
                            className="flex-1 text-sm border rounded p-1.5"
                            value={item.partId}
                            onChange={(e) => {
                              const newItems = [...closureData.items];
                              newItems[idx].partId = e.target.value;
                              setClosureData({...closureData, items: newItems});
                            }}
                          >
                            {parts.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                          </select>
                          <input 
                            type="number" 
                            className="w-16 text-sm border rounded p-1.5"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => {
                              const newItems = [...closureData.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setClosureData({...closureData, items: newItems});
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                            title="Remove Part"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button onClick={handleAddItem} className="text-blue-600 text-sm flex items-center gap-1 font-medium hover:underline p-1">
                        <Package size={14} /> Add Part
                      </button>
                    </div>

                    {/* Charges */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Service Charge (₹)</label>
                      <input 
                        type="number" 
                        className="w-full border rounded p-2 mt-1"
                        value={closureData.serviceCharge}
                        onChange={(e) => setClosureData({...closureData, serviceCharge: Number(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Notes</label>
                      <textarea 
                        className="w-full border rounded p-2 mt-1"
                        rows={2}
                        value={closureData.notes}
                        onChange={(e) => setClosureData({...closureData, notes: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Next Follow Up</label>
                      <input 
                        type="date" 
                        className="w-full border rounded p-2 mt-1"
                        value={closureData.nextFollowUp}
                        onChange={(e) => setClosureData({...closureData, nextFollowUp: e.target.value})}
                      />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4 space-y-2">
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold text-gray-800">Total Amount</span>
                        <span className="font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</span>
                      </div>
                      <select 
                        className="w-full border rounded p-2 text-sm"
                        value={closureData.paymentMode}
                        onChange={(e) => setClosureData({...closureData, paymentMode: e.target.value as PaymentMode})}
                      >
                        {Object.values(PaymentMode).map(mode => <option key={mode} value={mode}>{mode}</option>)}
                      </select>
                    </div>

                    <button 
                      onClick={() => handleSubmitClosure(ticket)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200"
                    >
                      Complete Service & Close Ticket
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cancel Reason Modal */}
      {cancelModalOpen && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
               <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                   <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                       <XCircle size={20} /> Reject / Cancel Ticket
                   </h3>
                   <p className="text-sm text-gray-600 mb-4">
                       Please provide a reason for cancelling this job.
                   </p>
                   <textarea 
                       className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                       rows={3}
                       placeholder="Enter reason (e.g., Customer unavailable, Wrong address)..."
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
                           Confirm
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
