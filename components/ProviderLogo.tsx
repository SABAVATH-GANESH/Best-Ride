import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { ProviderName } from '@/lib/types';

interface ProviderLogoProps {
  provider: ProviderName;
  size?: number;
}

export default function ProviderLogo({ provider, size = 40 }: ProviderLogoProps) {
  const configs: Record<ProviderName, { bg: string; icon: React.ReactNode; label: string }> = {
    uber: {
      bg: Colors.uber,
      icon: <FontAwesome5 name="car" size={size * 0.4} color="#FFFFFF" />,
      label: 'U',
    },
    ola: {
      bg: Colors.ola,
      icon: <Ionicons name="car-sport" size={size * 0.45} color="#FFFFFF" />,
      label: 'O',
    },
    rapido: {
      bg: Colors.rapido,
      icon: <MaterialCommunityIcons name="motorbike" size={size * 0.45} color={Colors.rapidoText} />,
      label: 'R',
    },
  };

  const config = configs[provider];

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: config.bg }]}>
      {config.icon}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
