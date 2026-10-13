import { useState } from 'react';
import AdminTable from '../../components/admin/AdminTable';
import API from '../../services/api';

export default function ExpensesView({ data, onRefresh }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ date: '', category: 'Maintenance', description: '', amount: '' });

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this expense?")) return;
        await API.expenses.remove(id);
        onRefresh();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await API.expenses.create({ ...formData, amount: Number(formData.amount) });
        setIsModalOpen(false);
        setFormData({ date: '', category: 'Maintenance', description: '', amount: '' }); 
        onRefresh(); 
    };

    const columns = [
        {
            header: 'Date',
            render: (exp)=>(
                <div className="px-6 py-4">{new Date(exp.date).toLocaleDateString()}</div>
            )
        },
        {
            header: 'Category',
            accessor: 'category',
            cellClassName: 'font-medium'
        },
        {
            header : 'Description',
            accessor:'description'
        },
        {
            header: 'Amount',
            render: (exp)=>(
                <td className="px-6 py-4 text-right font-bold text-gray-900">₹{Number(exp.amount).toFixed(2)}</td>
            )
        },
        {
            header: 'Action',
            headerAlign: "text-right",
            cellClassName: "text-right whitespace-nowrap",
            render:(expense)=>(
                <div className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                </div>
            )

        },
    ]

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Operating Expenses</h3>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium text-sm"
                >
                    + Add Expense
                </button>
            </div>

            {/*Data Table */}
            <AdminTable
                columns={columns}
                data={data}
                isLoading={false}
            />
            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                            
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="Maintenance">Maintenance</option>
                                <option value="Rent">Rent</option>
                                <option value="Salary">Salary</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                            
                            <input type="text" required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                            
                            <input type="number" required placeholder="Amount (₹)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                            
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}