import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react-native';
import { supabase } from '../config/supabase';

interface BookingItem {
  id: string;
  booking_date: string;
  start_slot: number;
  end_slot: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rooms: {
    room_code: string;
    buildings: { name: string; code: string };
  };
}

export const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      // Lấy id người dùng hiện tại
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Truy vấn danh sách đặt phòng của chính người dùng đó
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, start_slot, end_slot, purpose, status,
          rooms ( room_code, buildings ( name, code ) )
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as unknown as BookingItem[]) || []);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách đặt phòng:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyBookings();
    setRefreshing(false);
  };

  // Hủy lịch đặt phòng (SỬA LỖI TẠI ĐÂY)
  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy yêu cầu đặt phòng này?',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Đồng ý hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // 1. Cập nhật trạng thái trong Supabase
              const { error } = await supabase
                .from('bookings')
                .update({ status: 'CANCELLED' })
                .eq('id', bookingId);

              if (error) throw error;

              Alert.alert('Thành công', 'Đã hủy yêu cầu đặt phòng!');
              
              // 2. Gọi ĐÚNG tên hàm tải lại dữ liệu
              await fetchMyBookings();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy yêu cầu');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <View style={[styles.badge, styles.approvedBadge]}><Text style={[styles.badgeText, styles.approvedText]}>ĐÃ DUYỆT</Text></View>;
      case 'REJECTED':
        return <View style={[styles.badge, styles.rejectedBadge]}><Text style={[styles.badgeText, styles.rejectedText]}>TỪ CHỐI</Text></View>;
      case 'CANCELLED':
        return <View style={[styles.badge, styles.cancelledBadge]}><Text style={[styles.badgeText, styles.cancelledText]}>ĐÃ HỦY</Text></View>;
      default:
        return <View style={[styles.badge, styles.pendingBadge]}><Text style={[styles.badgeText, styles.pendingText]}>ĐỢI DUYỆT</Text></View>;
    }
  };

  const renderBookingItem = ({ item }: { item: BookingItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomCode}>{item.rooms?.room_code || 'Phòng học'}</Text>
          <Text style={styles.buildingName}>{item.rooms?.buildings?.name || 'Giảng đường VKU'}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Calendar size={16} color="#64748B" />
        <Text style={styles.infoText}>Ngày: {item.booking_date}</Text>
      </View>

      <View style={styles.infoRow}>
        <Clock size={16} color="#64748B" />
        <Text style={styles.infoText}>Tiết học: Tiết {item.start_slot} - {item.end_slot}</Text>
      </View>

      <View style={styles.infoRow}>
        <MapPin size={16} color="#64748B" />
        <Text style={styles.infoText}>Mục đích: {item.purpose}</Text>
      </View>

      {/* Chỉ hiển thị nút Hủy khi ở trạng thái PENDING */}
      {item.status === 'PENDING' && (
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={() => handleCancelBooking(item.id)} // Đã sửa: Truyền đúng 1 tham số
        >
          <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.cancelBtnText}>Hủy yêu cầu này</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử Đặt phòng</Text>
        <Text style={styles.subtitle}>Danh sách các phòng học bạn đã đăng ký</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bạn chưa có lịch đặt phòng nào.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomInfo: { flex: 1 },
  roomCode: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  buildingName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  pendingText: { color: '#D97706' },
  approvedBadge: { backgroundColor: '#DCFCE7' },
  approvedText: { color: '#16A34A' },
  rejectedBadge: { backgroundColor: '#FEE2E2' },
  rejectedText: { color: '#DC2626' },
  cancelledBadge: { backgroundColor: '#F1F5F9' },
  cancelledText: { color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#334155', marginLeft: 8 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94A3B8', fontSize: 14 },
});