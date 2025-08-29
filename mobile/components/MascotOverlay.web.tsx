import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';

export default function MascotOverlay() {
  const [visible, setVisible] = useState(true);
  const [message] = useState<string>(
    'Привет! Я здесь, чтобы помочь. Открой Игры и залетай в комнату!'
  );

  const translate = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, { opacity, transform: [{ translateY: translate }] }]}
    >
      <TouchableOpacity style={styles.avatar} onPress={() => setVisible(false)} activeOpacity={0.8}>
        <Text style={styles.avatarEmoji}>AI</Text>
      </TouchableOpacity>
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
        <View style={styles.tail} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.select({ ios: 90, android: 70, default: 70 }),
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderColor: '#F2E9E8',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarEmoji: { fontSize: 28 },
  bubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2E9E8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  text: { color: '#4A3F3D', fontWeight: '600' },
  tail: {
    position: 'absolute',
    left: -6,
    bottom: 10,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2E9E8',
  },
});

