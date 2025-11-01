// app/queuing.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { useQueue } from './queuecontext'; // <- per your request
import { useSocket } from './context/SocketContext';

// ---------- Types ----------
type Runtime = { inside: number; waiting: number; eta?: number };
type Shop = {
  id: number;
  name: string;
  category: string;
  image: string;
  description: string;
  total_occupancy: number;
};
type ModalShop = Shop & { runtime?: Runtime; source?: string; joined?: boolean };

// ---------- Mock shops ----------
const initialShops: Shop[] = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  name: `Shop ${i + 1}`,
  category: ['Food', 'Fashion', 'Electronics'][i % 3],
  image: `https://source.unsplash.com/400x200/?shop,store,${i}`,
  description: `Sample shop ${i + 1} offering services and products.`,
  total_occupancy: 40 + (i % 5) * 5,
}));

export default function QueuePage({ navigation }: any) {
  const { socket } = useSocket();
  const { joinedShopId, joinShop, leaveShop } = useQueue();

  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [loadingShops, setLoadingShops] = useState(false);

  // unified search (name or category)
  const [search, setSearch] = useState<string>('');

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalShop, setModalShop] = useState<ModalShop | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // simulated realtime for shop id 1
  const realtimeRef = useRef<Record<number, Runtime>>({
    1: { inside: 8, waiting: 5 },
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const s = realtimeRef.current[1];
      if (!s) return;
      const deltaInside = Math.floor(Math.random() * 3) - 1;
      const deltaWaiting = Math.floor(Math.random() * 3) - 1;
      s.inside = Math.max(0, s.inside + deltaInside);
      s.waiting = Math.max(0, s.waiting + deltaWaiting);
      // update modal if currently showing shop 1
      setModalShop((prev: ModalShop | null) =>
        prev && prev.id === 1 ? { ...prev, runtime: { ...s } } : prev
      );
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // TextInput ref (no callback ref returning a value)
  const inputRef = useRef<TextInput>(null);

  // Filter by name OR category
  const filtered = shops.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  // open modal
  const openShopModal = (shop: Shop) => {
    Keyboard.dismiss();
    setModalShop(null);
    setModalLoading(true);
    setModalVisible(true);

    if (shop.id === 1) {
      const runtime = realtimeRef.current[1] ?? { inside: 0, waiting: 0 };
      setTimeout(() => {
        const enriched: ModalShop = { ...shop, runtime, source: 'realtime (simulated)' };
        setModalShop(enriched);
        setModalLoading(false);
      }, 250);
      return;
    }

    setTimeout(() => {
      const sim: Runtime = {
        inside: Math.max(0, Math.floor(Math.random() * 35)),
        waiting: Math.max(0, Math.floor(Math.random() * 20)),
        eta: Math.max(1, Math.floor(Math.random() * 30)),
      };
      const enriched: ModalShop = { ...shop, runtime: sim, source: 'ai-model-simulated' };
      setModalShop(enriched);
      setModalLoading(false);
    }, 600 + Math.floor(Math.random() * 400));
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalShop(null);
  };

  const handleJoinQueue = (shop: ModalShop) => {
    setModalShop((prev: ModalShop | null) => (prev ? { ...prev, joined: true } : prev));
    joinShop(shop.id);
    Toast.show({ type: 'success', text1: 'Joined queue', text2: `Joined ${shop.name}` });
  };

  const handleLeaveQueue = (shop: ModalShop) => {
    setModalShop((prev: ModalShop | null) => (prev ? { ...prev, joined: false } : prev));
    leaveShop();
    Toast.show({ type: 'info', text1: 'Left queue' });
  };

  const renderShop = ({ item }: { item: Shop }) => {
    const joined = joinedShopId === item.id;
    const badge = item.id === 1 ? 'Live demo' : item.category;
    return (
      <BlurView intensity={50} tint="dark" style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.cardContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.smallBadge}>
              <Text style={{ color: '#fff', fontSize: 11 }}>{badge}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => openShopModal(item)} style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>Open</Text>
            </TouchableOpacity>

            {joined ? (
              <TouchableOpacity onPress={() => handleLeaveQueue(item)} style={[styles.actionBtn, { backgroundColor: '#FF4C4C' }]}>
                <Text style={styles.actionText}>Leave Queue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => openShopModal(item)} style={[styles.actionBtn, { backgroundColor: '#4C89FF' }]}>
                <Text style={styles.actionText}>Join / Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    );
  };

  // Header area above FlatList (prevents keyboard blur)
  const HeaderArea = () => (
    <View style={styles.headerWrap}>
      <Text style={styles.headerTitle}>Find a Shop (search name or category)</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#9fb8ff" style={{ marginRight: 8 }} />
        <TextInput
          ref={inputRef} // <- use object ref, not callback that returns a value
          placeholder="e.g., Burger, Fashion, Electronics..."
          placeholderTextColor="#9fb8ff"
          value={search}
          onChangeText={(text: string) => {
            setSearch(text);
            // keep focus after re-render (prevents keyboard closing on first char)
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          style={styles.searchInput}
          returnKeyType="search"
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color="#9fb8ff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#071A2A', '#123D7B', '#2B6AD6']} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <HeaderArea />

          {loadingShops ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderShop}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
            />
          )}

          <Toast />

          {/* Shop modal */}
          <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
            <View style={styles.modalOverlay}>
              <BlurView intensity={60} tint="dark" style={styles.modalCard}>
                {modalLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : modalShop ? (
                  <>
                    <Text style={styles.modalTitle}>{modalShop.name}</Text>
                    <Text style={styles.modalSub}>{modalShop.category} • {modalShop.source ?? 'fetched'}</Text>

                    <View style={styles.structure}>
                      <View style={styles.boxRow}>
                        <View style={styles.box}>
                          <Text style={styles.boxLabel}>Inside</Text>
                          <Text style={styles.boxValue}>{modalShop.runtime?.inside ?? '-'}</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLabel}>Waiting</Text>
                          <Text style={styles.boxValue}>{modalShop.runtime?.waiting ?? '-'}</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLabel}>Capacity</Text>
                          <Text style={styles.boxValue}>{modalShop.total_occupancy ?? '-'}</Text>
                        </View>
                      </View>

                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.smallLabel}>Estimated wait time</Text>
                        <Text style={styles.etaText}>
                          {modalShop.runtime?.eta
                            ? `${modalShop.runtime.eta} min`
                            : `${Math.max(1, Math.round(((modalShop.runtime?.waiting ?? 0) * 2)))} min`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      {joinedShopId === modalShop.id ? (
                        <TouchableOpacity style={[styles.modalPrimary, { backgroundColor: '#FF4C4C' }]} onPress={() => handleLeaveQueue(modalShop)}>
                          <Text style={styles.modalPrimaryText}>Leave Queue</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.modalPrimary} onPress={() => handleJoinQueue(modalShop)}>
                          <Text style={styles.modalPrimaryText}>Join Queue</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.modalOutline} onPress={closeModal}>
                        <Text style={styles.modalOutlineText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={{ color: '#fff' }}>No data</Text>
                )}
              </BlurView>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  list: { paddingBottom: 90 },
  headerWrap: { marginBottom: 12 },
  headerTitle: { color: '#EAF6FF', fontSize: 22, fontWeight: '800', marginBottom: 10 },

  // SEARCH
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#CFE7FF',
    fontSize: 15,
    paddingVertical: 4,
  },

  card: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  image: { width: '100%', height: 140, backgroundColor: '#223554' },
  cardContent: { padding: 12 },
  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  description: { color: '#D6E9FF', fontSize: 13, marginTop: 6 },

  smallBadge: { backgroundColor: '#4C89FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },

  viewBtn: { backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  viewBtnText: { color: '#CFE7FF', fontWeight: '700' },

  actionBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  actionText: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { width: '92%', padding: 16, borderRadius: 14, alignItems: 'center' },
  modalTitle: { fontSize: 22, color: '#fff', fontWeight: '800' },
  modalSub: { color: '#CFE7FF', marginBottom: 12 },

  structure: { width: '100%', marginTop: 6 },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  boxLabel: { color: '#CFE7FF', fontSize: 12 },
  boxValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6 },

  smallLabel: { color: '#CFE7FF', fontSize: 12 },
  etaText: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 6 },

  modalActions: { width: '100%', marginTop: 16, flexDirection: 'row', gap: 12, justifyContent: 'center' },
  modalPrimary: { flex: 1, backgroundColor: '#4C89FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalPrimaryText: { color: '#fff', fontWeight: '800' },
  modalOutline: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalOutlineText: { color: '#CFE7FF', fontWeight: '700' },
});
