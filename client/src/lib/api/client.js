const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_ORIGIN = (() => {
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000';
  return new URL(API_BASE_URL, fallbackOrigin).origin;
})();

const buildUrl = (path, query) => {
  if (!query) {
    return `${API_BASE_URL}${path}`;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
};

const apiRequest = async (path, options = {}) => {
  const { token, headers, body, query, ...restOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    headers: {
      ...(!isFormData && body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    ...restOptions
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    error.fieldErrors = payload?.errors?.fieldErrors || payload?.details?.fieldErrors || {};
    throw error;
  }

  return payload;
};

export const resolveApiAssetUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  return new URL(assetPath, API_ORIGIN).toString();
};

export const api = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
  getHealth: () => apiRequest('/health'),
  getCategories: () => apiRequest('/categories'),
  getCurrentUser: (token) => apiRequest('/auth/me', { token }),
  getPosts: (query) => apiRequest('/posts', { query }),
  getMyPosts: (token, query) => apiRequest('/posts/mine', { token, query }),
  getPost: (identifier, token) => apiRequest(`/posts/${identifier}`, { token }),
  createPost: (body, token) => apiRequest('/posts', { method: 'POST', body, token }),
  updatePost: (identifier, body, token) =>
    apiRequest(`/posts/${identifier}`, { method: 'PATCH', body, token }),
  deletePost: (identifier, token) =>
    apiRequest(`/posts/${identifier}`, { method: 'DELETE', token }),
  getPublicProfile: (userId, token) => apiRequest(`/users/${userId}`, { token }),
  updateOwnProfile: (body, token) => apiRequest('/users/me', { method: 'PATCH', body, token }),
  changeOwnPassword: (body, token) =>
    apiRequest('/users/me/password', { method: 'POST', body, token }),
  getConversations: (token) => apiRequest('/conversations', { token }),
  createConversation: (body, token) => apiRequest('/conversations', { method: 'POST', body, token }),
  getConversation: (conversationId, token) => apiRequest(`/conversations/${conversationId}`, { token }),
  getConversationMessages: (conversationId, token) =>
    apiRequest(`/conversations/${conversationId}/messages`, { token }),
  markConversationRead: (conversationId, token) =>
    apiRequest(`/conversations/${conversationId}/read`, { method: 'POST', token }),
  sendConversationMessage: (conversationId, body, token) =>
    apiRequest(`/conversations/${conversationId}/messages`, { method: 'POST', body, token }),
  getAdminStats: (token) => apiRequest('/admin/stats', { token }),
  getAdminUsers: (token, query) => apiRequest('/admin/users', { token, query }),
  updateAdminUserStatus: (userId, body, token) =>
    apiRequest(`/admin/users/${userId}`, { method: 'PATCH', body, token }),
  getAdminPosts: (token, query) => apiRequest('/admin/posts', { token, query }),
  updateAdminPostStatus: (postId, body, token) =>
    apiRequest(`/admin/posts/${postId}`, { method: 'PATCH', body, token })
};
