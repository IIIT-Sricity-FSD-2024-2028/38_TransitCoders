import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { useMemo } from 'react';
import { useUsers } from './adminHooks';
import { useComplaints, useFeedback } from '../../shared/support/supportHooks';

export default function ReportsAnalytics() {
    const { data: users = [], error: usersError } = useUsers();
    const { data: complaints = [], error: complaintsError } = useComplaints();
    const { data: feedbacks = [], error: feedbacksError } = useFeedback();

    const error = usersError?.message || complaintsError?.message || feedbacksError?.message || '';

    const { roleData, activeUsers, complaintData, complaintStatus, feedbackRatings } = useMemo(() => {
        let computedRoleData = [];
        let computedActiveUsers = [];
        if (Array.isArray(users) && users.length > 0) {
            const roleCounts = users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});
            computedRoleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
            const activeCount = users.filter(user => user.isActive).length;
            computedActiveUsers = [activeCount, users.length - activeCount].map((value, index) => ({
                name: index === 0 ? 'Active' : 'Inactive',
                value
            }));
        }

        let computedComplaintData = [];
        let computedComplaintStatus = [];
        if (Array.isArray(complaints) && complaints.length > 0) {
            const complaintCounts = complaints.reduce((acc, complaint) => {
                acc[complaint.type] = (acc[complaint.type] || 0) + 1;
                return acc;
            }, {});
            computedComplaintData = Object.entries(complaintCounts).map(([name, value]) => ({ name, value }));
            const complaintStatusCounts = complaints.reduce((acc, complaint) => {
                acc[complaint.status] = (acc[complaint.status] || 0) + 1;
                return acc;
            }, {});
            computedComplaintStatus = Object.entries(complaintStatusCounts).map(([name, value]) => ({ name, value }));
        }

        let computedFeedbackRatings = [];
        if (Array.isArray(feedbacks) && feedbacks.length > 0) {
            const feedbackCounts = feedbacks.reduce((acc, feedback) => {
                acc[feedback.rating] = (acc[feedback.rating] || 0) + 1;
                return acc;
            }, {});
            computedFeedbackRatings = Object.entries(feedbackCounts).map(([name, value]) => ({ name, value }));
        }

        return {
            roleData: computedRoleData,
            activeUsers: computedActiveUsers,
            complaintData: computedComplaintData,
            complaintStatus: computedComplaintStatus,
            feedbackRatings: computedFeedbackRatings,
        };
    }, [users, complaints, feedbacks]);

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#f43f5e', '#eab308', '#8b5cf6', '#14b8a6'];
    return (
        <div className="p-2 bg-gray-50 min-h-screen">
            {/* header */}
            <div className="flex justify-between items-center mb-6">
                <div className="mb-4 left-full">
                    <h1 className="text-2xl font-bold">Reports and Analytics</h1>
                    <p className="text-lg font-light text-gray-500 mb-2">System-wide reports and analytics on platform usage and user growth.</p>
                </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {/* charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                
                {/* Users by Role - pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-1">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Users by Role</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={roleData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            >
                            {roleData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Complaints by Type - Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Complaints by Type</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={complaintData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12, fill: '#6b7280' }}/>
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                
                {/* Active users - pie Chart */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Active Users</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={activeUsers}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                            {activeUsers.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f3f4f6'} /> 
                            ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Complaints by Status - bar Chart */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Complaints by Status</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={complaintStatus}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0}
                            tick={{ fontSize: 12, fill: '#6b7280' }}/>
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="value" radius={[3, 3, 3, 0]}> 
                            {complaintStatus.map((entry, index) => {
                                let barColor = '#f97316'; 
                                
                                if (entry.name === 'Resolved') {
                                barColor = '#10b981'; 
                                } else if (entry.name === 'Open') {
                                barColor = '#eab308'; 
                                } else if (entry.name === 'In Progress') {
                                barColor = '#f97316'; 
                                }

                                return <Cell key={`cell-${index}`} fill={barColor} />;
                            })}
                            <LabelList dataKey="value" position="top" fill="#6b7280" fontSize={14} fontWeight={600} />
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feedback Ratings - Bar Chart */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Feedback Ratings</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={feedbackRatings} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} allowDecimals={false}/>
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} >
                            {feedbackRatings.map((entry, index) => {
                                let barColor = '#f97316';
                                if (entry.name === '5') {
                                    barColor = '#10b981';
                                } else if (entry.name === '4') {
                                    barColor = '#3b82f6';
                                } else if (entry.name === '3') {
                                    barColor = '#facc15';
                                } else if (entry.name === '2') {
                                    barColor = '#f97316';
                                } else if (entry.name === '1') {
                                    barColor = '#ef4444';
                                }
                                return <Cell key={`cell-${index}`} fill={barColor} />;
                            })}
                             <LabelList dataKey="value" position="top" fill="#6b7280" fontSize={14} fontWeight={600} />
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}