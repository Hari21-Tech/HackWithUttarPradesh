// app/components/GlassCard.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: (e: GestureResponderEvent) => void;
  style?: ViewStyle;
};

export default function GlassCard({
  icon = 'albums-outline',
  title,
  subtitle,
  ctaLabel = 'Open',
  onPress,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  };

  return (
    <Animated.View style={[styles.animatedWrapper, { transform: [{ scale }] }]}>
      <BlurView intensity={70} tint="dark" style={[styles.card, style]}>
        <Ionicons name={icon as any} size={28} color="#EAF6FF" />
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: { width: '100%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  textWrap: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#D6E9FF', marginTop: 4, fontSize: 13 },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctaText: { color: '#EAF6FF', fontWeight: '700', fontSize: 13 },
});
