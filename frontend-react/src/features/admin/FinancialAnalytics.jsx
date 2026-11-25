import { useState } from 'react';
import { useExpenses, useRevenueReport } from './adminHooks';
import AnalyticsView from '../../components/admin/AnalyticsView';
import ExpensesView from '../../components/admin/ExpenseView';

export default function FinancialAnalytics() {
    const [activeTab, setActiveTab] = useState('overview');

    const { data: revenueData = null, error: revenueError } = useRevenueReport();
    const { data: expense = [], error: expenseError } = useExpenses();

    const error = revenueError?.message || expenseError?.message || '';

    return (
        <div className="p-2 bg-gray-50 min-h-screen">
            {/* header */}
            <div className="flex justify-between items-center">
                <div className="mb-4 left-full">
                    <h1 className="text-2xl font-bold">Financial Analytics</h1>
                    <p className="text-lg text-gray-400 mt-1">Analyze and review financial data.</p>
                </div>
            </div>
            {/* toggle for pages */}
            <div className="flex bg-gray-50 p-1 rounded-lg self-start">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all border border-transparent ${
                    activeTab === 'overview' 
                        ? 'bg-white text-gray-900 shadow-sm hover:border-orange-500' 
                        : 'text-gray-500 hover:text-gray-700 '
                    }`}
                >
                    Analytics Overview
                </button>
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all border border-transparent ${
                    activeTab === 'ledger' 
                        ? 'bg-white text-gray-900 shadow-sm hover:border-orange-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Expense Ledger
                </button>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            {/* content */}
            {!error && <div className="animate-reveal mt-6">
                    {activeTab === 'overview' ? (
                        <AnalyticsView data={revenueData} />
                    ) : (
                        <ExpensesView data={expense} />
                    )}
            </div>}
        </div>
    )
}