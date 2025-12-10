import React, { useState } from 'react';
import { Customer, CustomerType, Machine } from '../types';
import { Search, MapPin, Shield, PenTool, Plus } from 'lucide-react';

interface CustomerMasterProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onAddMachine: (customerId: string, machine: Machine) => void;
}

export const CustomerMaster: React.FC<CustomerMasterProps> = ({ customers, onAddCustomer, onAddMachine }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | CustomerType>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(false);
    setNewCustomer({ name: '', phone: '', address: '', type: CustomerType.GURU_INSTALLED });
  };

  const handleQuickAddMachine = (customerId: string) => {
    const model = prompt("Enter Machine Model No:");
    if (!model) return;
    
    const newMachine: Machine = {
      modelNo: model,
      installationDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      amcActive: true,
      amcExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    };
    onAddMachine(customerId, newMachine);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer & Machine Master</h2>
          <p className="text-gray-500">Manage customer profiles and machine warranty/AMC details.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  customer.type === CustomerType.GURU_INSTALLED ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
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

            {/* Expanded Machine Details */}
            {expandedId === customer.id && (
              <div className="bg-slate-50 p-4 border-t border-gray-100 animate-fade-in">
                <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">Installed Machines</h4>
                <div className="grid gap-3">
                  {customer.machines.map((machine, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-gray-200 flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="min-w-[120px]">
                          <p className="text-xs text-gray-500">Model</p>
                          <p className="font-medium text-slate-800">{machine.modelNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Installation Date</p>
                          <p className="text-sm">{machine.installationDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Warranty Expiry</p>
                          <p className={`text-sm font-medium ${new Date(machine.warrantyExpiry) > new Date() ? 'text-green-600' : 'text-red-600'}`}>
                            {machine.warrantyExpiry}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 border-t pt-2 lg:border-t-0 lg:pt-0">
                        {machine.amcActive ? (
                           <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                             <Shield size={12} /> AMC Active ({machine.amcExpiry})
                           </div>
                        ) : (
                           <div className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                             No AMC
                           </div>
                        )}
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                          <PenTool size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleQuickAddMachine(customer.id)}
                    className="text-sm text-blue-600 font-medium mt-2 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Another Machine
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" 
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input required type="tel" className="w-full border rounded p-2 mt-1" 
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" 
                  value={newCustomer.address} 
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="w-full border rounded p-2 mt-1" 
                  value={newCustomer.type} 
                  onChange={e => setNewCustomer({...newCustomer, type: e.target.value as CustomerType})}
                >
                  <option value={CustomerType.GURU_INSTALLED}>Guru Installed</option>
                  <option value={CustomerType.SERVICE_ONLY}>Service Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
