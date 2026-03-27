import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Hierarchy
export const getHierarchy = () => api.get('/hierarchy').then(r => r.data);
export const createSubject = (data) => api.post('/hierarchy/subjects', data).then(r => r.data);
export const updateSubject = (id, data) => api.put(`/hierarchy/subjects/${id}`, data).then(r => r.data);
export const deleteSubject = (id) => api.delete(`/hierarchy/subjects/${id}`).then(r => r.data);

export const createChapter = (data) => api.post('/hierarchy/chapters', data).then(r => r.data);
export const updateChapter = (id, data) => api.put(`/hierarchy/chapters/${id}`, data).then(r => r.data);
export const deleteChapter = (id) => api.delete(`/hierarchy/chapters/${id}`).then(r => r.data);

export const createTopic = (data) => api.post('/hierarchy/topics', data).then(r => r.data);
export const updateTopic = (id, data) => api.put(`/hierarchy/topics/${id}`, data).then(r => r.data);
export const deleteTopic = (id) => api.delete(`/hierarchy/topics/${id}`).then(r => r.data);
export const toggleTopicCompleted = (id) => api.patch(`/hierarchy/topics/${id}/toggle-completed`).then(r => r.data);
export const toggleTopicPinned = (id) => api.patch(`/hierarchy/topics/${id}/toggle-pinned`).then(r => r.data);

// Materials
export const getMaterials = (nodeId, tag) => api.get(`/materials/node/${nodeId}${tag ? `?tag=${tag}` : ''}`).then(r => r.data);
export const createMaterial = (data) => api.post('/materials', data).then(r => r.data);
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data).then(r => r.data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`).then(r => r.data);

// Search
export const searchEverything = (q) => api.get(`/search?q=${q}`).then(r => r.data);
