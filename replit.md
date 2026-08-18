# Best Ride - Ride Price Comparison App

## Overview
Best Ride is a mobile app for the Indian market that aggregates and compares ride prices from Uber, Ola, and Rapido in one place. Users can see estimated fares side-by-side and tap to open their preferred ride-hailing app for booking.

## Current State
- MVP with mock pricing engine (realistic fare calculations based on distance)
- GPS-based pickup detection with manual location selection
- Supports Bike, Auto, and Cab (Mini/Sedan/SUV) ride types
- Deep linking to Uber, Ola, Rapido apps (or Play Store fallback)
- Professional UI with DM Sans font, emerald green + navy theme

## Architecture

### Frontend (Expo/React Native)
- `app/index.tsx` - Home screen with location input and ride type selection
- `app/results.tsx` - Price comparison results screen with ride cards
- `components/LocationInput.tsx` - Pickup/destination input component
- `components/RideTypeSelector.tsx` - Bike/Auto/Cab toggle
- `components/RideCard.tsx` - Individual ride option card with provider branding
- `components/ProviderLogo.tsx` - Provider icon component
- `components/SearchLocationModal.tsx` - Location search with popular Indian cities

### Service Layer
- `lib/ride-service.ts` - Mock pricing engine with pluggable architecture
  - Distance-based fare calculation per provider
  - Surge pricing simulation
  - Deep link generation for Uber/Ola/Rapido
  - **Integration point**: Replace mock functions with real API calls

### Backend (Express)
- `server/routes.ts` - REST API for ride estimates
  - POST `/api/rides/estimate` - Get price estimates
  - GET `/api/providers` - List supported providers

### Types
- `lib/types.ts` - Shared TypeScript interfaces

## API Integration Guide
To switch from mock data to real APIs:
1. Add API keys as secrets (never hardcode)
2. Create provider-specific adapter in `lib/ride-service.ts`
3. Each provider implements the same interface
4. Toggle between mock and real via environment variable

## Recent Changes
- 2026-02-09: Initial MVP build with mock pricing engine

## User Preferences
- Indian market focus (INR currency, Indian cities)
- Professional look suitable for investor demos
- Clean modular architecture
