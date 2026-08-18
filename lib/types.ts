export type RideType = 'bike' | 'auto' | 'cab';

export type CabSubType = 'mini' | 'sedan' | 'suv';

export type ProviderName = 'uber' | 'ola' | 'rapido';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export interface RideOption {
  id: string;
  provider: ProviderName;
  rideType: RideType;
  cabSubType?: CabSubType;
  displayName: string;
  price: number;
  currency: string;
  eta: number;
  distance: number;
  duration: number;
  surgeMultiplier: number;
  deepLink: string;
  playStoreLink: string;
}

export interface RideEstimateRequest {
  pickup: Location;
  destination: Location;
  rideType: RideType;
  cabSubType?: CabSubType;
}

export interface RideEstimateResponse {
  rides: RideOption[];
  cheapest: string;
  fastest: string;
  bestValue: string;
}

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  supportedRideTypes: RideType[];
  supportedCabSubTypes: CabSubType[];
  color: string;
  textColor: string;
  deepLinkScheme: string;
  playStoreId: string;
  apiEndpoint?: string;
  apiKey?: string;
}
