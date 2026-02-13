/**
 * Card Component - Modern container with elevation
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../design/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: keyof typeof theme.spacing;
}

export function Card({ children, style, elevated = false, padding = 'xl' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && theme.shadows.md,
        { padding: theme.spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
});
