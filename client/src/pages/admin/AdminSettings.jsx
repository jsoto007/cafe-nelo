import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import SectionTitle from '../../components/SectionTitle.jsx';
import { useAdminDashboard } from './AdminDashboardContext.jsx';

const METRIC_KEYS = [
  { key: 'total_users', label: 'Total users' },
  { key: 'total_guests', label: 'Guest accounts' },
  { key: 'total_admins', label: 'Admins' },
  { key: 'total_appointments', label: 'Appointments' },
  { key: 'pending_appointments', label: 'Pending requests' },
  { key: 'published_gallery_items', label: 'Published gallery items' }
];

export default function AdminSettings() {
  const {
    state: { overview, recentUsers, availableRoles, analytics, activityTracking, settings },
    actions: { updateUserRole, refreshDashboardMetrics }
  } = useAdminDashboard();
  const [pendingRoleUserId, setPendingRoleUserId] = useState(null);

  const handleRoleChange = async (userId, role) => {
    setPendingRoleUserId(userId);
    try {
      await updateUserRole(userId, role);
    } finally {
      setPendingRoleUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Admin"
        title="Studio configuration"
        description="Monitor platform activity, adjust access, and review analytics in one place."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {METRIC_KEYS.map((metric) => (
          <Card key={metric.key} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              {metric.label}
            </p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {overview?.[metric.key] ?? '—'}
            </p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Recent users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Adjust access levels for the latest client profiles.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            {recentUsers.length} profiles
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {recentUsers.map((user) => {
            const selectId = `user-${user.id}-role`;
            return (
              <div
                key={user.id}
                className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.display_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div>
                  <label
                    htmlFor={selectId}
                    className="text-[11px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500"
                  >
                    Role
                  </label>
                  <select
                    id={selectId}
                    value={user.role}
                    disabled={pendingRoleUserId === user.id}
                    onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-2 py-1 text-xs uppercase tracking-[0.2em] text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-gray-400"
                  >
                    <option value={user.role}>{user.role}</option>
                    {availableRoles
                      .filter((role) => role !== user.role)
                      .map((role) => (
                        <option key={role} value={role} className="uppercase">
                          {role}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            );
          })}
          {!recentUsers.length ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No recent users to display.
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Appointments by status
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {Object.entries(analytics.appointments_by_status || {}).map(([status, count]) => (
              <li
                key={status}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
              >
                <span className="uppercase tracking-[0.25em] text-xs text-gray-500 dark:text-gray-400">{status}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </li>
            ))}
            {!Object.keys(analytics.appointments_by_status || {}).length ? (
              <li className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No appointment data yet.
              </li>
            ) : null}
          </ul>
        </Card>
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Gallery items by category
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {Object.entries(analytics.gallery_items_by_category || {}).map(([category, count]) => (
              <li
                key={category}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
              >
                <span className="uppercase tracking-[0.25em] text-xs text-gray-500 dark:text-gray-400">
                  {category}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </li>
            ))}
            {!Object.keys(analytics.gallery_items_by_category || {}).length ? (
              <li className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No gallery data yet.
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          Security & activity
        </h3>
        <div className="space-y-3">
          {activityTracking.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
            >
              <p className="font-semibold text-gray-900 dark:text-gray-100">{log.action}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{log.details || 'No details provided.'}</p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
                {log.admin?.name ?? 'System'} · {log.ip_address || 'n/a'} ·{' '}
                {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
              </p>
            </div>
          ))}
          {!activityTracking.length ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No recent activity has been recorded.
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              System settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Reference configuration values loaded for the studio infrastructure.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={refreshDashboardMetrics}>
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="rounded-xl border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                {setting.key}
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{setting.value}</p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
                {setting.is_editable ? 'Editable' : 'Locked'}
              </p>
            </div>
          ))}
          {!settings.length ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Configuration values will appear once synced from the API.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
