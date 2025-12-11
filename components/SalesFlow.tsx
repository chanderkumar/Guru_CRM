import React, { useState } from 'react';
import { Lead, LeadStatus, LeadHistory, MachineType } from '../types';
import { api } from '../api';
import { Phone, CheckCircle, FileText, UserPlus, Calendar, IndianRupee, Plus, Trash2, Clock, Mail, MapPin, Edit2, X, History as HistoryIcon, ArrowRight, XCircle, Monitor } from 'lucide-react';
import { ToastType } from './Toast';

interface SalesFlowProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead: (id: string) => void;
  onConvertLead: (id: string, details: any) => void;
  machineTypes?: MachineType[];
  showToast: (msg: string, type: ToastType) => void;
}

export const SalesFlow: React.FC<SalesFlowProps> = ({ leads, onAddLead, onUpdateLead, onDeleteLead, onConvertLead, machineTypes = [], showToast }) => {
  const [newLead, setNewLead] = useState({ name: '', phone: '', source: 'Walk-in', email: '', address: '' });
  const [modalOpen, setModalOpen] = useState(false);
  
  // Edit/Action Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Action Modals (Action = FollowUp, Estimate, Lost, Convert)
  const [actionType, setActionType] = useState<'followup' | 'estimate' | 'lost' | 'convert' | null>(null);
  const [actionData, setActionData] = useState<any>({});
  
  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({
      id: `l${Date.now()}`,
      ...newLead,
      status: LeadStatus.NEW,
      notes: '',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setNewLead({ name: '', phone: '', source: 'Walk-in', email: '', address: '' });
    setModalOpen(false);
  };

  const openEdit = (lead: Lead) => {
      setSelectedLead(lead);
      setEditForm({ ...lead });
      setShowHistory(false);
      setEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedLead) {
          onUpdateLead(selectedLead.id, editForm);
          setEditModalOpen(false);
      }
  };

  const loadHistory = async (id: string) => {
      setHistory([]);
      setShowHistory(true);
      const data = await api.getLeadHistory(id);
      setHistory(data);
  };

  const handleDelete = () => {
      if (selectedLead && confirm("Are you sure you want to delete this lead? This action is irreversible.")) {
          onDeleteLead(selectedLead.id);
          setEditModalOpen(false);
      }
  };

  // --- Action Modal Logic ---
  const openActionModal = (lead: Lead, type: 'followup' | 'estimate' | 'lost' | 'convert') => {
      setSelectedLead(lead);
      setActionType(type);
      
      // Initialize Default Data based on type
      if (type === 'followup') setActionData({ date: '', notes: '' });
      if (type === 'estimate') setActionData({ amount: 0, notes: '' });
      if (type === 'lost') setActionData({ reason: 'Price too high', notes: '' });
      if (type === 'convert') setActionData({ 
          machineModel: '', 
          installationDate: new Date().toISOString().split('T')[0], 
          address: lead.address || '',
          createTicket: true
      });
  };

  const submitAction = async () => {
      if (!selectedLead || !actionType) return;

      if (actionType === 'followup') {
          if (!actionData.date) return showToast("Please select a date", "error");
          onUpdateLead(selectedLead.id, { 
              status: LeadStatus.FOLLOW_UP, 
              nextFollowUp: actionData.date,
              notes: selectedLead.notes ? selectedLead.notes + '\nFollow-up: ' + actionData.notes : 'Follow-up: ' + actionData.notes
          });
          showToast("Follow-up scheduled", "success");
      }

      if (actionType === 'estimate') {
          if (!actionData.amount) return showToast("Please enter amount", "error");
           onUpdateLead(selectedLead.id, { 
              status: LeadStatus.ESTIMATE, 
              estimateValue: Number(actionData.amount),
              notes: selectedLead.notes ? selectedLead.notes + `\nEstimate: ₹${actionData.amount}` : `Estimate: ₹${actionData.amount}`
          });
          showToast("Estimate updated", "success");
      }

      if (actionType === 'lost') {
           onUpdateLead(selectedLead.id, { 
              status: LeadStatus.LOST, 
              lossReason: actionData.reason,
              notes: selectedLead.notes + `\nLost: ${actionData.reason} - ${actionData.notes}`
          });
          showToast("Marked as lost", "info");
      }

      if (actionType === 'convert') {
          try {
              const res = await api.convertLeadToCustomer(selectedLead.id, actionData);
              if (res.success) {
                  onConvertLead(selectedLead.id, actionData); // Triggers app refresh
                  showToast(`Successfully converted! Customer ID: ${res.customerId}`, "success");
              }
          } catch (e) {
              showToast("Conversion failed. Check console.", "error");
              console.error(e);
          }
      }

      setActionType(null);
      setSelectedLead(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Sales Pipeline</h2>
           <p className="text-gray-500">Manage inquiries, follow-ups, and conversions.</p>
        </div>
        
        <button 
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
            <Plus size={18} /> Add New Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start">
        {[LeadStatus.NEW, LeadStatus.FOLLOW_UP, LeadStatus.ESTIMATE, LeadStatus.SOLD, LeadStatus.LOST].map((status) => (
          <div key={status} className="bg-gray-50 rounded-xl p-3 min-h-[500px] min-w-[260px] flex flex-col gap-3 border border-gray-200">
            <h3 className={`font-bold text-sm uppercase tracking-wide border-b pb-2 mb-1 flex justify-between items-center ${
                status === LeadStatus.SOLD ? 'text-green-700 border-green-200' : 
                status === LeadStatus.NEW ? 'text-blue-700 border-blue-200' : 
                status === LeadStatus.LOST ? 'text-red-700 border-red-200' : 'text-gray-600 border-gray-200'
            }`}>
              {status}
              <span className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full border shadow-sm">
                {leads.filter(l => l.status === status).length}
              </span>
            </h3>
            
            {leads.filter(l => l.status === status).map(lead => (
              <div 
                key={lead.id} 
                className={`bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group relative ${status === LeadStatus.LOST ? 'opacity-70' : ''}`}
                onClick={() => openEdit(lead)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800 truncate">{lead.name}</span>
                  <Edit2 size={14} className="text-gray-300 group-hover:text-blue-500" />
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1"><Phone size={10} /> {lead.phone}</p>
                    {lead.address && <p className="flex items-center gap-1 truncate"><MapPin size={10} /> {lead.address}</p>}
                    <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-[10px] mt-1">{lead.source}</span>
                </div>
                
                {status === LeadStatus.FOLLOW_UP && lead.nextFollowUp && (
                  <div className={`mt-2 text-xs p-1.5 rounded flex items-center gap-1 ${
                      new Date(lead.nextFollowUp) <= new Date() ? 'bg-red-50 text-red-700 font-bold' : 'bg-yellow-50 text-yellow-800'
                  }`}>
                    <Calendar size={12} />
                    {new Date(lead.nextFollowUp).toLocaleDateString()}
                  </div>
                )}
                
                {status === LeadStatus.ESTIMATE && lead.estimateValue && (
                   <div className="mt-2 text-xs bg-green-50 p-1.5 rounded text-green-800 flex items-center gap-1 font-medium">
                     <IndianRupee size={12} />
                     {lead.estimateValue.toLocaleString()}
                   </div>
                )}

                {/* Quick Actions Footer */}
                <div className="flex justify-end gap-2 border-t pt-2 mt-2" onClick={e => e.stopPropagation()}>
                  {(status === LeadStatus.NEW || status === LeadStatus.FOLLOW_UP) && (
                    <>
                        <button title="Schedule Follow Up" onClick={() => openActionModal(lead, 'followup')} className="p-1 hover:bg-yellow-100 text-yellow-600 rounded bg-gray-50">
                          <Clock size={14} />
                        </button>
                        <button title="Mark Lost" onClick={() => openActionModal(lead, 'lost')} className="p-1 hover:bg-red-100 text-red-600 rounded bg-gray-50">
                          <XCircle size={14} />
                        </button>
                    </>
                  )}
                  {(status === LeadStatus.NEW || status === LeadStatus.FOLLOW_UP || status === LeadStatus.ESTIMATE) && (
                    <button title="Send Estimate" onClick={() => openActionModal(lead, 'estimate')} className="p-1 hover:bg-purple-100 text-purple-600 rounded bg-gray-50">
                      <FileText size={14} />
                    </button>
                  )}
                  {(status === LeadStatus.ESTIMATE || status === LeadStatus.FOLLOW_UP || status === LeadStatus.NEW) && (
                    <button title="Mark Sold / Convert" onClick={() => openActionModal(lead, 'convert')} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
                      <CheckCircle size={12} /> Sold
                    </button>
                  )}
                  {status === LeadStatus.SOLD && (
                     <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Won</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Lead Modal */}
      {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold mb-4">Add New Lead</h3>
                  <form onSubmit={handleAdd} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input required className="w-full border rounded p-2 mt-1" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input required className="w-full border rounded p-2 mt-1" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Source</label>
                            <select className="w-full border rounded p-2 mt-1" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                                <option>Walk-in</option>
                                <option>Referral</option>
                                <option>Web Inquiry</option>
                                <option>Phone Call</option>
                            </select>
                          </div>
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                          <input type="email" className="w-full border rounded p-2 mt-1" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
                          <textarea className="w-full border rounded p-2 mt-1" rows={2} value={newLead.address} onChange={e => setNewLead({...newLead, address: e.target.value})}></textarea>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Lead</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Dynamic Action Modal (Followup, Estimate, Lost, Convert) */}
      {actionType && selectedLead && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold capitalize flex items-center gap-2">
                          {actionType === 'convert' && <CheckCircle className="text-green-600"/>}
                          {actionType === 'lost' && <XCircle className="text-red-600"/>}
                          {actionType === 'followup' && <Clock className="text-yellow-600"/>}
                          {actionType === 'estimate' && <FileText className="text-purple-600"/>}
                          {actionType === 'convert' ? 'Convert to Customer' : actionType === 'lost' ? 'Mark as Lost' : `Add ${actionType}`}
                      </h3>
                      <button onClick={() => setActionType(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      {actionType === 'followup' && (
                          <>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Next Follow Up Date</label>
                                 <input type="date" className="w-full border rounded p-2 mt-1" value={actionData.date} onChange={e => setActionData({...actionData, date: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Notes</label>
                                 <textarea className="w-full border rounded p-2 mt-1" placeholder="Discussion summary..." value={actionData.notes} onChange={e => setActionData({...actionData, notes: e.target.value})} />
                             </div>
                          </>
                      )}

                      {actionType === 'estimate' && (
                          <>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Estimate Amount (₹)</label>
                                 <input type="number" className="w-full border rounded p-2 mt-1" value={actionData.amount} onChange={e => setActionData({...actionData, amount: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Notes / Scope</label>
                                 <textarea className="w-full border rounded p-2 mt-1" placeholder="Details of quote..." value={actionData.notes} onChange={e => setActionData({...actionData, notes: e.target.value})} />
                             </div>
                          </>
                      )}

                      {actionType === 'lost' && (
                          <>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Reason for Loss</label>
                                 <select className="w-full border rounded p-2 mt-1" value={actionData.reason} onChange={e => setActionData({...actionData, reason: e.target.value})}>
                                     <option>Price too high</option>
                                     <option>Competitor selected</option>
                                     <option>Not interested anymore</option>
                                     <option>Bad timing</option>
                                     <option>Other</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Additional Remarks</label>
                                 <textarea className="w-full border rounded p-2 mt-1" value={actionData.notes} onChange={e => setActionData({...actionData, notes: e.target.value})} />
                             </div>
                          </>
                      )}

                      {actionType === 'convert' && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                             <p className="text-sm text-green-800 mb-4 font-medium">This will create a new Customer Profile and an Installation Ticket.</p>
                             
                             <div className="space-y-3">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-600 uppercase">Machine Model</label>
                                     <select className="w-full border rounded p-2 mt-1 text-sm bg-white" value={actionData.machineModel} onChange={e => setActionData({...actionData, machineModel: e.target.value})}>
                                         <option value="">-- Select Machine --</option>
                                         {machineTypes.map(m => <option key={m.id} value={m.modelName}>{m.modelName}</option>)}
                                         <option value="Other">Other</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-600 uppercase">Installation Date</label>
                                     <input type="date" className="w-full border rounded p-2 mt-1 text-sm" value={actionData.installationDate} onChange={e => setActionData({...actionData, installationDate: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-600 uppercase">Final Address</label>
                                     <textarea className="w-full border rounded p-2 mt-1 text-sm" rows={2} value={actionData.address} onChange={e => setActionData({...actionData, address: e.target.value})} />
                                 </div>
                                 <div className="flex items-center gap-2 mt-2">
                                     <input type="checkbox" id="createTicket" checked={actionData.createTicket} onChange={e => setActionData({...actionData, createTicket: e.target.checked})} />
                                     <label htmlFor="createTicket" className="text-sm text-gray-700">Create Installation Ticket?</label>
                                 </div>
                             </div>
                          </div>
                      )}

                      <div className="flex justify-end gap-2 mt-6">
                          <button onClick={() => setActionType(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                          <button onClick={submitAction} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                              Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Edit / Details Modal */}
      {editModalOpen && selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <UserPlus className="text-blue-600" /> {showHistory ? 'Lead History' : 'Lead Details'}
                      </h3>
                      <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>

                  <div className="flex gap-4 mb-6 border-b">
                      <button 
                        className={`pb-2 px-1 font-medium text-sm ${!showHistory ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setShowHistory(false)}
                      >
                          Details & Edit
                      </button>
                      <button 
                        className={`pb-2 px-1 font-medium text-sm ${showHistory ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => loadHistory(selectedLead.id)}
                      >
                          Activity History
                      </button>
                  </div>

                  {!showHistory ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select 
                                    className="w-full border rounded p-2 mt-1 bg-gray-50 font-semibold"
                                    value={editForm.status}
                                    onChange={e => setEditForm({...editForm, status: e.target.value as LeadStatus})}
                                >
                                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input className="w-full border rounded p-2 mt-1" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input className="w-full border rounded p-2 mt-1" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input className="w-full border rounded p-2 mt-1" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Estimate Value (₹)</label>
                                <input type="number" className="w-full border rounded p-2 mt-1" value={editForm.estimateValue || ''} onChange={e => setEditForm({...editForm, estimateValue: Number(e.target.value)})} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Next Follow Up</label>
                                <input type="date" className="w-full border rounded p-2 mt-1" value={editForm.nextFollowUp || ''} onChange={e => setEditForm({...editForm, nextFollowUp: e.target.value})} />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <textarea className="w-full border rounded p-2 mt-1" rows={2} value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Notes / Remarks</label>
                                <textarea className="w-full border rounded p-2 mt-1 bg-yellow-50" rows={3} value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-8 pt-4 border-t">
                            <button type="button" onClick={handleDelete} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded flex items-center gap-2 text-sm font-medium">
                                <Trash2 size={16} /> Delete Lead
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
                            </div>
                        </div>
                      </form>
                  ) : (
                      <div className="space-y-4">
                          {history.length === 0 ? (
                              <p className="text-gray-500 italic text-center py-4">No history recorded yet.</p>
                          ) : (
                              <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                                  {history.map((h, idx) => (
                                      <div key={idx} className="relative">
                                          <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-blue-100"></div>
                                          <div className="flex justify-between items-start">
                                              <p className="font-semibold text-gray-800 text-sm">{h.action}</p>
                                              <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</span>
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1">{h.details}</p>
                                      </div>
                                  ))}
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