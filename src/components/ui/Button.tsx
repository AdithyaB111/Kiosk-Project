/**
 * NativeWind Button Component - Unique, modern, touch-optimized
 */

import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses = {
  primary: 'bg-brand active:bg-brand-pressed shadow-brand',
  secondary: 'bg-surface border border-border active:bg-surface-elevated',
  ghost: 'bg-transparent active:bg-surface/50',
  success: 'bg-success active:bg-success-dark shadow-success',
  danger: 'bg-error active:bg-error-dark',
  outline: 'bg-transparent border-2 border-brand active:bg-brand/10',
};

const sizeClasses = {
  sm: 'px-4 py-3 min-h-[44px]',
  md: 'px-5 py-4 min-h-[52px]',
  lg: 'px-6 py-5 min-h-[60px]',
  xl: 'px-8 py-6 min-h-[68px]',
};

const textVariantClasses = {
  primary: 'text-white',
  secondary: 'text-text-primary',
  ghost: 'text-brand',
  success: 'text-white',
  danger: 'text-white',
  outline: 'text-brand',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  className = '',
}: ButtonProps) {
  const baseClasses = 'rounded-2xl items-center justify-center flex-row';
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 bg-text-disabled' : '';

  const textBaseClasses = 'font-bold';
  const textVariantClass = textVariantClasses[variant];
  const textSizeClass = textSizeClasses[size];
  const textDisabledClass = disabled ? 'text-text-quaternary' : '';

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' || variant === 'outline' ? '#FF3B30' : '#FFFFFF'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <View>{icon}</View>}
          <Text className={`${textBaseClasses} ${textVariantClass} ${textSizeClass} ${textDisabledClass}`}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

