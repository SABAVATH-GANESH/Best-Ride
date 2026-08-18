import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Location } from '@/lib/types';
import { apiRequest } from '@/lib/query-client';

interface SearchLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  title: string;
  currentLocation?: Location | null;
}

interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
}

export default function SearchLocationModal({
  visible,
  onClose,
  onSelect,
  title,
  currentLocation,
}: SearchLocationModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');
  const sessionToken = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiRequest('POST', '/api/places/autocomplete', {
        input: trimmed,
        sessionToken: sessionToken.current,
        locationBias: currentLocation
          ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
          : undefined,
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Google Places autocomplete failed:', err);
      setSuggestions([]);
      setError('Could not load Google locations. Check your API key and server URL.');
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible, searchPlaces]);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSuggestions([]);
      setError('');
      sessionToken.current = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }, [visible]);

  const handleSelect = useCallback(async (suggestion: PlaceSuggestion) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelecting(true);
    setError('');
    try {
      const response = await apiRequest('GET', `/api/places/details/${encodeURIComponent(suggestion.placeId)}?sessionToken=${encodeURIComponent(sessionToken.current)}`);
      const data = await response.json();
      onSelect(data.location as Location);
      setQuery('');
      setSuggestions([]);
      onClose();
      sessionToken.current = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } catch (err) {
      console.error('Google Place Details failed:', err);
      setError('Could not load this location. Please try again.');
    } finally {
      setSelecting(false);
    }
  }, [onClose, onSelect]);

  const handleCurrentLocation = useCallback(() => {
    if (!currentLocation) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(currentLocation);
    onClose();
  }, [currentLocation, onClose, onSelect]);

  const handleClose = () => {
    setQuery('');
    setSuggestions([]);
    setError('');
    onClose();
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.wrapper, { paddingTop: insets.top + webTopInset }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a place..."
            placeholderTextColor={Colors.textLight}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {loading && <ActivityIndicator size="small" color={Colors.primary} />}
          {!loading && query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textLight} />
            </Pressable>
          )}
        </View>

        {currentLocation && !query.trim() && (
          <Pressable style={styles.currentLocationItem} onPress={handleCurrentLocation}>
            <View style={styles.currentLocationIcon}>
              <Ionicons name="navigate" size={20} color={Colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.currentLocationName}>Use current location</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>{currentLocation.address}</Text>
            </View>
            <Feather name="crosshair" size={18} color={Colors.primary} />
          </Pressable>
        )}

        <Text style={styles.sectionLabel}>
          {query.trim() ? 'Google Places' : 'Search a real location'}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={22} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.locationItem, pressed && styles.locationItemPressed]}
              onPress={() => handleSelect(item)}
              disabled={selecting}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>{item.address}</Text>
              </View>
              {selecting ? <ActivityIndicator size="small" color={Colors.primary} /> : <Feather name="chevron-right" size={16} color={Colors.textLight} />}
            </Pressable>
          )}
          ListEmptyComponent={
            query.trim().length >= 2 && !loading && !error ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={Colors.textLight} />
                <Text style={styles.emptyText}>No Google locations found</Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15, color: Colors.text, padding: 0 },
  sectionLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  currentLocationItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 14, padding: 14, backgroundColor: Colors.primaryLight, borderRadius: 14 },
  currentLocationIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  currentLocationName: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.primary },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  locationItemPressed: { backgroundColor: Colors.primaryLight },
  locationIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  locationInfo: { flex: 1, gap: 2 },
  locationName: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.text },
  locationAddress: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: Colors.textLight },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, padding: 12, backgroundColor: '#FFF1F0', borderRadius: 10 },
  errorText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.error },
});
