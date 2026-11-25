import { useState } from 'react';
import AdminTable from './AdminTable';
import { useCreateExpense, useDeleteExpense } from '../../features/admin/adminHooks';

export default function ExpensesView({ data, onRefresh }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ date: '', category: 'Maintenance', description: '', amount: '' });

    const [createExpense, { isLoading: creating }] = useCreateExpense();
    const [deleteExpense, { isLoading: deleting }] = useDeleteExpense();
    const busy = creating || deleting;

    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');

    async function handleDelete(id) {
        if (busy || !window.confirm('Delete this expense?')) return;
        setError('');
        try {
            await deleteExpense(id).unwrap();
            if (onRefresh) await onRefresh();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (busy) return;
        setSubmitError('');
        setError('');
        try {
            await createExpense({ ...formData, description: formData.description.trim(), amount: Number(formData.amount) }).unwrap();
            setIsModalOpen(false);
            setFormData({ date: '', category: 'Maintenance', description: '', amount: '' });
            if (onRefresh) await onRefresh();
        } catch (err) {
            setSubmitError(err.message);
        }
    }

    const columns = [
        {
            header: 'Date',
            render: (exp)=>(
                <div className="px-6 py-4">{new Date(exp.date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</div>
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
                <span className="block px-6 py-4 text-right font-bold text-gray-900">₹{Number(exp.amount).toFixed(2)}</span>
            )
        },
        {
            header: 'Action',
            headerAlign: "text-right",
            cellClassName: "text-right whitespace-nowrap",
            render:(expense)=>(
                <div className="px-6 py-4 text-right">
                    <button disabled={busy} onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
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
                    onClick={() => { setSubmitError(''); setIsModalOpen(true); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium text-sm"
                >
                    + Add Expense
                </button>
            </div>

            {error && <p role="alert" className="p-3 text-sm text-red-700">{error}</p>}
            {/*Data Table */}
            <AdminTable
                columns={columns}
                data={data}
                isLoading={false}
            />
            {/* Add Expense Modal */}
            {isModalOpen && (
                <div role="dialog" aria-modal="true" aria-label="Add Expense" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="date" aria-label="Expense date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                            
                            <select aria-label="Expense category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="Maintenance">Maintenance</option>
                                <option value="Rent">Rent</option>
                                <option value="Salary">Salary</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                            
                            <input type="text" required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                            
                            <input type="number" step="0.01" min="0.01" required placeholder="Amount (₹)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                            
                            {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" disabled={busy} onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
                                <button type="submit" disabled={busy} className="px-4 py-2 bg-orange-500 text-white rounded-md">{busy ? 'Saving…' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}