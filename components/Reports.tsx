
import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Download } from 'lucide-react';

interface ReportsProps {
  tickets: Ticket[];
}

export const Reports: React.FC<ReportsProps> = ({ tickets }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const filteredTickets = tickets.filter(t => {
      const tDate = t.completedDate || t.scheduledDate;
      return tDate >= dateRange.start && tDate <= dateRange.end;
  });

  // Calculate Revenue per Day
  const revenueMap = new Map<string, number>();
  filteredTickets.forEach(t => {
      if (t.status === TicketStatus.COMPLETED) {
          const date = t.completedDate || t.scheduledDate;
          revenueMap.set(date, (revenueMap.get(date) || 0) + t.totalAmount);
      }
  });

  const chartData = Array.from(revenueMap.entries()).map(([date, amount]) => ({
      date, amount
  })).sort((a,b) => a.date.localeCompare(b.date));

  // Summary Stats
  const totalRev = filteredTickets.reduce((acc, t) => acc + (t.status === TicketStatus.COMPLETED ? t.totalAmount : 0), 0);
  const totalCompleted = filteredTickets.filter(t => t.status === TicketStatus.COMPLETED).length;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-500">View performance metrics and revenue generation.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Download size={18} /> Print / PDF
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="border rounded p-2 text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="border rounded p-2 text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
          <div className="pb-2 text-sm text-gray-500 italic">
              Showing data for {filteredTickets.length} tickets.
          </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">₹{totalRev.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm">Completed Jobs</p>
              <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm">Avg Ticket Value</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalCompleted ? Math.round(totalRev / totalCompleted).toLocaleString() : 0}</p>
          </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3B82F6" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
             <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                 <tr>
                     <th className="px-6 py-3">Date</th>
                     <th className="px-6 py-3">Customer</th>
                     <th className="px-6 py-3">Type</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3 text-right">Amount</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                 {filteredTickets.map(t => (
                     <tr key={t.id}>
                         <td className="px-6 py-3">{t.completedDate || t.scheduledDate}</td>
                         <td className="px-6 py-3 font-medium">{t.customerName}</td>
                         <td className="px-6 py-3">{t.type}</td>
                         <td className="px-6 py-3">{t.status}</td>
                         <td className="px-6 py-3 text-right">₹{t.totalAmount.toLocaleString()}</td>
                     </tr>
                 ))}
             </tbody>
          </table>
      </div>

    </div>
  );
};
