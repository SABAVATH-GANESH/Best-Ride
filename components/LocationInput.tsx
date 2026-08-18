import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface LocationInputProps {
  pickupAddress: string;
  destinationAddress: string;
  onPickupPress: () => void;
  onDestinationPress: () => void;
  pickupLoading?: boolean;
}

export default function LocationInput({
  pickupAddress,
  destinationAddress,
  onPickupPress,
  onDestinationPress,
  pickupLoading,
}: LocationInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconColumn}>
        <View style={styles.pickupDot} />
        <View style={styles.dottedLine} />
        <Ionicons name="location" size={16} color={Colors.error} />
      </View>

      <View style={styles.inputColumn}>
        <Pressable style={styles.inputBox} onPress={onPickupPress}>
          <Text style={[styles.inputText, !pickupAddress && styles.placeholder]} numberOfLines={1}>
            {pickupLoading ? 'Detecting location...' : (pickupAddress || 'Set pickup location')}
          </Text>
          {pickupLoading && <MaterialIcons name="my-location" size={18} color={Colors.primary} />}
          {!pickupLoading && pickupAddress && <Ionicons name="checkmark-circle" size={18} color={Colors.success} />}
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.inputBox} onPress={onDestinationPress}>
          <Text style={[styles.inputText, !destinationAddress && styles.placeholder]} numberOfLines={1}>
            {destinationAddress || 'Where are you going?'}
          </Text>
          <Ionicons name="search" size={18} color={Colors.textLight} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    paddingVertical: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  dottedLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
  inputColumn: {
    flex: 1,
    gap: 0,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 8,
  },
  inputText: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
});
