import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chess" />
      <Stack.Screen name="quiz" />
    </Stack>
  );
}