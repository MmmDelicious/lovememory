import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Send, UserPlus } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { getStatus, sendRequest, acceptRequest } from '../services/pair.service';

type PairStatus = {
  status: 'none' | 'pending' | 'active' | 'received';
  partner?: { id: string; email: string; first_name?: string } | null;
  requestId?: string;
};

export default function PartnerScreen() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<PairStatus>({ status: 'none' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await getStatus();
      setState(res.data);
    } catch (e) {
      setState({ status: 'none' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await sendRequest(email);
      await load();
      setEmail('');
    } finally {
      setLoading(false);
    }
  };

  const onAccept = async () => {
    if (!state.requestId) return;
    setLoading(true);
    try {
      await acceptRequest(state.requestId);
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <Text style={styles.title}>Пара</Text>
        <Text style={styles.subtitle}>Соединись со своей второй половиной</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
        <LinearGradient colors={['#FFFFFF', '#FFF8F6']} style={styles.cardGradient}>
          {state.status === 'active' && state.partner ? (
            <View style={{ alignItems: 'center' }}>
              <Heart size={24} color="#D97A6C" strokeWidth={2} />
              <Text style={styles.pairText}>Пара активна</Text>
              <Text style={styles.partnerName}>{state.partner.first_name || state.partner.email}</Text>
            </View>
          ) : state.status === 'received' ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.pairText}>Вам пришло приглашение</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onAccept} disabled={loading}>
                <Text style={styles.btnText}>Принять</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.pairText}>Отправьте приглашение на email партнера</Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="email партнера"
                  placeholderTextColor="#B8A8A4"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.iconBtn} onPress={onSend} disabled={loading}>
                  <Send size={18} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#4A3F3D' },
  subtitle: { fontSize: 14, color: '#8C7F7D', marginTop: 4 },
  card: { marginHorizontal: 20 },
  cardGradient: { padding: 20, borderRadius: 16 },
  pairText: { color: '#4A3F3D', textAlign: 'center', marginTop: 8, marginBottom: 12, fontWeight: '600' },
  partnerName: { color: '#D97A6C', fontWeight: '700', fontSize: 16, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: '#FFF8F6', borderWidth: 1, borderColor: '#F2E9E8', borderRadius: 12, paddingHorizontal: 12, height: 44, color: '#4A3F3D' },
  iconBtn: { width: 44, height: 44, backgroundColor: '#D97A6C', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { backgroundColor: '#D97A6C', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});


