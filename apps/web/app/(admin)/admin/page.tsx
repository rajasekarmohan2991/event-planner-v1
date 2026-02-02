import { AdminDashboardClient } from './components/admin-dashboard-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export default function AdminDashboard() {
  return <AdminDashboardClient />;
}
