import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  style?: ViewStyle;
  onPress: () => void;
}

export const RoomCard = ({ room, style, onPress }: RoomCardProps) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      {/* Hình ảnh đại diện cho phòng */}
      <Image 
        source={{ uri: room.image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800' }} 
        style={styles.image} 
      />
      
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.roomCode}>{room.room_code}</Text>
          <View style={[styles.typeBadge, room.type === 'LAB' ? styles.labBadge : styles.theoryBadge]}>
            <Text style={styles.typeText}>{room.type === 'LAB' ? 'PHÒNG LAB' : 'LÝ THUYẾT'}</Text>
          </View>
        </View>

        <Text style={styles.locationText}>Tầng {room.floor} - {room.buildings?.name || 'Khu giảng đường'}</Text>
        <Text style={styles.capacityText}>👥 Sức chứa: {room.capacity} chỗ ngồi</Text>

        <View style={styles.equipmentsRow}>
          {room.equipments?.slice(0, 3).map((eq, idx) => (
            <View key={idx} style={styles.eqChip}>
              <Text style={styles.eqText}>{eq}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Đặt phòng ngay</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 14, marginBottom: 16, overflow: 'hidden', elevation: 3 },
  image: { width: '100%', height: 130, backgroundColor: '#E2E8F0' },
  body: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomCode: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  labBadge: { backgroundColor: '#FEF3C7' },
  theoryBadge: { backgroundColor: '#E0F2FE' },
  typeText: { fontSize: 10, fontWeight: '700', color: '#0284C7' },
  locationText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  capacityText: { fontSize: 12, color: '#334155', fontWeight: '600', marginTop: 2 },
  equipmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  eqChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  eqText: { fontSize: 10, color: '#475569' },
  bookBtn: { marginTop: 12, backgroundColor: '#2563EB', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});