# Google Places integration

This project now uses the real Google Places API (New) for pickup/destination search.

## 1. Google Cloud
Enable:
- Places API (New)
- Geocoding API

Create an API key in Google Cloud and restrict it to those APIs.

## 2. Environment variables
Copy `.env.example` to `.env`.

For the Expo app:
`EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000`

For the Express server:
`GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_API_KEY`

Keep `GOOGLE_PLACES_API_KEY` server-side. Do not rename it to `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`.

## 3. Run
Terminal 1:
`npm run server:dev`

Terminal 2:
`npx expo start`

For a physical phone, the phone and computer must be on the same Wi-Fi and the firewall must allow port 5000.

## 4. What happens
- Typing in Pickup or Destination calls `/api/places/autocomplete`.
- Selecting a suggestion calls `/api/places/details/:placeId`.
- The app stores Google's exact latitude/longitude and formatted address.
- Startup GPS is reverse-geocoded through `/api/places/reverse-geocode`.
- The old hardcoded Bangalore/Mumbai/Delhi demo locations are no longer used.

## Important
This is Google location search. It does not provide live Uber/Ola/Rapido prices or driver availability.
