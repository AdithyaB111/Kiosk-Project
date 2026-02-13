/**
 * NativeWind Card Component - Elevated, modern container
 */

import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const variantClasses = {
  default: 'bg-surface border border-border',
  elevated: 'bg-surface shadow-card',
  outlined: 'bg-transparent border-2 border-border',
  glass: 'bg-surface/80 backdrop-blur-xl border border-border/50',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-7',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'lg',
}: CardProps) {
  const variantClass = variantClasses[variant];
  const paddingClass = paddingClasses[padding];

  return (
    <View className={`rounded-2xl ${variantClass} ${paddingClass} ${className}`}>
      {children}
    </View>
  );
}

