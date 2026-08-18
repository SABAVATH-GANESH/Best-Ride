import { RideOption, RideEstimateRequest, RideEstimateResponse, ProviderConfig, ProviderName, RideType, CabSubType } from './types';

const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  uber: {
    name: 'uber',
    displayName: 'Uber',
    supportedRideTypes: ['bike', 'auto', 'cab'],
    supportedCabSubTypes: ['mini', 'sedan', 'suv'],
    color: '#000000',
    textColor: '#FFFFFF',
    deepLinkScheme: 'uber://',
    playStoreId: 'com.ubercab',
  },
  ola: {
    name: 'ola',
    displayName: 'Ola',
    supportedRideTypes: ['bike', 'auto', 'cab'],
    supportedCabSubTypes: ['mini', 'sedan', 'suv'],
    color: '#1C8D38',
    textColor: '#FFFFFF',
    deepLinkScheme: 'olacabs://',
    playStoreId: 'com.olacabs.customer',
  },
  rapido: {
    name: 'rapido',
    displayName: 'Rapido',
    supportedRideTypes: ['bike', 'auto', 'cab'],
    supportedCabSubTypes: ['mini'],
    color: '#FFCF00',
    textColor: '#1A1A1A',
    deepLinkScheme: 'rapido://',
    playStoreId: 'com.rapido.passenger',
  },
};

function getDisplayName(provider: ProviderName, rideType: RideType, cabSubType?: CabSubType): string {
  const providerDisplay = PROVIDER_CONFIGS[provider].displayName;
  const typeLabels: Record<RideType, string> = { bike: 'Bike', auto: 'Auto', cab: 'Cab' };
  const subTypeLabels: Record<CabSubType, string> = { mini: 'Mini', sedan: 'Sedan', suv: 'SUV' };

  if (rideType === 'cab' && cabSubType) {
    return `${providerDisplay} ${subTypeLabels[cabSubType]}`;
  }
  return `${providerDisplay} ${typeLabels[rideType]}`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const BASE_FARES: Record<ProviderName, Record<RideType, { base: number; perKm: number; perMin: number }>> = {
  uber: {
    bike: { base: 25, perKm: 9, perMin: 1.5 },
    auto: { base: 30, perKm: 12, perMin: 1.5 },
    cab: { base: 50, perKm: 14, perMin: 2 },
  },
  ola: {
    bike: { base: 20, perKm: 8, perMin: 1 },
    auto: { base: 25, perKm: 11, perMin: 1.5 },
    cab: { base: 45, perKm: 13, perMin: 1.8 },
  },
  rapido: {
    bike: { base: 15, perKm: 7, perMin: 1 },
    auto: { base: 25, perKm: 10, perMin: 1.2 },
    cab: { base: 40, perKm: 12, perMin: 1.5 },
  },
};

const CAB_MULTIPLIERS: Record<CabSubType, number> = {
  mini: 1,
  sedan: 1.4,
  suv: 1.8,
};

function generateMockPrice(
  provider: ProviderName,
  rideType: RideType,
  distanceKm: number,
  cabSubType?: CabSubType,
): { price: number; eta: number; duration: number; surge: number } {
  const fare = BASE_FARES[provider][rideType];
  const multiplier = rideType === 'cab' && cabSubType ? CAB_MULTIPLIERS[cabSubType] : 1;
  const durationMinutes = Math.round(distanceKm * (rideType === 'bike' ? 3 : rideType === 'auto' ? 3.5 : 4));
  const basePrice = fare.base + (fare.perKm * distanceKm) + (fare.perMin * durationMinutes);
  const variance = 0.9 + Math.random() * 0.2;
  const surge = Math.random() > 0.7 ? 1.2 + Math.random() * 0.5 : 1;
  const finalPrice = Math.round(basePrice * multiplier * variance * surge);
  const eta = Math.round(2 + Math.random() * 8);

  return { price: finalPrice, eta, duration: durationMinutes, surge };
}

function buildDeepLink(provider: ProviderName, pickup: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }): string {
  switch (provider) {
    case 'uber':
      return `uber://?action=setPickup&pickup[latitude]=${pickup.latitude}&pickup[longitude]=${pickup.longitude}&dropoff[latitude]=${destination.latitude}&dropoff[longitude]=${destination.longitude}`;
    case 'ola':
      return `olacabs://app/launch?lat=${pickup.latitude}&lng=${pickup.longitude}&drop_lat=${destination.latitude}&drop_lng=${destination.longitude}`;
    case 'rapido':
      return `rapido://ride?pickup_lat=${pickup.latitude}&pickup_lng=${pickup.longitude}&drop_lat=${destination.latitude}&drop_lng=${destination.longitude}`;
    default:
      return '';
  }
}

export function getProviderConfig(provider: ProviderName): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
}

export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDER_CONFIGS);
}

export function generateEstimates(request: RideEstimateRequest): RideEstimateResponse {
  const distanceKm = calculateDistance(
    request.pickup.latitude,
    request.pickup.longitude,
    request.destination.latitude,
    request.destination.longitude,
  );

  const roadDistanceKm = distanceKm * 1.3;
  const rides: RideOption[] = [];

  const providers: ProviderName[] = ['uber', 'ola', 'rapido'];

  for (const provider of providers) {
    const config = PROVIDER_CONFIGS[provider];

    if (!config.supportedRideTypes.includes(request.rideType)) continue;

    if (request.rideType === 'cab') {
      const subTypes = request.cabSubType
        ? [request.cabSubType]
        : config.supportedCabSubTypes;

      for (const subType of subTypes) {
        const { price, eta, duration, surge } = generateMockPrice(provider, 'cab', roadDistanceKm, subType);

        rides.push({
          id: `${provider}-cab-${subType}-${Date.now()}`,
          provider,
          rideType: 'cab',
          cabSubType: subType,
          displayName: getDisplayName(provider, 'cab', subType),
          price,
          currency: 'INR',
          eta,
          distance: Math.round(roadDistanceKm * 10) / 10,
          duration,
          surgeMultiplier: Math.round(surge * 10) / 10,
          deepLink: buildDeepLink(provider, request.pickup, request.destination),
          playStoreLink: `https://play.google.com/store/apps/details?id=${config.playStoreId}`,
        });
      }
    } else {
      const { price, eta, duration, surge } = generateMockPrice(provider, request.rideType, roadDistanceKm);

      rides.push({
        id: `${provider}-${request.rideType}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        provider,
        rideType: request.rideType,
        displayName: getDisplayName(provider, request.rideType),
        price,
        currency: 'INR',
        eta,
        distance: Math.round(roadDistanceKm * 10) / 10,
        duration,
        surgeMultiplier: Math.round(surge * 10) / 10,
        deepLink: buildDeepLink(provider, request.pickup, request.destination),
        playStoreLink: `https://play.google.com/store/apps/details?id=${config.playStoreId}`,
      });
    }
  }

  rides.sort((a, b) => a.price - b.price);

  const cheapest = rides.length > 0 ? rides[0].id : '';
  const fastest = rides.length > 0 ? rides.reduce((min, r) => r.eta < min.eta ? r : min, rides[0]).id : '';
  const bestValue = rides.length > 0 ? rides.reduce((best, r) => {
    const score = r.price * 0.6 + r.eta * 10 * 0.4;
    const bestScore = best.price * 0.6 + best.eta * 10 * 0.4;
    return score < bestScore ? r : best;
  }, rides[0]).id : '';

  return { rides, cheapest, fastest, bestValue };
}
