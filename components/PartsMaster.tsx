import React, { useState } from 'react';
import { Part } from '../types';
import { Search, Plus, Trash2, PenTool } from 'lucide-react';

interface PartsMasterProps {
  parts: Part[];
  onAddPart: (part: Part) => void;
}

export const PartsMaster: React.FC<PartsMasterProps> = ({ parts, onAddPart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    category: '',
    price: 0,
    warrantyMonths: 0,
  });

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPart({
      id: `p${Date.now()}`,
      ...newPart
    });
    setIsModalOpen(false);
    setNewPart({ name: '', category: '', price: 0, warrantyMonths: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product & Spare Parts Master</h2>
          <p className="text-gray-500">Manage the inventory of parts used for service.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add New Part
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by part name or category..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Responsive Parts List */}
      <div>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Part Name</th>
                <th scope="col" className="px-6 py-3">Category</th>
                <th scope="col" className="px-6 py-3">Price</th>
                <th scope="col" className="px-6 py-3">Warranty</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(part => (
                <tr key={part.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{part.name}</td>
                  <td className="px-6 py-4">{part.category}</td>
                  <td className="px-6 py-4">₹{part.price.toLocaleString()}</td>
                  <td className="px-6 py-4">{part.warrantyMonths} months</td>
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
          {filteredParts.map(part => (
            <div key={part.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{part.name}</h3>
                  <p className="text-sm text-gray-500">{part.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-blue-600 rounded"><PenTool size={16}/></button>
                  <button className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <div className="text-gray-600">
                  Price: <span className="font-medium text-gray-800">₹{part.price.toLocaleString()}</span>
                </div>
                <div className="text-gray-600">
                  Warranty: <span className="font-medium text-gray-800">{part.warrantyMonths} months</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredParts.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border">
                No parts found.
            </div>
        )}
      </div>


      {/* Add Part Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add New Part</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Part Name</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" value={newPart.name} onChange={e => setNewPart({...newPart, name: e.target.value})} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" value={newPart.category} onChange={e => setNewPart({...newPart, category: e.target.value})} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input required type="number" min="0" className="w-full border rounded p-2 mt-1" value={newPart.price} onChange={e => setNewPart({...newPart, price: Number(e.target.value)})} />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Warranty (Months)</label>
                <input required type="number" min="0" className="w-full border rounded p-2 mt-1" value={newPart.warrantyMonths} onChange={e => setNewPart({...newPart, warrantyMonths: Number(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Part</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};