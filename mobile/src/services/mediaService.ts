import api from './api';
import { Platform } from 'react-native';

export const mediaService = {
  uploadFile: async (uri: string, name: string = 'file', type: string = 'image/jpeg') => {
    const formData = new FormData();
    
    // For web, we might need a different approach if uri is a blob
    // But for Expo mobile:
    const fileToUpload = {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: name,
      type: type,
    } as any;

    formData.append('file', fileToUpload);

    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.url;
  },
};
