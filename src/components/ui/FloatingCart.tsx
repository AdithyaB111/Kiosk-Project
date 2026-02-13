/**
 * NativeWind FloatingCart Component - Sticky cart button
 */

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface FloatingCartProps {
  itemCount: number;
  total: string;
  onPress: () => void;
  className?: string;
}

export function FloatingCart({
  itemCount,
  total,
  onPress,
  className = '',
}: FloatingCartProps) {
  return (
    <TouchableOpacity
      className={`bg-brand rounded-3xl p-5 flex-row items-center justify-between shadow-brand-lg active:scale-98 ${className}`}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="flex-row items-center">
        {/* Badge */}
        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center mr-3.5">
          <Text className="text-white font-extrabold text-base">
            {itemCount}
          </Text>
        </View>

        {/* Label */}
        <Text className="text-white font-bold text-lg">
          View Cart
        </Text>
      </View>

      {/* Total */}
      <Text className="text-white font-extrabold text-xl tracking-tight">
        {total}
      </Text>
    </TouchableOpacity>
  );
}

