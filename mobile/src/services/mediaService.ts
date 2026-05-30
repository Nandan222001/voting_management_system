import api from './api';
import { Platform } from 'react-native';

export const mediaService = {
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

    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.url;
  },
};

// Alias for convenience
(mediaService as any).uploadImage = mediaService.uploadFile;
