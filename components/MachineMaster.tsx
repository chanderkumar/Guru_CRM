
import React, { useState } from 'react';
import { MachineType } from '../types';
import { Search, Plus, Trash2, PenTool, Monitor } from 'lucide-react';

interface MachineMasterProps {
  machineTypes: MachineType[];
  onAddMachineType: (type: MachineType) => void;
}

export const MachineMaster: React.FC<MachineMasterProps> = ({ machineTypes, onAddMachineType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({
    modelName: '',
    description: '',
    warrantyMonths: 12,
    price: 0,
  });

  const filteredMachines = machineTypes.filter(m => 
    m.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMachineType({
      id: `mtype${Date.now()}`,
      ...newMachine
    });
    setIsModalOpen(false);
    setNewMachine({ modelName: '', description: '', warrantyMonths: 12, price: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Machine & Product Master</h2>
          <p className="text-gray-500">Manage the catalog of water purifiers and products sold.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add New Model
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by model name..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Responsive List */}
      <div>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Model Name</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Price</th>
                <th scope="col" className="px-6 py-3">Std. Warranty</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map(m => (
                <tr key={m.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <Monitor size={16} className="text-gray-400"/> {m.modelName}
                  </td>
                  <td className="px-6 py-4">{m.description}</td>
                  <td className="px-6 py-4">₹{m.price.toLocaleString()}</td>
                  <td className="px-6 py-4">{m.warrantyMonths} months</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-gray-400 hover:text-blue-600 rounded"><PenTool size={16}/></button>
                    <button className="p-1 text-gray-400 hover:text-red-600 rounded ml-2"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="grid md:hidden grid-cols-1 gap-4">
          {filteredMachines.map(m => (
            <div key={m.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Monitor size={16} className="text-blue-500"/> {m.modelName}
                  </h3>
                  <p className="text-sm text-gray-500">{m.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-blue-600 rounded"><PenTool size={16}/></button>
                  <button className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <div className="text-gray-600">
                  Price: <span className="font-medium text-gray-800">₹{m.price.toLocaleString()}</span>
                </div>
                <div className="text-gray-600">
                  Warranty: <span className="font-medium text-gray-800">{m.warrantyMonths} mths</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredMachines.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border">
                No machine models found.
            </div>
        )}
      </div>


      {/* Add Machine Model Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add New Machine Model</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Model Name</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" value={newMachine.modelName} onChange={e => setNewMachine({...newMachine, modelName: e.target.value})} placeholder="e.g. Guru RO Pro" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" className="w-full border rounded p-2 mt-1" value={newMachine.description} onChange={e => setNewMachine({...newMachine, description: e.target.value})} placeholder="e.g. 12L RO+UV" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input required type="number" min="0" className="w-full border rounded p-2 mt-1" value={newMachine.price} onChange={e => setNewMachine({...newMachine, price: Number(e.target.value)})} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Standard Warranty (Months)</label>
                <input required type="number" min="0" className="w-full border rounded p-2 mt-1" value={newMachine.warrantyMonths} onChange={e => setNewMachine({...newMachine, warrantyMonths: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Model</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};