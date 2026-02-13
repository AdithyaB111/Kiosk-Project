/**
 * NativeWind Badge Component - Status indicators and labels
 */

import React from 'react';
import { Text, View } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const variantClasses = {
  default: 'bg-surface border-border',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  error: 'bg-error/10 border-error/20',
  info: 'bg-brand/10 border-brand/20',
};

const textVariantClasses = {
  default: 'text-text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-brand',
};

const dotVariantClasses = {
  default: 'bg-text-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-brand',
};

const sizeClasses = {
  sm: 'px-2 py-1',
  md: 'px-3 py-1.5',
  lg: 'px-4 py-2',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const variantClass = variantClasses[variant];
  const textVariantClass = textVariantClasses[variant];
  const dotClass = dotVariantClasses[variant];
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];

  return (
    <View className={`flex-row items-center rounded-full border ${variantClass} ${sizeClass} ${className}`}>
      {dot && (
        <View className={`w-2 h-2 rounded-full mr-2 ${dotClass}`} />
      )}
      <Text className={`font-bold ${textVariantClass} ${textSizeClass}`}>
        {children}
      </Text>
    </View>
  );
}

