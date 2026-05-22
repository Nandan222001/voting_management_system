import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  headlineLg: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
    fontWeight: '700',
    fontFamily: 'System',
  },
  headlineMd: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontWeight: '600',
    fontFamily: 'System',
  },
  headlineSm: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'System',
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'System',
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: 'System',
  },
  labelMd: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '600',
    fontFamily: 'System',
  },
  labelSm: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
};
