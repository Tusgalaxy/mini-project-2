import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoomCard } from '../components/RoomCard';
import { FilterSection } from '../components/FilterSection';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { supabase } from '../config/supabase';
import { Room } from '../types';
import { BookingModal } from '../components/BookingModal';
import { useFilterStore } from '../store/useFilterStore';

export const BrowseRoomsScreen = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { columns, cardWidth } = useResponsiveLayout();

  // State từ Zustand Store
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const zone = useFilterStore((s) => s.zone);
  const building = useFilterStore((s) => s.building);
  const minCapacity = useFilterStore((s) => s.minCapacity);
  const hasProjector = useFilterStore((s) => s.hasProjector);
  const hasAirConditioner = useFilterStore((s) => s.hasAirConditioner);
  const selectedDate = useFilterStore((s) => s.selectedDate);
  const filterSlotStart = useFilterStore((s) => s.filterSlotStart);
  const filterSlotEnd = useFilterStore((s) => s.filterSlotEnd);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Lấy tất cả danh sách phòng
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*, buildings(code, name)')
        .order('room_code');

      if (roomsError) throw roomsError;

      // 2. Lấy đơn đặt phòng trong ngày chọn (APPROVED hoặc PENDING)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id, start_slot, end_slot')
        .eq('booking_date', selectedDate)
        .in('status', ['APPROVED', 'PENDING']);

      if (bookingsError) throw bookingsError;

      setRooms((roomsData as unknown as Room[]) || []);
      setBookings(bookingsData || []);
    } catch (error: any) {
      console.error('Lỗi lấy dữ liệu:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleOpenBookingModal = (room: Room) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  // Lọc phòng linh hoạt
  const filteredRooms = useMemo(() => {
    return rooms.filter((r: any) => {
      const roomBookings = bookings.filter((b) => b.room_id === r.id);

      // 0. LOẠI BỎ PHÒNG ĐÃ CÓ LỊCH ĐẶT TRÙNG TIẾT
      if (roomBookings.length > 0) {
        if (filterSlotStart && filterSlotEnd) {
          // Lọc chính xác theo khung tiết người dùng chọn
          const isSlotConflicted = roomBookings.some(
            (b) => filterSlotStart <= b.end_slot && filterSlotEnd >= b.start_slot
          );
          if (isSlotConflicted) return false;
        } else {
          // Nếu không nhập tiết lọc, ẩn nếu phòng bị đặt toàn bộ cả ngày
          if (roomBookings.length >= 1) return false;
        }
      }

      const roomCode = String(r.room_code || '').toUpperCase().trim();
      const bCode = String(r.buildings?.code || '').toUpperCase().trim();
      const bName = String(r.buildings?.name || '').toUpperCase().trim();

      // 1. Ô tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toUpperCase().trim();
        const matchSearch = roomCode.includes(q) || bCode.includes(q) || bName.includes(q);
        if (!matchSearch) return false;
      }

      // 2. Lọc theo Khu
      if (zone) {
        const targetZone = zone.toUpperCase().trim();
        const matchZone = 
          roomCode.startsWith(`${targetZone}.`) || 
          roomCode.startsWith(targetZone) ||
          bCode.startsWith(targetZone);

        if (!matchZone) return false;
      }

      // 3. Lọc theo Tòa nhà
      if (building) {
        if (building === 'Hành chính') {
          const matchHC = 
            roomCode.includes('HC') || 
            bCode.includes('HC') || 
            bName.includes('HÀNH CHÍNH');
          if (!matchHC) return false;
        } else {
          const targetLetter = building.replace(/Tòa/i, '').trim().toUpperCase();
          const regexBuilding = new RegExp(`^[KV][\\.\\-_]?${targetLetter}[0-9\\._\\-]`);
          
          const matchBuilding = 
            regexBuilding.test(roomCode) || 
            bCode === targetLetter || 
            bCode === `${zone || ''}_${targetLetter}` ||
            bCode === `${zone || ''}${targetLetter}` ||
            bName === `TÒA ${targetLetter}`;

          if (!matchBuilding) return false;
        }
      }

      // 4. Sức chứa
      if (minCapacity && (r.capacity ?? 0) < minCapacity) return false;

      // 5. Tiện ích
      if (hasProjector && !r.has_projector) return false;
      if (hasAirConditioner && !r.has_air_conditioner) return false;

      return true;
    });
  }, [
    rooms, 
    bookings, 
    searchQuery, 
    zone, 
    building, 
    minCapacity, 
    hasProjector, 
    hasAirConditioner, 
    filterSlotStart, 
    filterSlotEnd
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>VKU Room Booking</Text>
      </View>

      <FilterSection />

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filteredRooms}
          key={columns}
          numColumns={columns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              style={{
                width: columns > 1 ? cardWidth : '100%',
                marginHorizontal: columns > 1 ? 4 : 0,
              }}
              onPress={() => handleOpenBookingModal(item)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không tìm thấy phòng trống phù hợp.</Text>
          }
        />
      )}

      <BookingModal
        visible={modalVisible}
        room={selectedRoom}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchData();
          Alert.alert(
            'Thành công 🎉', 
            'Đơn đặt phòng của bạn đã được tạo thành công!'
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 4, 
    backgroundColor: '#FFFFFF' 
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },
});