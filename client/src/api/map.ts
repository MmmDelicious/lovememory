// Yandex Maps API Integration utility
// Provides the API key for Yandex Maps services

export interface Place {
  id: string;
  name: string;
  coordinates: [number, number];
  type?: string;
  address?: string;
}

export interface DateRouteData {
  places: Place[];
  routeGeometry?: [number, number][];
}

/**
 * Retrieves the Yandex Maps API key from environment variables.
 * @returns {string} The API key.
 */
export const getYandexApiKey = (): string => {
  const apiKey = import.meta.env.VITE_YANDEX_API;
  if (!apiKey) {
    console.warn('⚠️ VITE_YANDEX_API key not found in environment variables.');
    return '';
  }
  return apiKey;
};
