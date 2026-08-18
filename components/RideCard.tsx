import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { RideOption } from '@/lib/types';
import ProviderLogo from './ProviderLogo';

interface RideCardProps {
  ride: RideOption;
  badge?: 'cheapest' | 'fastest' | 'best_value' | null;
  onPress: (ride: RideOption) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RideCard({ ride, badge, onPress }: RideCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(ride);
  };

  const badgeConfig = {
    cheapest: { label: 'Cheapest', color: Colors.success, icon: 'trending-down' as const },
    fastest: { label: 'Fastest', color: Colors.accent, icon: 'zap' as const },
    best_value: { label: 'Best Value', color: Colors.primary, icon: 'star' as const },
  };

  const currentBadge = badge ? badgeConfig[badge] : null;

  const rideTypeIcon = ride.rideType === 'bike'
    ? <MaterialCommunityIcons name="motorbike" size={16} color={Colors.textSecondary} />
    : ride.rideType === 'auto'
      ? <MaterialCommunityIcons name="rickshaw" size={16} color={Colors.textSecondary} />
      : <Ionicons name="car" size={16} color={Colors.textSecondary} />;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle, badge === 'cheapest' && styles.highlightedContainer]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      {currentBadge && (
        <View style={[styles.badge, { backgroundColor: currentBadge.color }]}>
          <Feather name={currentBadge.icon} size={10} color="#FFFFFF" />
          <Text style={styles.badgeText}>{currentBadge.label}</Text>
        </View>
      )}

      <View style={styles.content}>
        <ProviderLogo provider={ride.provider} size={44} />

        <View style={styles.details}>
          <Text style={styles.displayName}>{ride.displayName}</Text>
          <View style={styles.metaRow}>
            {rideTypeIcon}
            <Text style={styles.metaText}>{ride.distance} km</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{ride.duration} min</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>{'\u20B9'}{ride.price}</Text>
          <View style={styles.etaRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.etaText}>{ride.eta} min</Text>
          </View>
          {ride.surgeMultiplier > 1 && (
            <View style={styles.surgeRow}>
              <Ionicons name="flash" size={10} color={Colors.warning} />
              <Text style={styles.surgeText}>{ride.surgeMultiplier}x</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bookRow}>
        <Text style={styles.bookHint}>Tap to open in {ride.displayName.split(' ')[0]}</Text>
        <Feather name="external-link" size={14} color={Colors.primary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  highlightedContainer: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textLight,
  },
  priceSection: {
    alignItems: 'flex-end',
    gap: 2,
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  etaText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  surgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  surgeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: Colors.warning,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: '#FAFBFC',
  },
  bookHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: Colors.primary,
  },
});
