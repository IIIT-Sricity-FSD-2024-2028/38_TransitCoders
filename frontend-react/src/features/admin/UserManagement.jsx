import { useState, useEffect,useMemo } from "react";
import { Search, Plus, ChevronDown, Pencil, Trash, People, ShieldCheck, CheckCircle } from "react-bootstrap-icons";
import { API } from "../../services/api";
import AddOrEditUserModal from './AddOrEditUserModal';
import AdminTable from "../../components/admin/AdminTable";
import KPICard from "../../components/shared/KPICard";

const UserManagement=() => {
    const [modalState, setModalState] = useState({ isOpen: false, user: null });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("All Roles");
    const [selectedStatus, setSelectedStatus] = useState("All Statuses");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadUsers() {
            try {
                setLoading(true);
                setError(null);
                const data = await API.users.getAll();
                setUsers(Array.isArray(data) ? data : []);
            }catch (err){
                console.error("Error fetching users:", err);
                setError(err.message || 'Error fetching user records');
            }finally {
                setLoading(false);
            }
        }
        loadUsers();
    },[]);

    const handleOpenAdd = () => {
        setModalState({ isOpen: true, user: null });
    };

    const handleOpenEdit = (user) => {
        setModalState({ isOpen: true, user });
    };

    const handleSuccess = (userResult, action) => {
        if (action === 'create') {
            setUsers((prev) => [ ...prev, userResult]);
        } else if (action === 'edit') {
            setUsers((prev) => prev.map((u) => (u.id === userResult.id ? userResult : u)));
        } 
    };

    const userColumns = [
        {
            header: "Name",
            render: (user) => {
                const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold flex items-center justify-center text-xs flex-shrink-0 border border-orange-200/50">
                            {initial}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                                {user.name}
                            </span>
                            <span className="text-[11px] font-mono text-gray-400 truncate max-w-[150px]" title={user.id}>
                                {user.id}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            header: "Email",
            accessor: "email",
            cellClassName: 'whitespace-nowrap'
        },
        {
            header: "Role",
            render: (user) => {
                const formattedRole = user.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '-'
                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${roleBadges[user.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {formattedRole}
                    </span>
                )
            }
        },
        {
            header: "Status",
            render: (user) => (
                <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium  ${
                    user.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                >
                <span  />
                {user.isActive ? 'Active' : 'Pending Approval'}
                </span>
            ),
        },{
            header: "Last Login",
            render: (user) => (
                <span className="text-gray-500 whitespace-nowrap text-xs">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '—'}
                </span>
            )
        },{
            header: "Actions",
            headerAlign: "text-right",
            cellClassName: "text-right whitespace-nowrap",
            render: (user) => (
                <div className="flex items-center justify-end gap-1">
                    {!user.isActive && (
                        <button
                            title="Approve User"
                            onClick={() => approveUser(user.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors mr-1"
                        >
                            <CheckCircle size={13} />
                        </button>
                    )}
                    <button
                        title="Edit User"
                        onClick={()=> handleOpenEdit(user)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                    </button>
                    <button
                        title="Delete User"
                        onClick={() => deleteUser(user.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash size={14} />
                    </button>  
                </div>
            )
        }
    ]

    const filteredUsers = useMemo(() =>{
        return users.filter((user) => {
            const query = searchTerm.toLowerCase();
            const matchesSearch = 
            (user.name?.toLowerCase().includes(query)) ||
            (user.email?.toLowerCase().includes(query)) ||
            (user.id?.toString().includes(query));
            const matchesRole = 
                selectedRole === "All Roles" || user.role === selectedRole;
            const matchesStatus =
                selectedStatus === 'All Statuses' ||
                (selectedStatus === 'Active' && user.isActive === true) ||
                ((selectedStatus === 'Pending' || selectedStatus === 'Inactive') && user.isActive === false);
            
            return matchesSearch && matchesRole && matchesStatus;
        })
    },[users, searchTerm, selectedRole, selectedStatus]);

    const deleteUser = async (userId) => {
        try {
            await API.users.delete(userId);
            setUsers((prev) => prev.filter((user) => user.id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    }
    const approveUser = async (userId) => {
        try {
            await API.users.approve(userId);
            setUsers((prev) =>
                prev.map((user) => (user.id === userId ? { ...user, isActive: true } : user))
            );
        } catch (error) {
            console.error("Error approving user:", error);
            alert(error.message || "Failed to approve user");
        }
    }

    const roleBadges = {
        super_user: 'bg-purple-50 text-purple-700 border-purple-200/60',
        hub_manager: 'bg-blue-50 text-blue-700 border-blue-200/60',
        admin: 'bg-amber-50 text-amber-700 border-amber-200/60',
        delivery_agent: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        merchant: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
        customer: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <div className="mb-4 left-full">
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-lg text-gray-400 mt-1">Manage all system roles, statuses, and accounts.</p>
                </div>
                <div className="right-full">
                    <button 
                    onClick={handleOpenAdd}
                    className="bg-orange-500 flex text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                        <Plus size={20} className="mt-0.5" />
                        <span>Add New User</span>
                    </button>
                </div>
            </div>
            {/* widgets */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <KPICard
                    title="Total Users"
                    value={users.length}
                    isicon={true}
                    color="bg-blue-50 text-blue-500"
                    icon={<People size={22} />}
                />
                <KPICard
                    title="Active Users"
                    value={users.filter(user => user.isActive).length}
                    isicon={true}
                    color="bg-emerald-50 text-emerald-500"
                    icon={<ShieldCheck size={22} />}
                />
                <KPICard
                    title="Pending Approvals"
                    value={users.filter(user => !user.isActive).length}
                    isicon={true}
                    color="bg-amber-50 text-amber-500"
                    icon={<CheckCircle size={22} />}
                />
                {
                    selectedRole !== "All Roles" && (
                        <KPICard
                            title={`Total ${selectedRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}s`}
                            value={users.filter(user => user.role === selectedRole).length}
                            isicon={true}
                            color="bg-purple-50 text-purple-500"
                            icon={<ShieldCheck size={22} />}
                        />
                    )
                }
                
            </div>
            {/* User Management Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflaw-hidden">
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400"
                        />
                    </div>

                    {/* dropdowns */}
                    <div className="flex items-center gap-3 w full sm:w-auto">
                        <div className="relative">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 py-2 pl-3.5 pr-8 rounded-lg outline-none cursor-pointer focus:border-orange-500"
                                >
                                    <option value="All Roles">All Roles</option>
                                    <option value="super_user">Super Admin</option>
                                    <option value="hub_manager">Hub manager</option>
                                    <option value="delivery_agent">Delivery agent</option>
                                    <option value="admin">Business Admin</option>
                                    <option value="customer">Customer</option>
                                    <option value="merchant">Merchant</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        </div>
                        <div className="relative">
                            <select 
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 py-2 pl-3.5 pr-8 rounded-lg outline-none cursor-pointer focus:border-orange-500"
                                >
                                    <option value="All Statuses">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending">Pending Approval</option>
                                    <option value="suspended">Suspended</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <AdminTable
                    columns={userColumns}
                    data={filteredUsers}
                    isLoading={loading}
                    loadingMessage="Loading users..."
                    emptyMessage="No users found."
                    error={error}
                />
            </div>
            <AddOrEditUserModal
                isOpen={modalState.isOpen}
                userToEdit={modalState.user}
                onClose={() => setModalState({ isOpen: false, user: null })}
                onSuccess={handleSuccess}
            />
        </div>
    )
}

export default UserManagement;