import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { RideType } from '@/lib/types';

interface RideTypeSelectorProps {
  selected: RideType;
  onSelect: (type: RideType) => void;
}

const RIDE_TYPES: { type: RideType; label: string; icon: React.ReactNode; activeIcon: React.ReactNode }[] = [
  {
    type: 'bike',
    label: 'Bike',
    icon: <MaterialCommunityIcons name="motorbike" size={22} color={Colors.textSecondary} />,
    activeIcon: <MaterialCommunityIcons name="motorbike" size={22} color={Colors.white} />,
  },
  {
    type: 'auto',
    label: 'Auto',
    icon: <MaterialCommunityIcons name="rickshaw" size={22} color={Colors.textSecondary} />,
    activeIcon: <MaterialCommunityIcons name="rickshaw" size={22} color={Colors.white} />,
  },
  {
    type: 'cab',
    label: 'Cab',
    icon: <Ionicons name="car" size={22} color={Colors.textSecondary} />,
    activeIcon: <Ionicons name="car" size={22} color={Colors.white} />,
  },
];

export default function RideTypeSelector({ selected, onSelect }: RideTypeSelectorProps) {
  const handleSelect = (type: RideType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(type);
  };

  return (
    <View style={styles.container}>
      {RIDE_TYPES.map((item) => {
        const isActive = selected === item.type;
        return (
          <Pressable
            key={item.type}
            style={[styles.item, isActive && styles.activeItem]}
            onPress={() => handleSelect(item.type)}
          >
            {isActive ? item.activeIcon : item.icon}
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activeItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeLabel: {
    color: Colors.white,
  },
});
