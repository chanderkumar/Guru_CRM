import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { ArrowRight, Phone, CheckCircle, FileText, UserPlus, Calendar, IndianRupee } from 'lucide-react';

interface SalesFlowProps {
  leads: Lead[];
  onAddLead: (lead: Lead) => void;
  onUpdateStatus: (id: string, status: LeadStatus, extraData?: Partial<Lead>) => void;
}

export const SalesFlow: React.FC<SalesFlowProps> = ({ leads, onAddLead, onUpdateStatus }) => {
  const [newLead, setNewLead] = useState({ name: '', phone: '', source: 'Walk-in' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({
      id: Date.now().toString(),
      ...newLead,
      status: LeadStatus.NEW,
      notes: '',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setNewLead({ name: '', phone: '', source: 'Walk-in' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Sales Pipeline</h2>
           <p className="text-gray-500">Track leads from inquiry to installation.</p>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2 items-end bg-white p-4 rounded-lg shadow-sm border">
          <div>
            <label className="block text-xs text-gray-500">Name</label>
            <input required className="border rounded p-1 text-sm" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
          </div>
          <div>
             <label className="block text-xs text-gray-500">Phone</label>
             <input required className="border rounded p-1 text-sm" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
          </div>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded text-sm font-medium hover:bg-blue-700">Add Lead</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {[LeadStatus.NEW, LeadStatus.FOLLOW_UP, LeadStatus.ESTIMATE, LeadStatus.SOLD, LeadStatus.INSTALLED].map((status) => (
          <div key={status} className="bg-gray-50 rounded-xl p-4 min-h-[400px] min-w-[250px] flex flex-col gap-3 border border-gray-200">
            <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2 flex justify-between items-center">
              {status}
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {leads.filter(l => l.status === status).length}
              </span>
            </h3>
            
            {leads.filter(l => l.status === status).map(lead => (
              <div key={lead.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 group hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800">{lead.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-1 rounded">{lead.source}</span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{lead.phone}</div>
                
                {/* Specific Fields for different statuses */}
                {status === LeadStatus.FOLLOW_UP && (
                  <div className="mb-2 text-xs bg-yellow-50 p-2 rounded text-yellow-800 flex items-center gap-1">
                    <Calendar size={12} />
                    {lead.nextFollowUp ? `Next: ${lead.nextFollowUp}` : 'No date set'}
                  </div>
                )}
                
                {status === LeadStatus.ESTIMATE && lead.estimateValue && (
                   <div className="mb-2 text-xs bg-green-50 p-2 rounded text-green-800 flex items-center gap-1">
                     <IndianRupee size={12} />
                     {lead.estimateValue.toLocaleString()}
                   </div>
                )}

                {/* Quick Actions based on Status */}
                <div className="flex justify-end gap-2 border-t pt-2 mt-2">
                  {status === LeadStatus.NEW && (
                    <button title="Mark Follow Up" onClick={() => {
                        const date = prompt("Enter next follow up date (YYYY-MM-DD)", new Date().toISOString().split('T')[0]);
                        if(date) onUpdateStatus(lead.id, LeadStatus.FOLLOW_UP, { nextFollowUp: date });
                    }} className="p-1 hover:bg-yellow-50 text-yellow-600 rounded">
                      <Phone size={16} />
                    </button>
                  )}
                  {status === LeadStatus.FOLLOW_UP && (
                    <button title="Send Estimate" onClick={() => {
                        const val = prompt("Enter Estimate Amount");
                        if(val) onUpdateStatus(lead.id, LeadStatus.ESTIMATE, { estimateValue: Number(val) });
                    }} className="p-1 hover:bg-purple-50 text-purple-600 rounded">
                      <FileText size={16} />
                    </button>
                  )}
                  {status === LeadStatus.ESTIMATE && (
                    <button title="Mark Sold" onClick={() => onUpdateStatus(lead.id, LeadStatus.SOLD)} className="p-1 hover:bg-green-50 text-green-600 rounded">
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {status === LeadStatus.SOLD && (
                    <button title="Install" onClick={() => onUpdateStatus(lead.id, LeadStatus.INSTALLED)} className="p-1 hover:bg-blue-50 text-blue-600 rounded">
                      <UserPlus size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};