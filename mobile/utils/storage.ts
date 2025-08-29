import AsyncStorage from '@react-native-async-storage/async-storage';

function isWeb(): boolean {
  try {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  } catch {
    return false;
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    if (isWeb() && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb() && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (isWeb() && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {}
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

