import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload } from '../../lib/api.js';

export const ASSET_KIND_OPTIONS = [
  { value: 'note', label: 'Admin note' },
  { value: 'inspiration_image', label: 'Reference image' },
  { value: 'document', label: 'Document' }
];

const AdminDashboardContext = createContext(null);

function ensureArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

export function AdminDashboardProvider({ children }) {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [admins, setAdmins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [overview, setOverview] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [activityTracking, setActivityTracking] = useState([]);
  const [analytics, setAnalytics] = useState({ appointments_by_status: {}, gallery_items_by_category: {} });
  const [settings, setSettings] = useState([]);
  const [schedule, setSchedule] = useState({ operating_hours: [], days_off: [] });

  const applyDashboard = useCallback((dashboard) => {
    if (!dashboard) {
      return;
    }
    setOverview(dashboard.overview || null);

    const userManagement = dashboard.user_management || {};
    setRecentUsers(ensureArray(userManagement.recent_users));
    setAvailableRoles(ensureArray(userManagement.available_roles));

    setActivityTracking(ensureArray(dashboard.activity_tracking));
    setAnalytics(dashboard.analytics || { appointments_by_status: {}, gallery_items_by_category: {} });
    setSettings(ensureArray(dashboard.system_settings));

    if (dashboard.admin) {
      setCurrentAdmin(dashboard.admin);
    }

    if (dashboard.content_control?.gallery_items) {
      setGalleryItems(ensureArray(dashboard.content_control.gallery_items));
    }
  }, []);

  const refreshDashboardMetrics = useCallback(async () => {
    const dashboard = await apiGet('/api/dashboard/admin');
    applyDashboard(dashboard);
    return dashboard;
  }, [applyDashboard]);

  const refreshAdmins = useCallback(async () => {
    const response = await apiGet('/api/admin/admins');
    setAdmins(ensureArray(response));
    return response;
  }, []);

  const refreshCategories = useCallback(async () => {
    const response = await apiGet('/api/admin/categories');
    setCategories(ensureArray(response));
    return response;
  }, []);

  const refreshAppointments = useCallback(async () => {
    const response = await apiGet('/api/admin/appointments');
    setAppointments(ensureArray(response));
    return response;
  }, []);

  const refreshSchedule = useCallback(async () => {
    const response = await apiGet('/api/admin/schedule');
    setSchedule({
      operating_hours: ensureArray(response?.operating_hours),
      days_off: ensureArray(response?.days_off)
    });
    return response;
  }, []);

  const refreshGalleryItems = useCallback(async () => {
    const response = await apiGet('/api/gallery?include_unpublished=true');
    setGalleryItems(ensureArray(response));
    return response;
  }, []);

  const refreshAll = useCallback(async () => {
    const [dashboard, adminList, categoryList, appointmentList, scheduleData, galleryList] = await Promise.all([
      apiGet('/api/dashboard/admin'),
      apiGet('/api/admin/admins'),
      apiGet('/api/admin/categories'),
      apiGet('/api/admin/appointments'),
      apiGet('/api/admin/schedule'),
      apiGet('/api/gallery?include_unpublished=true')
    ]);

    applyDashboard(dashboard);
    setAdmins(ensureArray(adminList));
    setCategories(ensureArray(categoryList));
    setAppointments(ensureArray(appointmentList));
    setSchedule({
      operating_hours: ensureArray(scheduleData?.operating_hours),
      days_off: ensureArray(scheduleData?.days_off)
    });
    setGalleryItems(ensureArray(galleryList));

    setError(null);
    return dashboard;
  }, [applyDashboard]);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      setLoading(true);
      try {
        const session = await apiGet('/api/auth/session');
        if (ignore) {
          return;
        }
        if (session?.role !== 'admin') {
          navigate('/auth', { replace: true });
          return;
        }
        setCurrentAdmin(session.account);
        await refreshAll();
      } catch (err) {
        if (ignore) {
          return;
        }
        if (err.status === 401) {
          navigate('/auth', { replace: true });
        } else {
          setError('Unable to load admin dashboard.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [navigate, refreshAll]);

  const logout = useCallback(async () => {
    await authLogout();
    navigate('/auth', { replace: true });
  }, [authLogout, navigate]);

  const updateUserRole = useCallback(
    async (userId, role) => {
      await apiPatch(`/api/admin/users/${userId}/role`, { role });
      setFeedback({ tone: 'success', message: 'Role updated.' });
      await refreshDashboardMetrics();
    },
    [refreshDashboardMetrics]
  );

  const createCategory = useCallback(
    async (payload) => {
      await apiPost('/api/admin/categories', payload);
      setFeedback({ tone: 'success', message: 'Category created.' });
      await Promise.all([refreshCategories(), refreshDashboardMetrics()]);
    },
    [refreshCategories, refreshDashboardMetrics]
  );

  const updateCategory = useCallback(
    async (categoryId, payload) => {
      await apiPatch(`/api/admin/categories/${categoryId}`, payload);
      setFeedback({ tone: 'success', message: 'Category updated.' });
      await Promise.all([refreshCategories(), refreshDashboardMetrics()]);
    },
    [refreshCategories, refreshDashboardMetrics]
  );

  const toggleCategoryVisibility = useCallback(
    async (categoryId, isActive) => {
      await apiPatch(`/api/admin/categories/${categoryId}`, { is_active: isActive });
      setFeedback({ tone: 'success', message: `Category ${isActive ? 'activated' : 'hidden'}.` });
      await Promise.all([refreshCategories(), refreshDashboardMetrics()]);
    },
    [refreshCategories, refreshDashboardMetrics]
  );

  const deleteCategory = useCallback(
    async (categoryId) => {
      await apiDelete(`/api/admin/categories/${categoryId}`);
      setFeedback({ tone: 'success', message: 'Category deleted.' });
      await Promise.all([refreshCategories(), refreshDashboardMetrics()]);
    },
    [refreshCategories, refreshDashboardMetrics]
  );

  const uploadMedia = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload('/api/admin/uploads', formData);
  }, []);

  const createGalleryItem = useCallback(
    async (payload) => {
      await apiPost('/api/admin/gallery', payload);
      setFeedback({ tone: 'success', message: 'Gallery item created.' });
      await Promise.all([refreshGalleryItems(), refreshDashboardMetrics()]);
    },
    [refreshGalleryItems, refreshDashboardMetrics]
  );

  const updateGalleryItem = useCallback(
    async (itemId, payload) => {
      await apiPatch(`/api/admin/gallery/${itemId}`, payload);
      setFeedback({ tone: 'success', message: 'Gallery item updated.' });
      await Promise.all([refreshGalleryItems(), refreshDashboardMetrics()]);
    },
    [refreshGalleryItems, refreshDashboardMetrics]
  );

  const deleteGalleryItem = useCallback(
    async (itemId) => {
      await apiDelete(`/api/admin/gallery/${itemId}`);
      setFeedback({ tone: 'success', message: 'Gallery item removed.' });
      await Promise.all([refreshGalleryItems(), refreshDashboardMetrics()]);
    },
    [refreshGalleryItems, refreshDashboardMetrics]
  );

  const createAppointment = useCallback(
    async (payload) => {
      const appointment = await apiPost('/api/admin/appointments', payload);
      setFeedback({ tone: 'success', message: 'Appointment created.' });
      await Promise.all([refreshAppointments(), refreshDashboardMetrics()]);
      return appointment;
    },
    [refreshAppointments, refreshDashboardMetrics]
  );

  const updateAppointment = useCallback(
    async (appointmentId, payload) => {
      await apiPatch(`/api/admin/appointments/${appointmentId}`, payload);
      setFeedback({ tone: 'success', message: 'Appointment updated.' });
      await Promise.all([refreshAppointments(), refreshDashboardMetrics()]);
    },
    [refreshAppointments, refreshDashboardMetrics]
  );

  const deleteAppointment = useCallback(
    async (appointmentId) => {
      await apiDelete(`/api/admin/appointments/${appointmentId}`);
      setFeedback({ tone: 'success', message: 'Appointment deleted.' });
      await Promise.all([refreshAppointments(), refreshDashboardMetrics()]);
    },
    [refreshAppointments, refreshDashboardMetrics]
  );

  const createAppointmentAsset = useCallback(
    async (appointmentId, payload) => {
      await apiPost(`/api/admin/appointments/${appointmentId}/assets`, payload);
      setFeedback({ tone: 'success', message: 'Asset attached to appointment.' });
      await refreshAppointments();
    },
    [refreshAppointments]
  );

  const toggleAppointmentAssetVisibility = useCallback(
    async (appointmentId, assetId, isVisible) => {
      await apiPatch(`/api/admin/appointments/${appointmentId}/assets/${assetId}`, {
        is_visible_to_client: isVisible
      });
      setFeedback({ tone: 'success', message: `Asset ${isVisible ? 'shared with client' : 'hidden from client'}.` });
      await refreshAppointments();
    },
    [refreshAppointments]
  );

  const updateSchedule = useCallback(
    async (payload) => {
      const response = await apiPut('/api/admin/schedule', payload);
      setSchedule({
        operating_hours: ensureArray(response?.operating_hours),
        days_off: ensureArray(response?.days_off)
      });
      setFeedback({ tone: 'success', message: 'Schedule updated.' });
      return response;
    },
    []
  );

  const value = useMemo(
    () => ({
      state: {
        currentAdmin,
        loading,
        error,
        feedback,
        overview,
        recentUsers,
        availableRoles,
        activityTracking,
        analytics,
        settings,
        admins,
        categories,
        galleryItems,
        appointments,
        schedule
      },
      actions: {
        setFeedback,
        clearFeedback: () => setFeedback(null),
        refreshAll,
        refreshDashboardMetrics,
        refreshAdmins,
        refreshCategories,
        refreshAppointments,
        refreshGalleryItems,
        refreshSchedule,
        logout,
        updateUserRole,
        createCategory,
        updateCategory,
        toggleCategoryVisibility,
        deleteCategory,
        uploadMedia,
        createGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        createAppointmentAsset,
        toggleAppointmentAssetVisibility,
        updateSchedule
      }
    }),
    [
      currentAdmin,
      loading,
      error,
      feedback,
      overview,
      recentUsers,
      availableRoles,
      activityTracking,
      analytics,
      settings,
      admins,
      categories,
      galleryItems,
      appointments,
      schedule,
      refreshAll,
      refreshDashboardMetrics,
      refreshAdmins,
      refreshCategories,
      refreshAppointments,
      refreshGalleryItems,
      refreshSchedule,
      logout,
      updateUserRole,
      createCategory,
      updateCategory,
      toggleCategoryVisibility,
      deleteCategory,
      uploadMedia,
      createGalleryItem,
      updateGalleryItem,
      deleteGalleryItem,
      createAppointment,
      updateAppointment,
      deleteAppointment,
      createAppointmentAsset,
      toggleAppointmentAssetVisibility,
      updateSchedule
    ]
  );

  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>;
}

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error('useAdminDashboard must be used within an AdminDashboardProvider');
  }
  return context;
}
