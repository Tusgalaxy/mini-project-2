import { create } from 'zustand';

// Lấy ngày hiện tại dạng YYYY-MM-DD
const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface FilterState {
  searchQuery: string;
  zone: string | null;
  building: string | null;
  minCapacity: number | null;
  hasProjector: boolean;
  hasAirConditioner: boolean;
  selectedDate: string;
  filterSlotStart: number | null;
  filterSlotEnd: number | null;

  setSearchQuery: (query: string) => void;
  setZone: (zone: string | null) => void;
  setBuilding: (building: string | null) => void;
  setMinCapacity: (cap: number | null) => void;
  toggleProjector: () => void;
  toggleAirConditioner: () => void;
  setSelectedDate: (date: string) => void;
  setFilterSlots: (start: number | null, end: number | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  zone: null,
  building: null,
  minCapacity: null,
  hasProjector: false,
  hasAirConditioner: false,
  selectedDate: getTodayString(),
  filterSlotStart: null,
  filterSlotEnd: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setZone: (zone) =>
    set((state) => ({
      zone: state.zone === zone ? null : zone,
      building: null, // Reset tòa nhà khi đổi khu
    })),
  setBuilding: (building) =>
    set((state) => ({
      building: state.building === building ? null : building,
    })),
  setMinCapacity: (minCapacity) =>
    set((state) => ({
      minCapacity: state.minCapacity === minCapacity ? null : minCapacity,
    })),
  toggleProjector: () => set((state) => ({ hasProjector: !state.hasProjector })),
  toggleAirConditioner: () => set((state) => ({ hasAirConditioner: !state.hasAirConditioner })),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setFilterSlots: (filterSlotStart, filterSlotEnd) => set({ filterSlotStart, filterSlotEnd }),
  resetFilters: () =>
    set({
      searchQuery: '',
      zone: null,
      building: null,
      minCapacity: null,
      hasProjector: false,
      hasAirConditioner: false,
      selectedDate: getTodayString(),
      filterSlotStart: null,
      filterSlotEnd: null,
    }),
}));