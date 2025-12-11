
import React from 'react';
import { Ticket, Customer } from '../types';
import { X, Printer } from 'lucide-react';

interface InvoiceViewProps {
  ticket: Ticket;
  customer: Customer;
  onClose: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ ticket, customer, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full">
        
        {/* Header Actions */}
        <div className="bg-gray-100 p-4 flex justify-between items-center print:hidden">
          <h2 className="font-bold text-gray-700">Invoice Preview</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              <Printer size={18} /> Print
            </button>
            <button onClick={onClose} className="bg-gray-200 text-gray-600 px-4 py-2 rounded hover:bg-gray-300">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-0" id="invoice-content">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-800">Guru Technologies</h1>
              <p className="text-sm text-gray-500 mt-1">We Build Brands, Relations & Trust Since 2007</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>Dindigul Main Road, Vilangudi</p>
                <p>Madurai - 625018</p>
                <p>Phone: 9876543210</p>
                <p>Email: sales@saitechnologies.in</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Invoice</h2>
              <div className="mt-4 text-sm">
                <p><span className="font-bold text-gray-700">Invoice No:</span> INV-{ticket.id}</p>
                <p><span className="font-bold text-gray-700">Date:</span> {ticket.completedDate || new Date().toISOString().split('T')[0]}</p>
                <p><span className="font-bold text-gray-700">Ticket Ref:</span> #{ticket.id}</p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-gray-600 font-bold uppercase text-xs tracking-wider mb-2">Bill To:</h3>
            <p className="font-bold text-lg text-gray-800">{customer.name}</p>
            <p className="text-gray-600">{customer.address}</p>
            <p className="text-gray-600">{customer.phone}</p>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                <th className="p-3 border-b">Description</th>
                <th className="p-3 border-b text-right">Qty</th>
                <th className="p-3 border-b text-right">Unit Price</th>
                <th className="p-3 border-b text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {/* Service Charge */}
              <tr>
                <td className="p-3 border-b">Service Charges ({ticket.type})</td>
                <td className="p-3 border-b text-right">1</td>
                <td className="p-3 border-b text-right">₹{ticket.serviceCharge.toLocaleString()}</td>
                <td className="p-3 border-b text-right">₹{ticket.serviceCharge.toLocaleString()}</td>
              </tr>
              {/* Parts */}
              {ticket.itemsUsed.map((item, index) => (
                <tr key={index}>
                  <td className="p-3 border-b">Part ID: {item.partId}</td>
                  <td className="p-3 border-b text-right">{item.quantity}</td>
                  <td className="p-3 border-b text-right">₹{item.cost.toLocaleString()}</td>
                  <td className="p-3 border-b text-right">₹{(item.cost * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="p-3 text-right font-bold text-gray-700">Total Amount:</td>
                <td className="p-3 text-right font-bold text-xl text-blue-600">₹{ticket.totalAmount.toLocaleString()}</td>
              </tr>
              {ticket.paymentMode && (
                <tr>
                    <td colSpan={4} className="p-3 text-right text-sm text-gray-500 italic">
                        Paid via {ticket.paymentMode}
                    </td>
                </tr>
              )}
            </tfoot>
          </table>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">For support/queries, please contact us at support@gurutech.com</p>
          </div>

        </div>
      </div>
    </div>
  );
};
