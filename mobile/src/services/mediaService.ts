import api from './api';
import { Platform } from 'react-native';

const toAbsoluteFileUrl = (url: string) => {
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }
  const baseUrl = String(api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

export const mediaService = {
  getFileUrl: toAbsoluteFileUrl,

  uploadFile: async (uri: string, name: string = 'file.jpg', type: string = 'image/jpeg') => {
    console.log(`[MediaService] Preparing upload: ${name} (${type}) from ${uri}`);
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      // On web, we need an actual File or Blob object.
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, name);
    } else {
      // On mobile (iOS/Android), use the React Native file object shim.
      let finalUri = uri;
      if (Platform.OS === 'android' && !uri.startsWith('content://') && !uri.startsWith('file://')) {
        finalUri = `file://${uri}`;
      }
      if (Platform.OS === 'ios') {
        finalUri = uri.replace('file://', '');
      }

      const fileToUpload = {
        uri: finalUri,
        name: name,
        type: type,
      } as any;

      console.log('[MediaService] Appending file to FormData:', fileToUpload);
      formData.append('file', fileToUpload);
    }

    const response = await api.post('/media/upload', formData, {
      timeout: 60000, // 60 seconds for large files
    });

    return response.data.data.url;
  },
  uploadImage: async (uri: string) => {
    return mediaService.uploadFile(uri);
  },
  uploadNominationDocument: async (
    uri: string,
    name: string = 'nomination-document.jpg',
    type: string = 'image/jpeg',
  ) => {
    console.log(`[MediaService] Preparing nomination doc upload: ${name} (${type}) from ${uri}`);
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, name);
    } else {
      let finalUri = uri;
      if (Platform.OS === 'android' && !uri.startsWith('content://') && !uri.startsWith('file://')) {
        finalUri = `file://${uri}`;
      }
      if (Platform.OS === 'ios') {
        finalUri = uri.replace('file://', '');
      }

      const fileToUpload = {
        uri: finalUri,
        name,
        type,
      } as any;

      console.log('[MediaService] Appending nomination doc to FormData:', fileToUpload);
      formData.append('file', fileToUpload);
    }

    const response = await api.post('/media/upload-nomination-document', formData, {
      timeout: 60000,
    });
    return response.data.data.url;
  },
};
