import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../../theme';

interface SectionHeaderProps {
  title: string;
  showPulse?: boolean;
}

export default function SectionHeader({ title, showPulse }: SectionHeaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!showPulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [showPulse, pulseAnim]);

  return (
    <View style={styles.container}>
      {showPulse && (
        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
});
