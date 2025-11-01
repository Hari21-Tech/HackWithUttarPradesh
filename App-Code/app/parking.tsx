// app/parking.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from './context/SocketContext';

type Spot = {
  id: string;
  floor: number;
  isAvailable: boolean;
};

// 🅿️ 100 mock spots (25 per floor × 4 floors)
const mockParkingSpots: Spot[] = Array.from({ length: 100 }, (_, i) => {
  const floor = Math.floor(i / 25) + 1;
  const row = Math.floor((i % 25) / 5) + 1;
  const col = String.fromCharCode(65 + (i % 5)); // A–E
  const id = `${col}${row}`;
  const isAvailable = Math.random() > 0.3; // 70% available
  return { id, floor, isAvailable };
});

export default function Parking() {
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [availableSpots, setAvailableSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { socket } = useSocket();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // fallback to mock if no socket
    if (!socket) {
      setAvailableSpots(mockParkingSpots);
      setSelectedSpot(mockParkingSpots.find((s) => s.isAvailable) ?? null);
    }
  }, [socket]);

  const floors = Array.from(new Set(availableSpots.map((s) => s.floor))).sort((a, b) => a - b);
  const spotsForFloor = availableSpots.filter((s) => s.floor === currentFloor);

  const windowWidth = Dimensions.get('window').width;
  const numColumns = windowWidth > 420 ? 7 : windowWidth > 360 ? 6 : 5;
  const itemSize = Math.floor((windowWidth - 48) / numColumns); // smaller grid

  const handleSelectSpot = (spot: Spot) => setSelectedSpot(spot);

  const handleRequestNewSpot = () => {
    if (availableSpots.length <= 1) return;
    const availOnly = availableSpots.filter((s) => s.isAvailable);
    const next = availOnly[Math.floor(Math.random() * availOnly.length)];
    setSelectedSpot(next);
    setCurrentFloor(next.floor);
  };

  return (
    <LinearGradient colors={['#071A2A', '#0F3B66', '#2B6AD6']} style={styles.gradient}>
      <StatusBar translucent barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Parking Helper</Text>
        <Text style={styles.subtitle}>Tap a spot or request another</Text>

        {/* Selected Spot Card */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <BlurView intensity={90} tint="dark" style={styles.card}>
            <Ionicons name="car-outline" size={40} color="#EAF6FF" />
            <View style={styles.spotTextContainer}>
              {selectedSpot ? (
                <>
                  <Text style={styles.spotLabel}>Selected Spot</Text>
                  <Text style={styles.spotValue}>
                    Floor {selectedSpot.floor} — {selectedSpot.id}
                  </Text>
                </>
              ) : (
                <Text style={styles.noSpot}>No spots selected</Text>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Request Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestNewSpot}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#4C89FF', '#1E62D0']} style={styles.buttonGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>{loading ? 'Searching...' : 'Request Another Spot'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Floor Tabs */}
        <View style={styles.floorTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {floors.map((f) => {
              const active = f === currentFloor;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setCurrentFloor(f)}
                  style={[styles.floorTab, active && styles.floorTabActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.floorTabText, active && styles.floorTabTextActive]}>
                    Floor {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Floor Grid */}
        <View style={[styles.gridContainer]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.gridRow}>
              {spotsForFloor.map((spot) => {
                const isSelected = selectedSpot?.id === spot.id;
                const bgColor = !spot.isAvailable
                  ? 'rgba(255, 0, 0, 0.2)' // red for occupied
                  : 'rgba(0, 255, 0, 0.15)'; // green for available
                const borderColor = !spot.isAvailable
                  ? 'rgba(255, 0, 0, 0.8)'
                  : 'rgba(0, 255, 0, 0.6)';

                return (
                  <TouchableOpacity
                    key={`${spot.floor}-${spot.id}`}
                    onPress={() => handleSelectSpot(spot)}
                    style={[
                      styles.gridItem,
                      { width: itemSize, height: 65, backgroundColor: bgColor, borderColor },
                      isSelected && styles.gridSelected,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.gridItemText, isSelected && styles.gridItemTextSelected]}
                      numberOfLines={1}
                    >
                      {spot.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: 'rgba(0,255,0,0.6)' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: 'rgba(255,0,0,0.7)' }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: 'rgba(76,137,255,0.8)' }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>

        <Text style={styles.footerText}>{availableSpots.length} total spots • 25 per floor</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#EAF6FF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#CFE7FF',
    marginBottom: 14,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 14,
  },
  spotTextContainer: { marginLeft: 14, flex: 1 },
  spotLabel: {
    color: '#D9E9FF',
    fontSize: 14,
    opacity: 0.95,
  },
  spotValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  noSpot: {
    color: '#FFD6D6',
    fontSize: 14,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  floorTabsContainer: {
    width: '100%',
    marginTop: 18,
    marginBottom: 8,
  },
  floorTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  floorTabActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  floorTabText: {
    color: '#CFE7FF',
    fontWeight: '600',
  },
  floorTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  gridContainer: {
    width: '100%',
    flex: 1,
    marginTop: 10,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  gridItem: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  gridSelected: {
    backgroundColor: 'rgba(76,137,255,0.25)',
    borderColor: '#4C89FF',
    shadowColor: '#4C89FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  gridItemText: {
    color: '#EAF6FF',
    fontSize: 13,
    fontWeight: '700',
  },
  gridItemTextSelected: {
    color: '#FFFFFF',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 16, height: 16, borderRadius: 4 },
  legendText: { color: '#CFE7FF', fontSize: 12 },
  footerText: {
    marginTop: 10,
    color: '#AAC8EE',
    fontSize: 13,
    opacity: 0.9,
  },
});
