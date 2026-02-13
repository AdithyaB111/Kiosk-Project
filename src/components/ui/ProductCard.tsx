/**
 * NativeWind ProductCard Component - Menu item cards
 */

import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  name: string;
  price: string;
  imageUri?: string;
  onPress: () => void;
  className?: string;
}

export function ProductCard({
  name,
  price,
  imageUri,
  onPress,
  className = '',
}: ProductCardProps) {
  return (
    <TouchableOpacity
      className={`bg-surface rounded-3xl border border-border overflow-hidden active:scale-95 ${className}`}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View className="w-full aspect-[4/3] bg-black-soft">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-5xl font-extrabold text-border">
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Add Badge */}
      <View className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-brand items-center justify-center shadow-brand">
        <Text className="text-white text-2xl font-extrabold leading-none">
          +
        </Text>
      </View>

      {/* Info */}
      <View className="p-4">
        <Text className="text-white font-bold text-base mb-2 leading-tight" numberOfLines={2}>
          {name}
        </Text>
        <Text className="text-brand font-extrabold text-xl tracking-tight">
          {price}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

