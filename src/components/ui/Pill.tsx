/**
 * NativeWind Pill Component - Category/filter pills
 */

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface PillProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  variant?: 'default' | 'brand' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses = {
  default: {
    inactive: 'bg-surface border border-border',
    active: 'bg-brand border-brand shadow-brand',
  },
  brand: {
    inactive: 'bg-brand/10 border border-brand/20',
    active: 'bg-brand border-brand shadow-brand',
  },
  success: {
    inactive: 'bg-success/10 border border-success/20',
    active: 'bg-success border-success shadow-success',
  },
};

const textVariantClasses = {
  default: {
    inactive: 'text-text-tertiary',
    active: 'text-white',
  },
  brand: {
    inactive: 'text-brand',
    active: 'text-white',
  },
  success: {
    inactive: 'text-success',
    active: 'text-white',
  },
};

const sizeClasses = {
  sm: 'px-3 py-2',
  md: 'px-4 py-2.5',
  lg: 'px-6 py-3.5',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Pill({
  children,
  onPress,
  active = false,
  variant = 'default',
  size = 'md',
  className = '',
}: PillProps) {
  const state = active ? 'active' : 'inactive';
  const variantClass = variantClasses[variant][state];
  const textVariantClass = textVariantClasses[variant][state];
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];

  return (
    <TouchableOpacity
      className={`rounded-full ${variantClass} ${sizeClass} ${className}`}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text className={`font-bold ${textVariantClass} ${textSizeClass}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

