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
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      // On web, we need an actual File or Blob object.
      // If uri is a local blob URL (from expo-image-picker), fetch it.
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, name);
    } else {
      // On mobile (iOS/Android), use the React Native file object shim.
      const fileToUpload = {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: name,
        type: type,
      } as any;
      formData.append('file', fileToUpload);
    }

    const response = await api.post('/media/upload', formData);

    return response.data.data.url;
  },
  uploadImage: async (uri: string) => {
    return mediaService.uploadFile(uri);
  },
  uploadNominationDocument: async (
    uri: string,
    name: string = 'nomination-document',
    type: string = 'application/octet-stream',
  ) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, name);
    } else {
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name,
        type,
      } as any);
    }

    const response = await api.post('/media/upload-nomination-document', formData);
    return response.data.data.url;
  },
};
