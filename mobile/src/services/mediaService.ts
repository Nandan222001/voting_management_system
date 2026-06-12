import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api, { getTenantID } from './api';

const toAbsoluteFileUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }
  const baseUrl = String(api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

const sanitizeFileName = (fileName: string, defaultName: string = 'image.jpg') => {
  if (!fileName) return defaultName;
  const ext = fileName.split('.').pop() || 'jpg';
  // Keep it simple: just 'image.extension' or a short version of original
  return `upload_${Date.now()}.${ext}`;
};

// Use fetch() instead of Axios for multipart uploads — Axios transformRequest
// serialises FormData in React Native, breaking the multipart boundary.
const uploadWithFetch = async (endpoint: string, formData: FormData): Promise<string> => {
  const baseURL = String(api.defaults.baseURL || '');
  const url = `${baseURL}${endpoint}`;

  const token = await AsyncStorage.getItem('token');
  const tenantID = await getTenantID();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantID) headers['X-Tenant-ID'] = String(tenantID);

  console.log(`[MediaService] fetch POST ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 413) {
    throw new Error('Image size is too large. Please upload an image under 2MB.');
  }

  let json;
  try {
    json = await response.json();
  } catch (e) {
    throw new Error(`Server returned an invalid response (Status ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(json?.detail || `Upload failed with status ${response.status}`);
  }
  return json.data.url;
};

const buildFormData = (uri: string, name: string, type: string): FormData => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    throw new Error('Web upload not supported via buildFormData');
  }

  let finalUri = uri;
  if (Platform.OS === 'android' && !uri.startsWith('content://') && !uri.startsWith('file://')) {
    finalUri = `file://${uri}`;
  }
  if (Platform.OS === 'ios') {
    finalUri = uri.replace('file://', '');
  }

  const file = { uri: finalUri, name, type } as any;
  formData.append('file', file);
  return formData;
};

export const mediaService = {
  getFileUrl: toAbsoluteFileUrl,

  uploadFile: async (uri: string, name: string = 'file.jpg', type: string = 'image/jpeg') => {
    const safeName = sanitizeFileName(name, 'profile.jpg');
    console.log(`[MediaService] Preparing upload: ${safeName} (${type}) from ${uri}`);

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      const fd = new FormData();
      fd.append('file', blob, safeName);
      return uploadWithFetch('/media/upload', fd);
    }

    return uploadWithFetch('/media/upload', buildFormData(uri, safeName, type));
  },

  uploadImage: async (uri: string) => {
    return mediaService.uploadFile(uri);
  },

  uploadNominationDocument: async (
    uri: string,
    name: string = 'nomination-document.jpg',
    type: string = 'image/jpeg',
  ) => {
    const safeName = sanitizeFileName(name, 'document.jpg');
    console.log(`[MediaService] Preparing nomination doc upload: ${safeName} (${type}) from ${uri}`);

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      const fd = new FormData();
      fd.append('file', blob, safeName);
      return uploadWithFetch('/media/upload-nomination-document', fd);
    }

    return uploadWithFetch('/media/upload-nomination-document', buildFormData(uri, safeName, type));
  },
};
