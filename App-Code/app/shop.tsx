// app/shop.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useQueue } from './queuecontext';
import { useSocket } from './context/SocketContext';

const ETA_PER_PERSON = 2; // minutes per person (approx)

export default function ShopDetail({ route, navigation }: any) {
  const { socket } = useSocket();
  const { shop } = route.params ?? {};
  const mountedRef = useRef(true);

  const [location, setLocation] = useState<any>(null);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [currentOccupancy, setCurrentOccupancy] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(true);

  const { leaveShop } = useQueue();

  useEffect(() => {
    mountedRef.current = true;

    if (!socket) {
      // fallback: no realtime server — keep loading false
      setLoadingQueue(false);
      return;
    }

    const onGetShopQueue = (data: any) => {
      if (!mountedRef.current) return;
      const rows = data?.result?.rows ?? [];
      setQueueCount(Array.isArray(rows) ? rows.length : 0);
      setLoadingQueue(false);
    };

    const onQueueUpdate = (data: any) => {
      if (!mountedRef.current) return;
      // server may send a number or object — handle both
      const occupancy = typeof data === 'number' ? data : data?.currentOccupancy ?? 0;
      setCurrentOccupancy(occupancy);
      setEta((occupancy + queueCount) * ETA_PER_PERSON);
    };

    socket.on('get_shop_queue_result', onGetShopQueue);
    socket.on('queue_update', onQueueUpdate);

    if (shop?.id) {
      try {
        socket.emit('get_shop_queue', shop.id);
      } catch (e) {
        console.warn('[Shop] emit get_shop_queue failed', e);
      }
    }

    // location
    getUserLocation();

    return () => {
      mountedRef.current = false;
      try {
        socket.off('get_shop_queue_result', onGetShopQueue);
        socket.off('queue_update', onQueueUpdate);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, shop?.id]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[Shop] location permission denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords);
    } catch (e) {
      console.warn('[Shop] getUserLocation failed', e);
    }
  };

  const handleLeaveConfirm = () => {
    leaveShop();
    setModalVisible(false);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#071A2A', '#0F3B66', '#2B6AD6']} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <BlurView intensity={70} tint="dark" style={styles.card}>
            <Text style={styles.name}>{shop?.name ?? 'Shop'}</Text>
            <Text style={styles.category}>{shop?.category ?? 'Category'}</Text>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{shop?.description ?? 'No description available.'}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current Occupancy</Text>
                <Text style={styles.statValue}>{currentOccupancy ?? 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Queue Count</Text>
                {loadingQueue ? <ActivityIndicator color="#fff" /> : <Text style={styles.statValue}>{queueCount}</Text>}
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ETA (min)</Text>
                <Text style={styles.statValue}>{eta}</Text>
              </View>
            </View>
          </BlurView>
        </ScrollView>

        <TouchableOpacity style={styles.leaveQueueFixedButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="exit-outline" size={18} color="#fff" />
          <Text style={styles.leaveText}>Leave Queue</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Are you sure you want to leave the queue?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveConfirm}>
                  <Text style={styles.buttonText}>Yes, Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scrollContainer: { padding: 18, paddingBottom: 120 },
  card: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  category: { color: '#CFE7FF', marginBottom: 12 },
  infoSection: { marginVertical: 10 },
  sectionTitle: { color: '#EAF6FF', fontWeight: '700', marginBottom: 6 },
  description: { color: '#D6E9FF', lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  statCard: { alignItems: 'center', flex: 1, padding: 8 },
  statLabel: { color: '#CFE7FF', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 6 },
  leaveQueueFixedButton: {
    position: 'absolute',
    bottom: 22,
    left: 18,
    right: 18,
    backgroundColor: '#FF4C4C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  leaveText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '86%', padding: 20, backgroundColor: '#fff', borderRadius: 12 },
  modalText: { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { backgroundColor: '#999', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  leaveBtn: { backgroundColor: '#FF4C4C', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
