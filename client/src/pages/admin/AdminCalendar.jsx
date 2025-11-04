import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import SectionTitle from '../../components/SectionTitle.jsx';
import { useAdminDashboard } from './AdminDashboardContext.jsx';

const NEW_APPOINTMENT_TEMPLATE = {
  client_id: '',
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  status: 'pending',
  scheduled_start: '',
  duration_minutes: '',
  assigned_admin_id: '',
  client_description: ''
};

const NEW_APPOINTMENT_FIELD_IDS = {
  clientId: 'new-appointment-client-id',
  status: 'new-appointment-status',
  guestName: 'new-appointment-guest-name',
  guestEmail: 'new-appointment-guest-email',
  scheduledStart: 'new-appointment-scheduled-start',
  duration: 'new-appointment-duration',
  assignedAdmin: 'new-appointment-assigned-admin',
  guestPhone: 'new-appointment-guest-phone',
  description: 'new-appointment-description'
};

const NEW_DAY_OFF_ID = 'new-day-off-date';

const WEEK_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEK_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (input) => input.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateTimeLocal(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function buildAppointmentUpdatePayload(draft) {
  return {
    status: draft.status?.trim() || 'pending',
    scheduled_start: draft.scheduled_start ? fromDateTimeLocal(draft.scheduled_start) : null,
    duration_minutes: draft.duration_minutes ? Number(draft.duration_minutes) : null,
    assigned_admin_id: draft.assigned_admin_id ? Number(draft.assigned_admin_id) : null,
    client_description: draft.client_description?.trim() || null
  };
}

function buildAppointmentCreatePayload(draft) {
  return {
    status: draft.status?.trim() || 'pending',
    client_id: draft.client_id ? Number(draft.client_id) : undefined,
    guest_name: draft.guest_name?.trim() || undefined,
    guest_email: draft.guest_email?.trim() || undefined,
    guest_phone: draft.guest_phone?.trim() || undefined,
    scheduled_start: draft.scheduled_start ? fromDateTimeLocal(draft.scheduled_start) : null,
    duration_minutes: draft.duration_minutes ? Number(draft.duration_minutes) : null,
    assigned_admin_id: draft.assigned_admin_id ? Number(draft.assigned_admin_id) : null,
    client_description: draft.client_description?.trim() || undefined
  };
}

function normaliseOperatingHours(hours) {
  const incoming = new Map();
  ensureArray(hours).forEach((entry) => {
    if (entry?.day) {
      incoming.set(entry.day, {
        day: entry.day,
        is_open: Boolean(entry.is_open),
        open_time: entry.open_time || '10:00',
        close_time: entry.close_time || '18:00'
      });
    }
  });
  return WEEK_ORDER.map((day) => {
    if (incoming.has(day)) {
      return { ...incoming.get(day) };
    }
    const defaults =
      day === 'saturday'
        ? { open_time: '10:00', close_time: '16:00' }
        : day === 'sunday'
        ? { open_time: '10:00', close_time: '14:00', is_open: false }
        : { open_time: '10:00', close_time: '18:00', is_open: true };
    return {
      day,
      is_open: defaults.is_open ?? true,
      open_time: defaults.open_time,
      close_time: defaults.close_time
    };
  });
}

function ensureArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

export default function AdminCalendar() {
  const {
    state: { appointments, admins, schedule },
    actions: {
      setFeedback,
      createAppointment,
      updateAppointment,
      deleteAppointment,
      updateSchedule
    }
  } = useAdminDashboard();
  const navigate = useNavigate();

  const [appointmentDrafts, setAppointmentDrafts] = useState({});
  const [newAppointmentDraft, setNewAppointmentDraft] = useState(NEW_APPOINTMENT_TEMPLATE);
  const [hoursDraft, setHoursDraft] = useState(normaliseOperatingHours(schedule.operating_hours));
  const [daysOffDraft, setDaysOffDraft] = useState(ensureArray(schedule.days_off));
  const [newDayOff, setNewDayOff] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    const drafts = {};
    appointments.forEach((appointment) => {
      drafts[appointment.id] = {
        status: appointment.status || 'pending',
        scheduled_start: toDateTimeLocal(appointment.scheduled_start),
        duration_minutes: appointment.duration_minutes ?? '',
        assigned_admin_id: appointment.assigned_admin?.id ? String(appointment.assigned_admin.id) : '',
        client_description: appointment.client_description || ''
      };
    });
    setAppointmentDrafts(drafts);
  }, [appointments]);

  useEffect(() => {
    setHoursDraft(normaliseOperatingHours(schedule.operating_hours));
  }, [schedule.operating_hours]);

  useEffect(() => {
    setDaysOffDraft(ensureArray(schedule.days_off).slice().sort());
  }, [schedule.days_off]);

  const adminOptions = useMemo(
    () => admins.map((admin) => ({ value: String(admin.id), label: admin.name })),
    [admins]
  );

  const sortedAppointments = useMemo(() => {
    return appointments
      .slice()
      .sort((a, b) => {
        const aTime = a.scheduled_start ? new Date(a.scheduled_start).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduled_start ? new Date(b.scheduled_start).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime === bTime) {
          return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
        }
        return aTime - bTime;
      });
  }, [appointments]);

  const handleAppointmentDraftChange = (appointmentId, field, value) => {
    setAppointmentDrafts((prev) => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        [field]: value
      }
    }));
  };

  const handleCreateDraftChange = (field, value) => {
    setNewAppointmentDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHoursDraftChange = (day, field, value) => {
    setHoursDraft((prev) =>
      prev.map((entry) => {
        if (entry.day !== day) {
          return entry;
        }
        if (field === 'is_open') {
          return { ...entry, is_open: value };
        }
        return { ...entry, [field]: value };
      })
    );
  };

  const requestAppointmentUpdate = (appointmentId) => {
    const draft = appointmentDrafts[appointmentId];
    if (!draft) {
      return;
    }
    const payload = buildAppointmentUpdatePayload(draft);
    if (!payload.status) {
      setFeedback({ tone: 'offline', message: 'Status is required.' });
      return;
    }
    setConfirmation({
      type: 'update',
      appointmentId,
      payload,
      title: 'Update appointment',
      description: `Apply scheduling changes to appointment #${appointmentId}?`
    });
  };

  const requestAppointmentDelete = (appointment) => {
    setConfirmation({
      type: 'delete',
      appointmentId: appointment.id,
      title: 'Delete appointment',
      description: `This will remove appointment ${appointment.reference_code || `#${appointment.id}`}.`
    });
  };

  const requestAppointmentCreate = () => {
    const payload = buildAppointmentCreatePayload(newAppointmentDraft);
    if (!payload.client_id && (!payload.guest_name || !payload.guest_email)) {
      setFeedback({ tone: 'offline', message: 'Provide client ID or guest name and email.' });
      return;
    }
    setConfirmation({
      type: 'create',
      payload,
      title: 'Create appointment',
      description: 'Add this appointment to the calendar?'
    });
  };

  const requestScheduleUpdate = () => {
    setConfirmation({
      type: 'schedule',
      payload: {
        operating_hours: hoursDraft,
        days_off: daysOffDraft
      },
      title: 'Update studio schedule',
      description: 'Save these operating hours and days off?'
    });
  };

  const handleConfirm = async () => {
    if (!confirmation) {
      return;
    }
    setConfirmBusy(true);
    try {
      if (confirmation.type === 'create') {
        await createAppointment(confirmation.payload);
        setNewAppointmentDraft(NEW_APPOINTMENT_TEMPLATE);
      } else if (confirmation.type === 'update') {
        await updateAppointment(confirmation.appointmentId, confirmation.payload);
      } else if (confirmation.type === 'delete') {
        await deleteAppointment(confirmation.appointmentId);
      } else if (confirmation.type === 'schedule') {
        await updateSchedule(confirmation.payload);
      }
      setConfirmation(null);
    } catch (err) {
      setFeedback({
        tone: 'offline',
        message:
          confirmation.type === 'create'
            ? 'Unable to create appointment.'
            : confirmation.type === 'update'
            ? 'Unable to update appointment.'
            : confirmation.type === 'delete'
            ? 'Unable to delete appointment.'
            : 'Unable to update studio schedule.'
      });
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleAddDayOff = () => {
    if (!newDayOff) {
      return;
    }
    setDaysOffDraft((prev) => {
      if (prev.includes(newDayOff)) {
        return prev;
      }
      return [...prev, newDayOff].sort();
    });
    setNewDayOff('');
  };

  const handleRemoveDayOff = (day) => {
    setDaysOffDraft((prev) => prev.filter((entry) => entry !== day));
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Admin"
        title="Calendar & availability"
        description="Coordinate sessions, confirm booking changes, and control studio availability."
      />

      <Card className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Create appointment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Schedule a new session for an existing client or guest.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.clientId}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Client ID
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.clientId}
              type="number"
              min="1"
              value={newAppointmentDraft.client_id}
              onChange={(event) => handleCreateDraftChange('client_id', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
              placeholder="Optional"
            />
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.status}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Status
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.status}
              type="text"
              value={newAppointmentDraft.status}
              onChange={(event) => handleCreateDraftChange('status', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
            />
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.guestName}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Guest name
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.guestName}
              type="text"
              value={newAppointmentDraft.guest_name}
              onChange={(event) => handleCreateDraftChange('guest_name', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
              placeholder="Required if no client ID"
            />
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.guestEmail}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Guest email
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.guestEmail}
              type="email"
              value={newAppointmentDraft.guest_email}
              onChange={(event) => handleCreateDraftChange('guest_email', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
              placeholder="Required if no client ID"
            />
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.scheduledStart}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Scheduled start
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.scheduledStart}
              type="datetime-local"
              value={newAppointmentDraft.scheduled_start}
              onChange={(event) => handleCreateDraftChange('scheduled_start', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
            />
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.duration}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Duration (minutes)
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.duration}
              type="number"
              min="0"
              step="15"
              value={newAppointmentDraft.duration_minutes}
              onChange={(event) => handleCreateDraftChange('duration_minutes', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
            />
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.assignedAdmin}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Assign admin
            </label>
            <select
              id={NEW_APPOINTMENT_FIELD_IDS.assignedAdmin}
              value={newAppointmentDraft.assigned_admin_id}
              onChange={(event) => handleCreateDraftChange('assigned_admin_id', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
            >
              <option value="">Unassigned</option>
              {adminOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={NEW_APPOINTMENT_FIELD_IDS.guestPhone}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Guest phone
            </label>
            <input
              id={NEW_APPOINTMENT_FIELD_IDS.guestPhone}
              type="tel"
              value={newAppointmentDraft.guest_phone}
              onChange={(event) => handleCreateDraftChange('guest_phone', event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
            />
          </div>
        </div>
        <label
          htmlFor={NEW_APPOINTMENT_FIELD_IDS.description}
          className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
        >
          Client notes
        </label>
        <textarea
          id={NEW_APPOINTMENT_FIELD_IDS.description}
          rows={3}
          value={newAppointmentDraft.client_description}
          onChange={(event) => handleCreateDraftChange('client_description', event.target.value)}
          placeholder="Notes from the client (optional)"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={requestAppointmentCreate}>
            Create appointment
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Confirmation required before the appointment is added.
          </p>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Upcoming appointments
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Adjust details and open the full page for more context.</p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            {sortedAppointments.length} scheduled
          </span>
        </div>
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => {
            const draft = appointmentDrafts[appointment.id] || {
              status: appointment.status || 'pending',
              scheduled_start: '',
              duration_minutes: '',
              assigned_admin_id: '',
              client_description: appointment.client_description || ''
            };
            const scheduledDate = appointment.scheduled_start ? new Date(appointment.scheduled_start) : null;
            const isDayOff =
              scheduledDate && daysOffDraft.includes(scheduledDate.toISOString().slice(0, 10));
            const baseId = `appointment-${appointment.id}`;
            const statusId = `${baseId}-status`;
            const startId = `${baseId}-start`;
            const durationId = `${baseId}-duration`;
            const adminId = `${baseId}-assigned-admin`;
            const notesId = `${baseId}-notes`;

            return (
              <div
                key={appointment.id}
                className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                      Ref {appointment.reference_code || appointment.id}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      {appointment.client?.display_name || appointment.guest_name} ·{' '}
                      {appointment.client?.email || appointment.guest_email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appointment.assets?.length || 0} asset{appointment.assets?.length === 1 ? '' : 's'} attached
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p>Status: {appointment.status}</p>
                    <p>
                      {scheduledDate
                        ? scheduledDate.toLocaleString()
                        : 'Awaiting schedule'}
                    </p>
                    {isDayOff ? (
                      <p className="text-[11px] uppercase tracking-[0.3em] text-red-500">Day off</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor={statusId}
                      className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </label>
                    <input
                      id={statusId}
                      type="text"
                      value={draft.status}
                      onChange={(event) => handleAppointmentDraftChange(appointment.id, 'status', event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={startId}
                      className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                    >
                      Scheduled start
                    </label>
                    <input
                      id={startId}
                      type="datetime-local"
                      value={draft.scheduled_start}
                      onChange={(event) =>
                        handleAppointmentDraftChange(appointment.id, 'scheduled_start', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={durationId}
                      className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                    >
                      Duration (minutes)
                    </label>
                    <input
                      id={durationId}
                      type="number"
                      min="0"
                      step="15"
                      value={draft.duration_minutes}
                      onChange={(event) =>
                        handleAppointmentDraftChange(appointment.id, 'duration_minutes', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={adminId}
                      className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                    >
                      Assigned admin
                    </label>
                    <select
                      id={adminId}
                      value={draft.assigned_admin_id}
                      onChange={(event) =>
                        handleAppointmentDraftChange(appointment.id, 'assigned_admin_id', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                    >
                      <option value="">Unassigned</option>
                      {adminOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor={notesId}
                    className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                  >
                    Notes
                  </label>
                  <textarea
                    id={notesId}
                    rows={3}
                    value={draft.client_description}
                    onChange={(event) =>
                      handleAppointmentDraftChange(appointment.id, 'client_description', event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={() => requestAppointmentUpdate(appointment.id)}>
                    Save changes
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => navigate(`${appointment.id}`)}>
                    View details
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => requestAppointmentDelete(appointment)}>
                    Delete
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated {appointment.updated_at ? new Date(appointment.updated_at).toLocaleString() : 'n/a'}
                  </p>
                </div>
              </div>
            );
          })}
          {!sortedAppointments.length ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No appointments scheduled yet. New bookings will appear here.
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Studio operating hours
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Select open days and adjust the available time range for bookings.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Applied weekly
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {hoursDraft.map((entry) => {
            const openId = `${entry.day}-open-time`;
            const closeId = `${entry.day}-close-time`;
            return (
              <div
                key={entry.day}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    <input
                      type="checkbox"
                      checked={entry.is_open}
                      onChange={(event) => handleHoursDraftChange(entry.day, 'is_open', event.target.checked)}
                      className="h-4 w-4 rounded border border-gray-400 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:focus:ring-gray-400"
                    />
                    {WEEK_LABELS[entry.day]}
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={openId}
                      className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                    >
                      Open
                    </label>
                    <input
                      id={openId}
                      type="time"
                      value={entry.open_time}
                      onChange={(event) => handleHoursDraftChange(entry.day, 'open_time', event.target.value)}
                      disabled={!entry.is_open}
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={closeId}
                      className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
                    >
                      Close
                    </label>
                    <input
                      id={closeId}
                      type="time"
                      value={entry.close_time}
                      onChange={(event) => handleHoursDraftChange(entry.day, 'close_time', event.target.value)}
                      disabled={!entry.is_open}
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Days off
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Block out studio closures before booking slots are offered.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor={NEW_DAY_OFF_ID}
              className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400"
            >
              Date
            </label>
            <input
              id={NEW_DAY_OFF_ID}
              type="date"
              value={newDayOff}
              onChange={(event) => setNewDayOff(event.target.value)}
              className="mt-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400"
            />
          </div>
          <Button type="button" onClick={handleAddDayOff}>
            Add day off
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {daysOffDraft.map((day) => (
            <span
              key={day}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-600 dark:border-gray-800 dark:text-gray-300"
            >
              {new Date(day).toLocaleDateString()}
              <button
                type="button"
                onClick={() => handleRemoveDayOff(day)}
                className="text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                ×
              </button>
            </span>
          ))}
          {!daysOffDraft.length ? (
            <span className="rounded-full border border-dashed border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No days off recorded
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={requestScheduleUpdate}>
            Save schedule
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A confirmation modal appears before the changes are published.
          </p>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? 'Confirm'}
        description={confirmation?.description ?? ''}
        confirmLabel={
          confirmation?.type === 'delete'
            ? 'Delete'
            : confirmation?.type === 'create'
            ? 'Create'
            : 'Save'
        }
        onConfirm={handleConfirm}
        onClose={() => {
          if (!confirmBusy) {
            setConfirmation(null);
          }
        }}
        busy={confirmBusy}
      >
        {confirmation?.type === 'update' && confirmation?.appointmentId ? (
          <p>
            Appointment <strong>#{confirmation.appointmentId}</strong> will be updated with the new details.
          </p>
        ) : null}
        {confirmation?.type === 'create' ? (
          <p>
            Status set to <strong>{confirmation.payload.status}</strong>.{' '}
            {confirmation.payload.scheduled_start
              ? `Proposed start: ${new Date(confirmation.payload.scheduled_start).toLocaleString()}.`
              : 'No start date provided.'}
          </p>
        ) : null}
        {confirmation?.type === 'delete' ? (
          <p>This action cannot be undone.</p>
        ) : null}
        {confirmation?.type === 'schedule' ? (
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {confirmation.payload.operating_hours
              .filter((entry) => entry.is_open)
              .map((entry) => (
                <li key={entry.day}>
                  {WEEK_LABELS[entry.day]}: {entry.open_time} - {entry.close_time}
                </li>
              ))}
            {confirmation.payload.days_off.length ? (
              <li>Days off: {confirmation.payload.days_off.join(', ')}</li>
            ) : null}
          </ul>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
