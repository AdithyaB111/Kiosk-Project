/**
 * NativeWind IconButton Component - Circular icon buttons
 */

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface IconButtonProps {
  onPress: () => void;
  icon: string;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface border border-border active:bg-surface-elevated',
  primary: 'bg-brand active:bg-brand-pressed shadow-brand',
  ghost: 'bg-transparent active:bg-surface/50',
};

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
};

const iconSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function IconButton({
  onPress,
  icon,
  variant = 'default',
  size = 'lg',
  className = '',
}: IconButtonProps) {
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const iconSizeClass = iconSizeClasses[size];

  return (
    <TouchableOpacity
      className={`rounded-2xl items-center justify-center ${variantClass} ${sizeClass} ${className}`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text className={`font-bold text-text-primary ${iconSizeClass}`}>
        {icon}
      </Text>
    </TouchableOpacity>
  );
}

