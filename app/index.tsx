import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import LocationInput from '@/components/LocationInput';
import RideTypeSelector from '@/components/RideTypeSelector';
import SearchLocationModal from '@/components/SearchLocationModal';
import { Location, RideType } from '@/lib/types';
import { apiRequest } from '@/lib/query-client';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [rideType, setRideType] = useState<RideType>('auto');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPickupSearch, setShowPickupSearch] = useState(false);
  const [showDestSearch, setShowDestSearch] = useState(false);

  const detectLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      let latitude: number;
      let longitude: number;

      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPickup(null);
          return;
        }
        const loc = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      try {
        const response = await apiRequest('GET', `/api/places/reverse-geocode?lat=${latitude}&lng=${longitude}`);
        const data = await response.json();
        setPickup(data.location as Location);
      } catch {
        setPickup({
          latitude,
          longitude,
          address: 'Current Location',
          name: 'My Location',
        });
      }
    } catch (err) {
      console.error('Location detection failed:', err);
      setPickup(null);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const handleCompare = () => {
    if (!pickup || !destination) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/results',
      params: {
        pickupLat: pickup.latitude.toString(),
        pickupLng: pickup.longitude.toString(),
        pickupAddr: pickup.address,
        destLat: destination.latitude.toString(),
        destLng: destination.longitude.toString(),
        destAddr: destination.address,
        rideType,
      },
    });
  };

  const canCompare = pickup && destination;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[Colors.navy, Colors.navyLight, Colors.navyMedium]}
        style={[styles.headerGradient, { paddingTop: insets.top + webTopInset + 16 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons name="road-variant" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>Best Ride</Text>
          </View>
          <Text style={styles.tagline}>Compare rides. Save money.</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + webBottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Where to?</Text>
          <LocationInput
            pickupAddress={pickup?.address || ''}
            destinationAddress={destination?.address || ''}
            onPickupPress={() => setShowPickupSearch(true)}
            onDestinationPress={() => setShowDestSearch(true)}
            pickupLoading={locationLoading}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ride Type</Text>
          <RideTypeSelector selected={rideType} onSelect={setRideType} />
        </View>

        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="flash" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.infoTitle}>Instant Compare</Text>
            <Text style={styles.infoDesc}>See prices from Uber, Ola & Rapido side-by-side</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="wallet" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.infoTitle}>Save Money</Text>
            <Text style={styles.infoDesc}>Always pick the cheapest or fastest ride</Text>
          </View>
        </View>

        <View style={styles.providersSection}>
          <Text style={styles.providersLabel}>Supported Platforms</Text>
          <View style={styles.providerChips}>
            {['Uber', 'Ola', 'Rapido'].map((name) => (
              <View key={name} style={styles.providerChip}>
                <View style={[styles.providerDot, {
                  backgroundColor: name === 'Uber' ? Colors.uber : name === 'Ola' ? Colors.ola : Colors.rapido,
                }]} />
                <Text style={styles.providerChipText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + webBottomInset + 12 }]}>
        <Pressable
          style={[styles.compareBtn, !canCompare && styles.compareBtnDisabled]}
          onPress={handleCompare}
          disabled={!canCompare}
        >
          <Feather name="search" size={20} color={Colors.white} />
          <Text style={styles.compareBtnText}>Compare Rides</Text>
        </Pressable>
      </View>

      <SearchLocationModal
        visible={showPickupSearch}
        onClose={() => setShowPickupSearch(false)}
        onSelect={(loc) => { setPickup(loc); setShowPickupSearch(false); }}
        title="Set Pickup"
        currentLocation={pickup}
      />

      <SearchLocationModal
        visible={showDestSearch}
        onClose={() => setShowDestSearch(false)}
        onSelect={(loc) => { setDestination(loc); setShowDestSearch(false); }}
        title="Set Destination"
        currentLocation={pickup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerContent: {
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 26,
    color: Colors.white,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  body: {
    flex: 1,
    marginTop: -12,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  infoDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  providersSection: {
    gap: 10,
    paddingHorizontal: 4,
  },
  providersLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  providerChips: {
    flexDirection: 'row',
    gap: 10,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  providerChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: Colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  compareBtnDisabled: {
    backgroundColor: Colors.textLight,
  },
  compareBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: Colors.white,
  },
});
