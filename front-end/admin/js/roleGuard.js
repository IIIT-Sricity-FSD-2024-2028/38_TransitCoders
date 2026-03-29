/**
 * Admin Role Guard
 * Blocks access to super-user-only pages if opened manually.
 */
(function () {
    const restrictedPages = [
        'user-management.html',
        'roles-permissions.html',
        'security-logs.html',
        'system-configuration.html',
        'database-management.html'
    ];

    const currentPage = window.location.pathname.split('/').pop();

    if (restrictedPages.includes(currentPage)) {
        window.location.href = 'access-denied.html';
    }
})();
