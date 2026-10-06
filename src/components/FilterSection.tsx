import React, { useState } from 'react';
import { 
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Platform 
} from 'react-native';
import { Search, RotateCcw, X, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFilterStore } from '../store/useFilterStore';

const ZONE_BUILDINGS_MAP: Record<string, string[]> = {
  'K': ['Hành chính', 'Tòa A', 'Tòa B', 'Tòa C', 'Tòa D', 'Tòa E'],
  'V': ['Tòa A', 'Tòa B', 'Tòa C'],
};

const CAPACITIES = [
  { label: '≥ 30 chỗ', value: 30 },
  { label: '≥ 50 chỗ', value: 50 },
  { label: '≥ 100 chỗ', value: 100 },
];

export const FilterSection = () => {
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const zone = useFilterStore((s) => s.zone);
  const building = useFilterStore((s) => s.building);
  const minCapacity = useFilterStore((s) => s.minCapacity);
  const hasProjector = useFilterStore((s) => s.hasProjector);
  const hasAirConditioner = useFilterStore((s) => s.hasAirConditioner);
  
  const selectedDate = useFilterStore((s) => s.selectedDate);
  const filterSlotStart = useFilterStore((s) => s.filterSlotStart);
  const filterSlotEnd = useFilterStore((s) => s.filterSlotEnd);

  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);
  const setZone = useFilterStore((s) => s.setZone);
  const setBuilding = useFilterStore((s) => s.setBuilding);
  const setMinCapacity = useFilterStore((s) => s.setMinCapacity);
  const toggleProjector = useFilterStore((s) => s.toggleProjector);
  const toggleAirConditioner = useFilterStore((s) => s.toggleAirConditioner);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const setSelectedDate = useFilterStore((s) => s.setSelectedDate);
  const setFilterSlots = useFilterStore((s) => s.setFilterSlots);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateObj = selectedDate ? new Date(selectedDate) : new Date();

  const isFiltered = Boolean(
    zone || building || minCapacity || hasProjector || 
    hasAirConditioner || searchQuery || filterSlotStart || filterSlotEnd
  );

  const availableBuildings = zone ? ZONE_BUILDINGS_MAP[zone] : [];

  // Xử lý thay đổi khoảng tiết học (Cho phép rỗng khi xóa)
  const handleSlotChange = (startStr: string, endStr: string) => {
    const cleanStart = startStr.replace(/[^0-9]/g, '');
    const cleanEnd = endStr.replace(/[^0-9]/g, '');

    const s = cleanStart === '' ? null : parseInt(cleanStart, 10);
    const e = cleanEnd === '' ? null : parseInt(cleanEnd, 10);

    setFilterSlots(s, e);
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên/mã phòng (vd: V.A101, K.B201)..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dòng Lọc Thời Gian: Chọn Ngày & Chọn Khung Tiết */}
      <View style={styles.dateTimeFilterContainer}>
        <TouchableOpacity 
          style={styles.datePickerBtn} 
          onPress={() => setShowDatePicker(true)}
        >
          <CalendarIcon size={16} color="#2563EB" />
          <Text style={styles.datePickerText}>{selectedDate || formatDateString(new Date())}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedDate(formatDateString(date));
              }
            }}
          />
        )}

        {/* Khung nhập Tiết Lọc (1 - 10) */}
        <View style={styles.slotFilterBox}>
          <Clock size={16} color="#64748B" />
          <Text style={styles.slotLabel}>Tiết:</Text>
          <TextInput
            style={styles.slotInput}
            placeholder="1"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={2}
            value={filterSlotStart !== null && filterSlotStart !== undefined ? String(filterSlotStart) : ''}
            onChangeText={(val) => 
              handleSlotChange(val, filterSlotEnd !== null && filterSlotEnd !== undefined ? String(filterSlotEnd) : '')
            }
          />
          <Text style={styles.slotDash}>-</Text>
          <TextInput
            style={styles.slotInput}
            placeholder="10"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={2}
            value={filterSlotEnd !== null && filterSlotEnd !== undefined ? String(filterSlotEnd) : ''}
            onChangeText={(val) => 
              handleSlotChange(filterSlotStart !== null && filterSlotStart !== undefined ? String(filterSlotStart) : '', val)
            }
          />
        </View>
      </View>

      {/* Dòng 1: Chọn Khu & Tiện ích chung */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
        {isFiltered && (
          <TouchableOpacity style={[styles.chip, styles.resetChip]} onPress={resetFilters}>
            <RotateCcw size={14} color="#EF4444" />
            <Text style={styles.resetChipText}>Xóa lọc</Text>
          </TouchableOpacity>
        )}

        {['K', 'V'].map((z) => (
          <TouchableOpacity
            key={z}
            style={[styles.chip, zone === z && styles.activeChip]}
            onPress={() => setZone(z)}
          >
            <Text style={[styles.chipText, zone === z && styles.activeChipText]}>
              Khu {z}
            </Text>
          </TouchableOpacity>
        ))}

        {CAPACITIES.map((cap) => (
          <TouchableOpacity
            key={cap.value}
            style={[styles.chip, minCapacity === cap.value && styles.activeChip]}
            onPress={() => setMinCapacity(cap.value)}
          >
            <Text style={[styles.chipText, minCapacity === cap.value && styles.activeChipText]}>
              {cap.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.chip, hasProjector && styles.activeChip]} onPress={toggleProjector}>
          <Text style={[styles.chipText, hasProjector && styles.activeChipText]}>📹 Máy chiếu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.chip, hasAirConditioner && styles.activeChip]} onPress={toggleAirConditioner}>
          <Text style={[styles.chipText, hasAirConditioner && styles.activeChipText]}>❄️ Điều hòa</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dòng 2: Chọn Tòa nhà (Chỉ hiện khi đã chọn Khu) */}
      {zone && (
        <View style={styles.subFilterContainer}>
          <Text style={styles.subFilterTitle}>Tòa thuộc Khu {zone}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subChipList}>
            {availableBuildings.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.subChip, building === b && styles.activeSubChip]}
                onPress={() => setBuilding(b)}
              >
                <Text style={[styles.subChipText, building === b && styles.activeSubChipText]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10, backgroundColor: '#FFFFFF' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },

  dateTimeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  datePickerText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  slotFilterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  slotLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  slotInput: {
    width: 32,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 0,
  },
  slotDash: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  chipList: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChip: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  resetChip: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  activeChipText: { color: '#2563EB', fontWeight: '600' },
  resetChipText: { color: '#EF4444', fontWeight: '600', marginLeft: 4 },

  subFilterContainer: { marginTop: 10, paddingHorizontal: 16 },
  subFilterTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  subChipList: { gap: 6 },
  subChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeSubChip: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  subChipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  activeSubChipText: { color: '#FFFFFF', fontWeight: '600' },
});