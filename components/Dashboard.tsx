import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ticket, TicketStatus } from '../types';
import { Activity, AlertTriangle, CheckCircle, IndianRupee } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
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
    </div>
  );
};
