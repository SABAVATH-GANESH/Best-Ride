# Real Google pickup/destination locations

The original app used a hardcoded `POPULAR_LOCATIONS` array. This version removes that demo search behavior.

## Google Places search
The app now calls the Express backend while the user types:

`POST /api/places/autocomplete`

After a user taps a suggestion, it calls:

`GET /api/places/details/:placeId`

Google returns the exact latitude, longitude, place name, and formatted address.

## Current location
The phone/browser obtains real GPS coordinates. The backend calls Google Geocoding to turn those coordinates into a real address:

`GET /api/places/reverse-geocode`

There is no longer a fallback to `MG Road, Bangalore` or another fake demo address.

## Environment
Create `.env` in the project root:

`EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000`

`GOOGLE_PLACES_API_KEY=YOUR_SERVER_GOOGLE_KEY`

For a physical phone, use your computer LAN IP and keep both devices on the same Wi-Fi.

## Google Cloud APIs
Enable:
- Places API (New)
- Geocoding API

If you also want an interactive Google map inside the app, install the Expo-compatible `react-native-maps` package:

`npx expo install react-native-maps`

Expo SDK 54 recommends `react-native-maps` 1.20.1 and includes it in Expo Go for testing. Store/development builds need the Maps SDK and native API-key configuration. See the Expo SDK 54 map documentation.
