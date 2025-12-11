
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ticket, TicketStatus, AmcExpiry, TicketPriority } from '../types';
import { Activity, AlertTriangle, CheckCircle, IndianRupee, Clock, Ticket as TicketIcon } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  amcExpiries?: AmcExpiry[];
  onCreateTicket: (ticket: Partial<Ticket>) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC<DashboardProps> = ({ tickets, amcExpiries = [], onCreateTicket }) => {
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState<AmcExpiry | null>(null);

  // Compute Stats
  const totalRevenue = tickets.reduce((acc, t) => acc + (t.status === TicketStatus.COMPLETED ? t.totalAmount : 0), 0);
  const pendingCount = tickets.filter(t => t.status !== TicketStatus.COMPLETED && t.status !== TicketStatus.CANCELLED).length;
  const completedCount = tickets.filter(t => t.status === TicketStatus.COMPLETED).length;
  const urgentCount = tickets.filter(t => t.priority === 'Urgent' && t.status !== TicketStatus.COMPLETED).length;

  const statusData = [
    { name: 'Pending', value: pendingCount },
    { name: 'Completed', value: completedCount },
    { name: 'Urgent', value: urgentCount },
  ];

  const handleRenewClick = (amc: AmcExpiry) => {
    setSelectedAmc(amc);
    setRenewModalOpen(true);
  };

  const confirmRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmc) return;

    onCreateTicket({
      customerId: selectedAmc.customerId,
      customerName: selectedAmc.customerName,
      type: 'AMC Service',
      description: `AMC Renewal / Service for ${selectedAmc.machineModel}. Expiry: ${selectedAmc.expiryDate}`,
      priority: TicketPriority.MEDIUM,
      scheduledDate: new Date().toISOString().split('T')[0]
    });

    setRenewModalOpen(false);
    setSelectedAmc(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Operational Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Tickets</p>
            <h3 className="text-2xl font-bold">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <h3 className="text-2xl font-bold">{completedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Urgent / Overdue</p>
            <h3 className="text-2xl font-bold">{urgentCount}</h3>
          </div>
        </div>
      </div>

      {/* AMC Expiries Alert */}
      {amcExpiries.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-3">
                  <Clock size={20}/> AMC Expiring Soon (Next 30 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {amcExpiries.map((amc, idx) => {
                      let dayLabel = `${amc.daysRemaining} days left`;
                      let dayClass = "text-orange-600";
                      if (amc.daysRemaining === 0) { dayLabel = "Today"; dayClass = "text-red-600"; }
                      else if (amc.daysRemaining === 1) { dayLabel = "Tomorrow"; dayClass = "text-orange-700"; }
                      else if (amc.daysRemaining < 0) { dayLabel = `${Math.abs(amc.daysRemaining)} days overdue`; dayClass = "text-red-700 font-black"; }

                      return (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 flex flex-col justify-between gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-800">{amc.customerName}</p>
                                    <p className="text-xs text-gray-500">{amc.machineModel}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${dayClass}`}>{dayLabel}</p>
                                    <p className="text-xs text-gray-400">{amc.expiryDate}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRenewClick(amc)}
                                className="w-full mt-1 bg-orange-100 text-orange-700 hover:bg-orange-200 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
                            >
                                <TicketIcon size={12} /> Raise Renewal Ticket
                            </button>
                        </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex-shrink-0">Ticket Status Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom"
                layout="horizontal"
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
           <h3 className="text-lg font-semibold text-gray-700 mb-4 flex-shrink-0">Technician Performance (Mock)</h3>
           <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Ramesh', completed: 12, pending: 4 },
                { name: 'Suresh', completed: 18, pending: 2 },
                { name: 'Mahesh', completed: 5, pending: 8 },
              ]}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar dataKey="completed" fill="#10B981" />
              <Bar dataKey="pending" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Renewal Confirmation Modal */}
      {renewModalOpen && selectedAmc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-2">Create Renewal Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a new <strong>AMC Service</strong> ticket for <strong>{selectedAmc.customerName}</strong>?
            </p>
            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                <p><span className="font-semibold">Machine:</span> {selectedAmc.machineModel}</p>
                <p><span className="font-semibold">Expiry:</span> {selectedAmc.expiryDate}</p>
                <p><span className="font-semibold">Phone:</span> {selectedAmc.phone}</p>
            </div>
            
            <form onSubmit={confirmRenewal} className="flex gap-3 mt-4">
               <button 
                type="button" 
                onClick={() => setRenewModalOpen(false)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                Create Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
