
'use client'

import AccountantDashboard from '../accountant/page';

export default function AdminDashboardPage() {
    // The Admin is now treated as an accountant for a single firm.
    // This page now shows the main accountant dashboard.
    // The theme is controlled globally in the sidebar.
    return <AccountantDashboard />;
}
