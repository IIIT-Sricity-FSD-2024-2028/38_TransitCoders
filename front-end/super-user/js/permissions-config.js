/**
 * Constant defining the full RBAC system parameters
 * This configuration acts as the shared schema and initial seed data for permissions.
 */

window.PermissionsConfig = {
    // Defines the structure of the UI Matrix
    modules: [
        {
            id: 'mod_user_mgmt',
            name: 'User Management',
            permissions: [
                { key: 'view_users', label: 'View Users' },
                { key: 'create_users', label: 'Create Users' },
                { key: 'edit_users', label: 'Edit Users' },
                { key: 'delete_users', label: 'Delete Users' },
                { key: 'suspend_users', label: 'Suspend Users' },
                { key: 'assign_roles', label: 'Assign Roles' }
            ]
        },
        {
            id: 'mod_shipment_mgmt',
            name: 'Shipment Management',
            permissions: [
                { key: 'view_all_shipments', label: 'View All Shipments' },
                { key: 'create_shipment', label: 'Create Shipment' },
                { key: 'edit_shipment', label: 'Edit Shipment' },
                { key: 'cancel_shipment', label: 'Cancel Shipment' },
                { key: 'view_own_shipment_only', label: 'View Own Shipment Only' }
            ]
        },
        {
            id: 'mod_complaints_mgmt',
            name: 'Complaints Management',
            permissions: [
                { key: 'view_complaints', label: 'View Complaints' },
                { key: 'resolve_complaints', label: 'Resolve Complaints' },
                { key: 'escalate_complaints', label: 'Escalate Complaints' }
            ]
        },
        {
            id: 'mod_ops_monitoring',
            name: 'Operations Monitoring',
            permissions: [
                { key: 'view_live_shipments', label: 'View Live Shipments' },
                { key: 'view_hub_status', label: 'View Hub Status' },
                { key: 'view_delayed_deliveries', label: 'View Delayed Deliveries' }
            ]
        },
        {
            id: 'mod_reports',
            name: 'Reports & Analytics',
            permissions: [
                { key: 'view_reports', label: 'View Reports' },
                { key: 'export_reports', label: 'Export Reports' },
                { key: 'revenue_analytics', label: 'Revenue Analytics' },
                { key: 'complaint_analytics', label: 'Complaint Analytics' }
            ]
        },
        {
            id: 'mod_sys_config',
            name: 'System Configuration',
            permissions: [
                { key: 'edit_platform_settings', label: 'Edit Platform Settings' },
                { key: 'configure_hubs', label: 'Configure Hubs' },
                { key: 'configure_routes', label: 'Configure Routes' },
                { key: 'manage_api_integrations', label: 'Manage API Integrations' }
            ]
        },
        {
            id: 'mod_security_logs',
            name: 'Security Logs',
            permissions: [
                { key: 'view_logs', label: 'View Logs' },
                { key: 'export_logs', label: 'Export Logs' },
                { key: 'delete_logs', label: 'Delete Logs' }
            ]
        },
        {
            id: 'mod_db_mgmt',
            name: 'Database Management',
            permissions: [
                { key: 'backup_database', label: 'Backup Database' },
                { key: 'restore_database', label: 'Restore Database' },
                { key: 'clear_old_logs', label: 'Clear Old Logs' }
            ]
        }
    ],

    // Default configuration mapped to role identifiers
    defaultRoles: [
        {
            id: 'super_user',
            name: 'Super User',
            description: 'Unrestricted access to all modules and configurations.',
            isSystem: true,
            permissions: {
                view_users: true, create_users: true, edit_users: true, delete_users: true, suspend_users: true, assign_roles: true,
                view_all_shipments: true, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: true, view_hub_status: true, view_delayed_deliveries: true,
                view_reports: true, export_reports: true, revenue_analytics: true, complaint_analytics: true,
                edit_platform_settings: true, configure_hubs: true, configure_routes: true, manage_api_integrations: true,
                view_logs: true, export_logs: true, delete_logs: true,
                backup_database: true, restore_database: true, clear_old_logs: true
            }
        },
        {
            id: 'admin',
            name: 'Admin',
            description: 'Manage most configurations except destructive core actions.',
            isSystem: false,
            permissions: {
                view_users: true, create_users: true, edit_users: true, delete_users: false, suspend_users: true, assign_roles: false,
                view_all_shipments: true, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: true, view_hub_status: true, view_delayed_deliveries: true,
                view_reports: true, export_reports: true, revenue_analytics: true, complaint_analytics: true,
                edit_platform_settings: true, configure_hubs: true, configure_routes: true, manage_api_integrations: false,
                view_logs: true, export_logs: true, delete_logs: false,
                backup_database: true, restore_database: false, clear_old_logs: true
            }
        },
        {
            id: 'hub_manager',
            name: 'Hub Manager',
            description: 'Handles shipments and operations monitoring for their designated hub.',
            isSystem: false,
            permissions: {
                view_users: false, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: true, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: true, view_hub_status: true, view_delayed_deliveries: true,
                view_reports: true, export_reports: true, revenue_analytics: false, complaint_analytics: false,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        },
        {
            id: 'merchant',
            name: 'Merchant',
            description: 'Can build and track their own shipments only.',
            isSystem: false,
            permissions: {
                view_users: false, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: false, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: true,
                view_complaints: false, resolve_complaints: false, escalate_complaints: false,
                view_live_shipments: false, view_hub_status: false, view_delayed_deliveries: false,
                view_reports: false, export_reports: false, revenue_analytics: false, complaint_analytics: false,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        },
        {
            id: 'delivery_agent',
            name: 'Delivery Agent',
            description: 'Field agent dispatch tracking.',
            isSystem: false,
            permissions: {
                view_users: false, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: false, create_shipment: false, edit_shipment: true, cancel_shipment: false, view_own_shipment_only: true,
                view_complaints: false, resolve_complaints: false, escalate_complaints: false,
                view_live_shipments: false, view_hub_status: false, view_delayed_deliveries: false,
                view_reports: false, export_reports: false, revenue_analytics: false, complaint_analytics: false,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        },
        {
            id: 'support_staff',
            name: 'Support Staff',
            description: 'Manages incoming customer complaints and general inquiries.',
            isSystem: false,
            permissions: {
                view_users: true, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: true, create_shipment: false, edit_shipment: false, cancel_shipment: false, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: false, view_hub_status: false, view_delayed_deliveries: false,
                view_reports: true, export_reports: false, revenue_analytics: false, complaint_analytics: true,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        }
    ]
};
