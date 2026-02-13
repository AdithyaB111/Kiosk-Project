/**
 * NativeWind Input Component - Modern text input
 */

import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  size?: 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outlined';
  className?: string;
  [key: string]: any;
}

const sizeClasses = {
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
  xl: 'px-6 py-5 text-xl',
};

const variantClasses = {
  default: 'bg-surface border border-border',
  filled: 'bg-surface-elevated border border-transparent',
  outlined: 'bg-transparent border-2 border-border',
};

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  size = 'lg',
  variant = 'default',
  className = '',
  ...props
}: InputProps) {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];
  const errorClass = error ? 'border-error' : '';

  return (
    <View className="w-full">
      {label && (
        <Text className="text-text-secondary font-semibold mb-2 text-base">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-2xl text-text-primary font-bold ${variantClass} ${sizeClass} ${errorClass} ${className}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#EBEBF54D"
        {...props}
      />
      {error && (
        <Text className="text-error text-sm font-semibold mt-2">
          {error}
        </Text>
      )}
    </View>
  );
}

