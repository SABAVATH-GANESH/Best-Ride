import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import RideCard from '@/components/RideCard';
import RideTypeSelector from '@/components/RideTypeSelector';
import { RideOption, RideType, RideEstimateResponse } from '@/lib/types';
import { generateEstimates } from '@/lib/ride-service';

type FilterMode = 'all' | 'cheapest' | 'fastest';

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;
  const params = useLocalSearchParams<{
    pickupLat: string;
    pickupLng: string;
    pickupAddr: string;
    destLat: string;
    destLng: string;
    destAddr: string;
    rideType: string;
  }>();

  const [rideType, setRideType] = useState<RideType>((params.rideType as RideType) || 'auto');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<RideEstimateResponse | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const fetchEstimates = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const estimates = generateEstimates({
        pickup: {
          latitude: parseFloat(params.pickupLat || '12.9716'),
          longitude: parseFloat(params.pickupLng || '77.5946'),
          address: params.pickupAddr || '',
        },
        destination: {
          latitude: parseFloat(params.destLat || '12.9352'),
          longitude: parseFloat(params.destLng || '77.6245'),
          address: params.destAddr || '',
        },
        rideType,
      });
      setResult(estimates);
      setLoading(false);
    }, 800);
  }, [rideType, params.pickupLat, params.pickupLng, params.destLat, params.destLng]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const handleRidePress = async (ride: RideOption) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const canOpen = await Linking.canOpenURL(ride.deepLink);
      if (canOpen) {
        await Linking.openURL(ride.deepLink);
      } else {
        await Linking.openURL(ride.playStoreLink);
      }
    } catch {
      try {
        await Linking.openURL(ride.playStoreLink);
      } catch {
        Alert.alert(
          'Cannot Open App',
          `Please install ${ride.displayName.split(' ')[0]} from the Play Store.`,
        );
      }
    }
  };

  const getBadge = (rideId: string): 'cheapest' | 'fastest' | 'best_value' | null => {
    if (!result) return null;
    if (rideId === result.cheapest) return 'cheapest';
    if (rideId === result.fastest) return 'fastest';
    if (rideId === result.bestValue && rideId !== result.cheapest && rideId !== result.fastest) return 'best_value';
    return null;
  };

  const filteredRides = result?.rides.filter((ride) => {
    if (filterMode === 'cheapest') return ride.id === result.cheapest;
    if (filterMode === 'fastest') return ride.id === result.fastest;
    return true;
  }) || [];

  const savings = result && result.rides.length >= 2
    ? result.rides[result.rides.length - 1].price - result.rides[0].price
    : 0;

  const handleChangeRideType = (type: RideType) => {
    setRideType(type);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[Colors.navy, Colors.navyLight]}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {params.pickupAddr?.split(',')[0]} → {params.destAddr?.split(',')[0]}
            </Text>
            <Text style={styles.headerSub}>
              {result?.rides.length || 0} rides found
            </Text>
          </View>
          <Pressable onPress={fetchEstimates} hitSlop={12}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
          </Pressable>
        </View>

        <View style={styles.rideTypeRow}>
          <RideTypeSelector selected={rideType} onSelect={handleChangeRideType} />
        </View>
      </LinearGradient>

      {savings > 0 && !loading && (
        <View style={styles.savingsBanner}>
          <Ionicons name="pricetag" size={16} color={Colors.primary} />
          <Text style={styles.savingsText}>
            You could save up to {'\u20B9'}{savings} by comparing!
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'cheapest', 'fastest'] as FilterMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[styles.filterChip, filterMode === mode && styles.filterChipActive]}
            onPress={() => setFilterMode(mode)}
          >
            <Text style={[styles.filterChipText, filterMode === mode && styles.filterChipTextActive]}>
              {mode === 'all' ? 'All' : mode === 'cheapest' ? 'Cheapest' : 'Fastest'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding best rides...</Text>
          <Text style={styles.loadingSubtext}>Comparing Uber, Ola & Rapido</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RideCard
              ride={item}
              badge={getBadge(item.id)}
              onPress={handleRidePress}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No rides available</Text>
              <Text style={styles.emptySubtext}>Try a different ride type or refresh</Text>
            </View>
          }
        />
      )}

      <View style={[styles.disclaimer, { paddingBottom: insets.bottom + webBottomInset + 8 }]}>
        <Feather name="info" size={12} color={Colors.textLight} />
        <Text style={styles.disclaimerText}>
          Prices are estimated. Final fare may vary in the actual app.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: Colors.white,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  rideTypeRow: {
    marginTop: 2,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
  },
  savingsText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.primaryDark,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  filterChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  loadingSubtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  emptySubtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Colors.background,
  },
  disclaimerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: Colors.textLight,
  },
});
