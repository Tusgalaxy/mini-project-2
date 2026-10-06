import React, { useState } from 'react';
import { 
  Modal, View, Text, TouchableOpacity, StyleSheet, 
  TextInput, Alert, ActivityIndicator, ScrollView, Platform 
} from 'react-native';
import { X, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../config/supabase';
import { Room } from '../types';

interface BookingModalProps {
  visible: boolean;
  room: Room | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal = ({ visible, room, onClose, onSuccess }: BookingModalProps) => {
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sử dụng state dạng chuỗi (string) để cho phép xóa trống khi gõ
  const [startSlotStr, setStartSlotStr] = useState('1');
  const [endSlotStr, setEndSlotStr] = useState('3');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const bookingDate = formatDateString(selectedDateObj);

  const handleBooking = async () => {
    const startSlot = parseInt(startSlotStr, 10);
    const endSlot = parseInt(endSlotStr, 10);

    // 1. Kiểm tra ngày đặt (Thứ 2 đến Thứ 7)
    const dayOfWeek = selectedDateObj.getDay(); // 0 là Chủ Nhật
    if (dayOfWeek === 0) {
      Alert.alert('Không thể đặt phòng', 'VKU chỉ mở cửa cho phép đặt phòng từ Thứ 2 đến Thứ 7!');
      return;
    }

    // 2. Kiểm tra tiết học hợp lệ (Tiết 1 đến Tiết 10)
    if (
      isNaN(startSlot) || 
      isNaN(endSlot) || 
      startSlot < 1 || 
      endSlot > 10 || 
      startSlot > endSlot
    ) {
      Alert.alert(
        'Lỗi tiết học', 
        'Vui lòng nhập tiết học hợp lệ từ Tiết 1 đến Tiết 10 (Tiết bắt đầu phải <= Tiết kết thúc)!'
      );
      return;
    }

    if (!purpose.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do sử dụng phòng!');
      return;
    }

    setLoading(true);

    try {
      // 3. Lấy thông tin User
      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập lại để thực hiện đặt phòng!');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 4.1. KIỂM TRA TRÙNG LỊCH CÁ NHÂN
      const { data: userBookings, error: userCheckError } = await supabase
        .from('bookings')
        .select('*, rooms(room_code)')
        .eq('user_id', userId)
        .eq('booking_date', bookingDate)
        .in('status', ['APPROVED', 'PENDING']);

      if (userCheckError) throw userCheckError;

      const isUserConflicted = userBookings?.some(
        (b) => startSlot <= b.end_slot && endSlot >= b.start_slot
      );

      if (isUserConflicted) {
        const conflictedBooking = userBookings?.find(
          (b) => startSlot <= b.end_slot && endSlot >= b.start_slot
        );
        const bookedRoomCode = conflictedBooking?.rooms?.room_code || 'khác';

        Alert.alert(
          'Không thể đặt trùng lịch ⚠️',
          `Bạn đã có một lịch đặt tại phòng ${bookedRoomCode} trong khoảng tiết ${conflictedBooking?.start_slot} - ${conflictedBooking?.end_slot} ngày ${bookingDate}. Mỗi người không thể đặt 2 phòng cùng thời gian!`
        );
        setLoading(false);
        return;
      }

      // 4.2. KIỂM TRA TRÙNG LỊCH PHÒNG
      const { data: roomBookings, error: roomCheckError } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', room.id)
        .eq('booking_date', bookingDate)
        .in('status', ['APPROVED', 'PENDING']);

      if (roomCheckError) throw roomCheckError;

      const isRoomConflicted = roomBookings?.some(
        (b) => startSlot <= b.end_slot && endSlot >= b.start_slot
      );

      if (isRoomConflicted) {
        Alert.alert(
          'Phòng đã bị đặt trùng ⚠️',
          `Phòng ${room.room_code} đã có người đăng ký trùng vào khoảng tiết ${startSlot} - ${endSlot} ngày ${bookingDate}. Vui lòng chọn tiết hoặc phòng khác!`
        );
        setLoading(false);
        return;
      }

      // 5. Gửi yêu cầu Đặt phòng
      const { error: insertError } = await supabase.from('bookings').insert([
        {
          room_id: room.id,
          user_id: userId,
          booking_date: bookingDate,
          start_slot: startSlot,
          end_slot: endSlot,
          purpose: purpose.trim(),
          status: 'APPROVED',
        },
      ]);

      if (insertError) {
        if (
          insertError.message?.includes('KHONG_THONG_QUA') || 
          insertError.code === 'P0001' || 
          insertError.code === '23505'
        ) {
          Alert.alert(
            'Không thể đặt phòng!',
            `Rất tiếc! Vừa có người khác nhanh tay đăng ký phòng ${room.room_code} trong khung tiết này. Vui lòng chọn tiết hoặc phòng khác!`
          );
          setLoading(false);
          return;
        }
        throw insertError;
      }

      setPurpose('');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi đặt phòng', err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Đặt phòng {room.room_code}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* Chọn Ngày */}
            <Text style={styles.label}>📅 Chọn ngày sử dụng:</Text>
            <TouchableOpacity 
              style={styles.inputBox} 
              onPress={() => setShowDatePicker(true)}
            >
              <CalendarIcon size={18} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.dateText}>{bookingDate}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setSelectedDateObj(date);
                }}
              />
            )}

            {/* Chọn Tiết học VKU */}
            <Text style={styles.label}>⏰ Chọn tiết học (1 - 10):</Text>
            <View style={styles.slotContainer}>
              <View style={styles.slotBox}>
                <Text style={styles.subLabel}>Từ tiết:</Text>
                <TextInput
                  style={styles.slotInput}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="1"
                  placeholderTextColor="#94A3B8"
                  value={startSlotStr}
                  onChangeText={(val) => setStartSlotStr(val.replace(/[^0-9]/g, ''))}
                />
              </View>

              <Text style={{ alignSelf: 'center', marginTop: 16 }}>đến</Text>

              <View style={styles.slotBox}>
                <Text style={styles.subLabel}>Đến tiết:</Text>
                <TextInput
                  style={styles.slotInput}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="10"
                  placeholderTextColor="#94A3B8"
                  value={endSlotStr}
                  onChangeText={(val) => setEndSlotStr(val.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* Khung giờ quy định VKU */}
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>• Phạm vi đặt: Thứ 2 đến Thứ 7</Text>
              <Text style={styles.hintText}>• Ca sáng: Tiết 1 - 5 (7:00 - 11:30)</Text>
              <Text style={styles.hintText}>• Ca chiều: Tiết 6 - 10 (12:30 - 17:00)</Text>
            </View>

            {/* Lý do */}
            <Text style={styles.label}>📝 Lý do sử dụng phòng:</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="VD: Học nhóm môn Lập trình di động, Ôn thi..."
              multiline
              numberOfLines={3}
              value={purpose}
              onChangeText={setPurpose}
            />
          </ScrollView>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabledBtn]} 
            onPress={handleBooking} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Xác nhận Đặt phòng ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  body: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 12, marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  dateText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  textInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  slotContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  slotBox: { flex: 1 },
  subLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  slotInput: { backgroundColor: '#F1F5F9', borderRadius: 8, height: 44, textAlign: 'center', fontWeight: '700', fontSize: 16, color: '#0F172A' },
  hintBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  hintText: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  textArea: { backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  disabledBtn: { backgroundColor: '#93C5FD' },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});