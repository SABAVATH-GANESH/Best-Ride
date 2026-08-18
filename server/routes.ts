import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

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

type RideType = 'bike' | 'auto' | 'cab';
type CabSubType = 'mini' | 'sedan' | 'suv';
type ProviderName = 'uber' | 'ola' | 'rapido';

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

const CAB_MULTIPLIERS: Record<CabSubType, number> = { mini: 1, sedan: 1.4, suv: 1.8 };

const PROVIDER_PLAY_STORE: Record<ProviderName, string> = {
  uber: 'com.ubercab',
  ola: 'com.olacabs.customer',
  rapido: 'com.rapido.passenger',
};

function generatePrice(provider: ProviderName, rideType: RideType, distanceKm: number, cabSubType?: CabSubType) {
  const fare = BASE_FARES[provider][rideType];
  const multiplier = rideType === 'cab' && cabSubType ? CAB_MULTIPLIERS[cabSubType] : 1;
  const durationMinutes = Math.round(distanceKm * (rideType === 'bike' ? 3 : rideType === 'auto' ? 3.5 : 4));
  const basePrice = fare.base + (fare.perKm * distanceKm) + (fare.perMin * durationMinutes);
  const variance = 0.9 + Math.random() * 0.2;
  const surge = Math.random() > 0.7 ? 1.2 + Math.random() * 0.5 : 1;
  return {
    price: Math.round(basePrice * multiplier * variance * surge),
    eta: Math.round(2 + Math.random() * 8),
    duration: durationMinutes,
    surge: Math.round(surge * 10) / 10,
  };
}

function buildDeepLink(provider: ProviderName, pickup: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }): string {
  switch (provider) {
    case 'uber': return `uber://?action=setPickup&pickup[latitude]=${pickup.latitude}&pickup[longitude]=${pickup.longitude}&dropoff[latitude]=${destination.latitude}&dropoff[longitude]=${destination.longitude}`;
    case 'ola': return `olacabs://app/launch?lat=${pickup.latitude}&lng=${pickup.longitude}&drop_lat=${destination.latitude}&drop_lng=${destination.longitude}`;
    case 'rapido': return `rapido://ride?pickup_lat=${pickup.latitude}&pickup_lng=${pickup.longitude}&drop_lat=${destination.latitude}&drop_lng=${destination.longitude}`;
  }
}

function getDisplayName(provider: string, rideType: RideType, cabSubType?: CabSubType): string {
  const providerNames: Record<string, string> = { uber: 'Uber', ola: 'Ola', rapido: 'Rapido' };
  const typeLabels: Record<RideType, string> = { bike: 'Bike', auto: 'Auto', cab: 'Cab' };
  const subTypeLabels: Record<CabSubType, string> = { mini: 'Mini', sedan: 'Sedan', suv: 'SUV' };
  if (rideType === 'cab' && cabSubType) return `${providerNames[provider]} ${subTypeLabels[cabSubType]}`;
  return `${providerNames[provider]} ${typeLabels[rideType]}`;
}

const SUPPORTED_RIDE_TYPES: Record<ProviderName, { rideTypes: RideType[]; cabSubTypes: CabSubType[] }> = {
  uber: { rideTypes: ['bike', 'auto', 'cab'], cabSubTypes: ['mini', 'sedan', 'suv'] },
  ola: { rideTypes: ['bike', 'auto', 'cab'], cabSubTypes: ['mini', 'sedan', 'suv'] },
  rapido: { rideTypes: ['bike', 'auto', 'cab'], cabSubTypes: ['mini'] },
};


function getGooglePlacesApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not configured on the server');
  return key;
}

async function googleJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.text();
  let data: any = {};
  try { data = body ? JSON.parse(body) : {}; } catch { data = { error: body }; }
  if (!response.ok) {
    const message = data?.error?.message || `Google API request failed with ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/places/autocomplete", async (req: Request, res: Response) => {
    try {
      const { input, sessionToken, locationBias } = req.body as {
        input?: string;
        sessionToken?: string;
        locationBias?: { latitude: number; longitude: number };
      };

      if (!input?.trim()) return res.json({ suggestions: [] });

      const body: Record<string, unknown> = {
        input: input.trim(),
        languageCode: "en",
      };
      if (sessionToken) body.sessionToken = sessionToken;
      if (locationBias && Number.isFinite(locationBias.latitude) && Number.isFinite(locationBias.longitude)) {
        body.locationBias = {
          circle: {
            center: { latitude: locationBias.latitude, longitude: locationBias.longitude },
            radius: 50000,
          },
        };
      }

      const data = await googleJson("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": getGooglePlacesApiKey(),
          "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
        },
        body: JSON.stringify(body),
      });

      const suggestions = (data.suggestions || [])
        .map((item: any) => item.placePrediction)
        .filter(Boolean)
        .map((place: any) => ({
          placeId: place.placeId,
          name: place.structuredFormat?.mainText?.text || place.text?.text || "Location",
          address: place.structuredFormat?.secondaryText?.text || place.text?.text || "",
        }));

      res.json({ suggestions });
    } catch (error) {
      console.error("Google Places autocomplete error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Google Places autocomplete failed" });
    }
  });

  app.get("/api/places/details/:placeId", async (req: Request, res: Response) => {
    try {
      const placeId = req.params.placeId;
      if (!placeId) return res.status(400).json({ error: "placeId is required" });

      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
      const data = await googleJson(url, {
        headers: {
          "X-Goog-Api-Key": getGooglePlacesApiKey(),
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
        },
      });

      if (!data.location?.latitude || !data.location?.longitude) {
        return res.status(404).json({ error: "Google did not return coordinates for this place" });
      }

      res.json({
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.formattedAddress || data.displayName?.text || "Selected location",
          name: data.displayName?.text || "Selected location",
        },
      });
    } catch (error) {
      console.error("Google Place Details error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Google Place Details failed" });
    }
  });

  app.get("/api/places/reverse-geocode", async (req: Request, res: Response) => {
    try {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: "lat and lng are required" });
      }

      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        language: "en",
        key: getGooglePlacesApiKey(),
      });
      const data = await googleJson(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
      const result = data.results?.[0];
      if (!result) return res.status(404).json({ error: "No address found for this location" });

      res.json({
        location: {
          latitude: lat,
          longitude: lng,
          address: result.formatted_address,
          name: result.address_components?.[0]?.long_name || "Current Location",
        },
      });
    } catch (error) {
      console.error("Google reverse geocoding error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Google reverse geocoding failed" });
    }
  });

  app.post("/api/rides/estimate", (req: Request, res: Response) => {
    const { pickup, destination, rideType, cabSubType } = req.body;

    if (!pickup || !destination || !rideType) {
      return res.status(400).json({ error: "pickup, destination, and rideType are required" });
    }

    const distanceKm = calculateDistance(pickup.latitude, pickup.longitude, destination.latitude, destination.longitude) * 1.3;
    const providers: ProviderName[] = ['uber', 'ola', 'rapido'];
    const rides: any[] = [];

    for (const provider of providers) {
      const config = SUPPORTED_RIDE_TYPES[provider];
      if (!config.rideTypes.includes(rideType)) continue;

      if (rideType === 'cab') {
        const subTypes = cabSubType ? [cabSubType] : config.cabSubTypes;
        for (const st of subTypes) {
          const { price, eta, duration, surge } = generatePrice(provider, 'cab', distanceKm, st);
          rides.push({
            id: `${provider}-cab-${st}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            provider,
            rideType: 'cab',
            cabSubType: st,
            displayName: getDisplayName(provider, 'cab', st),
            price, currency: 'INR', eta,
            distance: Math.round(distanceKm * 10) / 10,
            duration, surgeMultiplier: surge,
            deepLink: buildDeepLink(provider, pickup, destination),
            playStoreLink: `https://play.google.com/store/apps/details?id=${PROVIDER_PLAY_STORE[provider]}`,
          });
        }
      } else {
        const { price, eta, duration, surge } = generatePrice(provider, rideType, distanceKm);
        rides.push({
          id: `${provider}-${rideType}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          provider, rideType,
          displayName: getDisplayName(provider, rideType),
          price, currency: 'INR', eta,
          distance: Math.round(distanceKm * 10) / 10,
          duration, surgeMultiplier: surge,
          deepLink: buildDeepLink(provider, pickup, destination),
          playStoreLink: `https://play.google.com/store/apps/details?id=${PROVIDER_PLAY_STORE[provider]}`,
        });
      }
    }

    rides.sort((a, b) => a.price - b.price);

    const cheapest = rides.length > 0 ? rides[0].id : '';
    const fastest = rides.length > 0 ? rides.reduce((m, r) => r.eta < m.eta ? r : m, rides[0]).id : '';
    const bestValue = rides.length > 0 ? rides.reduce((best, r) => {
      const s = r.price * 0.6 + r.eta * 10 * 0.4;
      const bs = best.price * 0.6 + best.eta * 10 * 0.4;
      return s < bs ? r : best;
    }, rides[0]).id : '';

    res.json({ rides, cheapest, fastest, bestValue });
  });

  app.get("/api/providers", (_req: Request, res: Response) => {
    res.json({
      providers: [
        { name: 'uber', displayName: 'Uber', rideTypes: ['bike', 'auto', 'cab'], cabSubTypes: ['mini', 'sedan', 'suv'] },
        { name: 'ola', displayName: 'Ola', rideTypes: ['bike', 'auto', 'cab'], cabSubTypes: ['mini', 'sedan', 'suv'] },
        { name: 'rapido', displayName: 'Rapido', rideTypes: ['bike', 'auto', 'cab'], cabSubTypes: ['mini'] },
      ],
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
