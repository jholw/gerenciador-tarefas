import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('@taskflow:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('@taskflow:refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('@taskflow:token', accessToken);
          localStorage.setItem('@taskflow:refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('@taskflow:token');
        localStorage.removeItem('@taskflow:refreshToken');
        localStorage.removeItem('@taskflow:user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ==================== Auth Services ====================
export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/profile', data),

  getAllUsers: () => api.get('/auth/users'),
};

// ==================== Project Services ====================
export const projectService = {
  list: () => api.get('/projects'),

  getById: (id: string) => api.get(`/projects/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),

  update: (id: string, data: any) => api.put(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),

  addMember: (projectId: string, userId: string, role?: string) =>
    api.post(`/projects/${projectId}/members`, { userId, role }),

  removeMember: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),

  getStats: (id: string) => api.get(`/projects/${id}/stats`),

  getColumns: (projectId: string) => api.get(`/projects/${projectId}/columns`),

  createColumn: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/columns`, data),

  updateColumn: (columnId: string, data: any) =>
    api.put(`/projects/columns/${columnId}`, data),

  deleteColumn: (columnId: string) =>
    api.delete(`/projects/columns/${columnId}`),

  reorderColumns: (projectId: string, columnIds: string[]) =>
    api.put(`/projects/${projectId}/columns/reorder`, { columnIds }),
};

// ==================== Task Services ====================
export const taskService = {
  list: (projectId: string, params?: any) =>
    api.get(`/projects/${projectId}/tasks`, { params }),

  getById: (id: string) => api.get(`/projects/tasks/${id}`),

  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/tasks`, data),

  update: (id: string, data: any) => api.put(`/projects/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/projects/tasks/${id}`),

  addComment: (taskId: string, comment: string) =>
    api.post(`/projects/tasks/${taskId}/comments`, { comment }),

  addSubtask: (taskId: string, title: string) =>
    api.post(`/projects/tasks/${taskId}/subtasks`, { title }),

  toggleSubtask: (taskId: string, subtaskId: string) =>
    api.put(`/projects/tasks/${taskId}/subtasks/${subtaskId}`),
};

// ==================== Sprint Services ====================
export const sprintService = {
  list: (projectId: string) => api.get(`/projects/${projectId}/sprints`),

  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/sprints`, data),

  start: (sprintId: string) => api.put(`/projects/sprints/${sprintId}/start`),

  complete: (sprintId: string) =>
    api.put(`/projects/sprints/${sprintId}/complete`),

  getBurndown: (sprintId: string) =>
    api.get(`/projects/sprints/${sprintId}/burndown`),

  getVelocity: (projectId: string) =>
    api.get(`/projects/${projectId}/velocity`),
};

// ==================== Chat Services ====================
export const chatService = {
  getMessages: (projectId: string) => api.get(`/chat/${projectId}`),

  sendMessage: (projectId: string, message: string) =>
    api.post(`/chat/${projectId}`, { message }),
};

// ==================== Notification Services ====================
export const notificationService = {
  list: () => api.get('/notifications'),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  create: (data: any) => api.post('/notifications', data),
};

// ==================== Reminder Services ====================
export const reminderService = {
  list: () => api.get('/reminders'),

  create: (data: any) => api.post('/reminders', data),

  update: (id: string, data: any) => api.put(`/reminders/${id}`, data),

  toggle: (id: string) => api.put(`/reminders/${id}/toggle`),

  delete: (id: string) => api.delete(`/reminders/${id}`),
};

// ==================== Backlog Services ====================
export const backlogService = {
  list: (projectId: string) => api.get(`/backlog/${projectId}`),

  create: (projectId: string, data: any) =>
    api.post(`/backlog/${projectId}`, data),

  update: (projectId: string, id: string, data: any) =>
    api.put(`/backlog/${projectId}/${id}`, data),

  moveToSprint: (projectId: string, id: string, sprintId: string) =>
    api.post(`/backlog/${projectId}/${id}/move-to-sprint`, { sprintId }),

  delete: (projectId: string, id: string) =>
    api.delete(`/backlog/${projectId}/${id}`),
};

// ==================== Standup Services ====================
export const standupService = {
  list: (projectId: string) => api.get(`/standups/${projectId}`),

  create: (projectId: string, data: any) =>
    api.post(`/standups/${projectId}`, data),

  getHistory: (projectId: string, days?: number) =>
    api.get(`/standups/${projectId}/history`, { params: { days } }),
};

// ==================== Retrospective Services ====================
export const retrospectiveService = {
  list: (projectId: string) => api.get(`/retrospectives/${projectId}`),

  create: (projectId: string, data: any) =>
    api.post(`/retrospectives/${projectId}`, data),

  getBySprint: (sprintId: string) =>
    api.get(`/retrospectives/sprint/${sprintId}`),
};