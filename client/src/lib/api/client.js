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

const parsePayload = (rawPayload) => {
  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload);
  } catch {
    return null;
  }
};

const buildApiError = ({ status, payload, fallbackMessage, code }) => {
  const error = new Error(payload?.message || fallbackMessage || `Request failed with status ${status}`);
  error.status = status;
  error.code = payload?.code || code || null;
  error.payload = payload;
  error.fieldErrors = payload?.errors?.fieldErrors || payload?.details?.fieldErrors || {};
  return error;
};

const apiMultipartRequest = (path, options = {}) =>
  new Promise((resolve, reject) => {
    const { token, headers, body, query, onUploadProgress, onUploadStageChange, timeoutMs = 120000 } = options;

    if (typeof XMLHttpRequest === 'undefined') {
      reject(
        buildApiError({
          status: 0,
          fallbackMessage: 'Multipart upload is not supported in this environment.',
          code: 'UNSUPPORTED_UPLOAD_ENV'
        })
      );
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(options.method || 'POST', buildUrl(path, query), true);
    xhr.responseType = 'text';
    xhr.timeout = timeoutMs;

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    Object.entries(headers || {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.addEventListener('loadstart', () => {
      onUploadStageChange?.('uploading');
      onUploadProgress?.(0);
    });

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onUploadStageChange?.('uploading');
      onUploadProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    });

    xhr.upload.addEventListener('load', () => {
      onUploadStageChange?.('processing');
      onUploadProgress?.(100);
    });

    xhr.onload = () => {
      const payload = parsePayload(xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
        return;
      }

      reject(
        buildApiError({
          status: xhr.status,
          payload,
          fallbackMessage: `Request failed with status ${xhr.status}`
        })
      );
    };

    xhr.onerror = () => {
      reject(
        buildApiError({
          status: xhr.status || 0,
          fallbackMessage: 'Network error while uploading files.',
          code: 'NETWORK_ERROR'
        })
      );
    };

    xhr.ontimeout = () => {
      reject(
        buildApiError({
          status: xhr.status || 0,
          fallbackMessage: 'Upload timed out.',
          code: 'UPLOAD_TIMEOUT'
        })
      );
    };

    xhr.onabort = () => {
      reject(
        buildApiError({
          status: xhr.status || 0,
          fallbackMessage: 'Upload was aborted.',
          code: 'REQUEST_ABORTED'
        })
      );
    };

    xhr.send(body);
  });

const apiRequest = async (path, options = {}) => {
  const { token, headers, body, query, ...restOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (isFormData) {
    return apiMultipartRequest(path, options);
  }

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
    throw buildApiError({
      status: response.status,
      payload
    });
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
  verifyEmailOtp: (body) => apiRequest('/auth/verify-email', { method: 'POST', body }),
  resendVerificationOtp: (body) =>
    apiRequest('/auth/resend-verification', { method: 'POST', body }),
  requestPasswordResetOtp: (body) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body }),
  resetPasswordWithOtp: (body) => apiRequest('/auth/reset-password', { method: 'POST', body }),
  getHealth: () => apiRequest('/health'),
  getCategories: () => apiRequest('/categories'),
  getCurrentUser: (token) => apiRequest('/auth/me', { token }),
  getPosts: (query) => apiRequest('/posts', { query }),
  getMyPosts: (token, query) => apiRequest('/posts/mine', { token, query }),
  getPost: (identifier, token) => apiRequest(`/posts/${identifier}`, { token }),
  createPost: (body, token, options = {}) =>
    apiRequest('/posts', { method: 'POST', body, token, ...options }),
  updatePost: (identifier, body, token, options = {}) =>
    apiRequest(`/posts/${identifier}`, { method: 'PATCH', body, token, ...options }),
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
