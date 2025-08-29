import { Platform } from 'react-native';
import Constants from 'expo-constants';

function normalizeUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    // trim whitespace and trailing slashes
    const trimmed = url.trim().replace(/\/$/, '');
    return trimmed || null;
  } catch {
    return null;
  }
}

function resolveApiBaseUrl(): string {
  // 1) Explicit env override (recommended for Expo on device/tunnel)
  const envUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;

  // 2) Expo extra (optional)
  // @ts-ignore
  const extraUrl = normalizeUrl((Constants as any)?.expoConfig?.extra?.apiBaseUrl);
  if (extraUrl) return extraUrl;

  // 3) Try to infer LAN IP from Expo host/debugger
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === 'localhost') {
      return `http://${host}:5000`;
    }
  }

  // 4) Fallbacks for simulators. Note: on physical device this will NOT work — set EXPO_PUBLIC_API_BASE_URL
  const fallback = Platform.select({
    ios: 'http://localhost:5000',
    android: 'http://10.0.2.2:5000', // Android emulator loopback
    default: 'http://localhost:5000',
  });
  return fallback as string;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const SOCKET_URL =
  normalizeUrl(process.env.EXPO_PUBLIC_SOCKET_URL) || API_BASE_URL;

