// app/backtracking.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// A tiny base64 placeholder (transparent PNG) – replace with real binary from backend when available:
const BLANK_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////FwAJxwP5WkzjNwAAAABJRU5ErkJggg==';

type RequestItem = {
  id: string;
  objectName: string;
  objectColor: string;
  createdAt: string; // ISO
  status: 'found' | 'in_progress' | 'not_matched';
  lastKnownLocation?: string;
  // When backend returns binary bytes, encode to base64 and send as this:
  imageBase64?: string; // base64 (no data: prefix)
};

export default function Backtracking() {
  // --- Submit form state ---
  const [objectName, setObjectName] = useState('');
  const [objectColor, setObjectColor] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pressScale = useMemo(() => new Animated.Value(1), []);

  // --- History state (mocked) ---
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 'req_101',
      objectName: 'Wallet',
      objectColor: 'Black',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: 'found',
      lastKnownLocation: 'Library – Ground Floor',
      imageBase64: BLANK_BASE64,
    },
    {
      id: 'req_102',
      objectName: 'Bottle',
      objectColor: 'Blue',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      status: 'in_progress',
      lastKnownLocation: 'Cafeteria – Counter 2',
      imageBase64: BLANK_BASE64,
    },
    {
      id: 'req_103',
      objectName: 'Earbuds Case',
      objectColor: 'White',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      status: 'not_matched',
      lastKnownLocation: 'Gym – Locker Area',
      imageBase64: BLANK_BASE64,
    },
  ]);

  useEffect(() => {
    // Simulate fetching history
    setLoadingHistory(true);
    const t = setTimeout(() => setLoadingHistory(false), 600);
    return () => clearTimeout(t);
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant media library permissions to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri ?? null;
      setUserImage(uri);
    }
  };

  const handleRemoveImage = () => setUserImage(null);

  const handleSubmit = () => {
    if (!objectName.trim() || !objectColor.trim() || !userImage) {
      Alert.alert('Error', 'Please fill in all fields and upload an image');
      return;
    }
    setSubmitting(true);

    // Simulate backend create
    const newItem: RequestItem = {
      id: `req_${Math.floor(Math.random() * 100000)}`,
      objectName,
      objectColor,
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      lastKnownLocation: 'Processing...',
      // For demo we’ll keep placeholder img; in real app you’d send your selected image to backend.
      imageBase64: BLANK_BASE64,
    };

    setTimeout(() => {
      setRequests((prev) => [newItem, ...prev]);
      setSubmitting(false);
      Alert.alert('Success', 'Your lost object details have been submitted. We will help you find it!');
      setObjectName('');
      setObjectColor('');
      setUserImage(null);
    }, 900);
  };

  const animatePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const animatePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const formatWhen = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const statusPill = (status: RequestItem['status']) => {
    const map = {
      found: { label: 'Found', bg: '#10b981' },
      in_progress: { label: 'In progress', bg: '#4C89FF' },
      not_matched: { label: 'Not matched', bg: '#ef4444' },
    } as const;
    const s = map[status];
    return (
      <View style={[styles.pill, { backgroundColor: s.bg }]}>
        <Text style={styles.pillText}>{s.label}</Text>
      </View>
    );
  };

  const handleNotMyObject = (id: string) => {
    // Simulate notifying backend that suggested match is wrong
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'not_matched' } : r))
    );
    Alert.alert('Noted', 'Thanks! We’ll continue searching for your object.');
  };

  const renderHistoryItem = ({ item }: { item: RequestItem }) => {
    const dataUri = `data:image/png;base64,${item.imageBase64 || BLANK_BASE64}`;
    return (
      <BlurView intensity={70} tint="dark" style={styles.historyCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{item.objectName}</Text>
          {statusPill(item.status)}
        </View>

        <Text style={styles.cardMeta}>Color: <Text style={{ fontWeight: '700', color: '#fff' }}>{item.objectColor}</Text></Text>
        <Text style={styles.cardMeta}>Last location: <Text style={{ color: '#e8f2ff' }}>{item.lastKnownLocation || '—'}</Text></Text>
        <Text style={styles.cardMeta}>Requested: <Text style={{ color: '#e8f2ff' }}>{formatWhen(item.createdAt)}</Text></Text>

        <View style={styles.previewRow}>
          <Image source={{ uri: dataUri }} style={styles.historyImage} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.previewCaption}>Possible match preview</Text>
            <Text style={styles.previewHint}>Binary image decoded from base64</Text>

            <View style={styles.historyButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionSlim, { backgroundColor: '#4C89FF' }]}
                onPress={() => Alert.alert('Opening', 'Open full result / navigate to details screen')}
              >
                <Ionicons name="eye-outline" size={16} color="#fff" />
                <Text style={styles.actionSlimText}>View result</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionSlim, { backgroundColor: '#ef4444' }]}
                onPress={() => handleNotMyObject(item.id)}
              >
                <Ionicons name="close-circle-outline" size={16} color="#fff" />
                <Text style={styles.actionSlimText}>Not my object</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    );
  };

  return (
    <LinearGradient colors={['#071A2A', '#0F3B66']} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Text style={styles.header}>Report Lost Object</Text>
        <Text style={styles.sub}>Add details and upload a photo to help locate it</Text>

        {/* Form Card */}
        <BlurView intensity={80} tint="dark" style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Object Name</Text>
            <TextInput
              placeholder="e.g., Wallet, Phone, Keys"
              placeholderTextColor="#9fb8ff"
              value={objectName}
              onChangeText={setObjectName}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Object Color</Text>
            <TextInput
              placeholder="e.g., Black, Red, Blue"
              placeholderTextColor="#9fb8ff"
              value={objectColor}
              onChangeText={setObjectColor}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Upload Photo</Text>

            <Animated.View style={{ transform: [{ scale: pressScale }] as any, width: '100%' }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start()}
                onPress={pickImage}
                style={styles.uploadButton}
              >
                <Ionicons name="image-outline" size={18} color="#fff" />
                <Text style={styles.uploadButtonText}>{userImage ? 'Change Photo' : 'Select Photo'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {userImage ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: userImage }} style={styles.previewImage} />
                <TouchableOpacity onPress={handleRemoveImage} style={styles.removeImageBtn}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.8 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <LinearGradient colors={['#4C89FF', '#1E62D0']} style={styles.submitGradient}>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Details'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        {/* History Section */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyHeader}>My Requests</Text>
          {loadingHistory ? <ActivityIndicator size="small" color="#cfe7ff" /> : null}
        </View>

        {requests.length === 0 && !loadingHistory ? (
          <Text style={styles.emptyNote}>No requests yet. Submit the form above to create one.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(it) => it.id}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingBottom: 22 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 18 : 8,
  },
  header: {
    marginTop: 6,
    color: '#EAF6FF',
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    marginTop: 6,
    color: '#CFE7FF',
    fontSize: 13,
    marginBottom: 18,
  },
  formCard: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  field: { marginBottom: 14 },
  label: { color: '#CFE7FF', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  uploadButtonText: { color: '#EAF6FF', fontWeight: '700', marginLeft: 8 },
  previewWrap: {
    marginTop: 10,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 190, borderRadius: 12 },
  removeImageBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 8,
    borderRadius: 8,
  },
  submitBtn: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  submitText: { color: '#fff', fontWeight: '800' },

  // History
  historyHeaderRow: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyHeader: {
    color: '#EAF6FF',
    fontSize: 20,
    fontWeight: '800',
  },
  emptyNote: {
    color: '#cfe7ff',
    opacity: 0.8,
    marginTop: 6,
  },

  historyCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardMeta: { color: '#cfe7ff', marginTop: 2, fontSize: 12 },
  previewRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  historyImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#244268' },
  previewCaption: { color: '#eaf6ff', fontWeight: '700' },
  previewHint: { color: '#cfe7ff', fontSize: 12, marginTop: 2 },

  historyButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionSlim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  actionSlimText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
