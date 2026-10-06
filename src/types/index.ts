export interface Building {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Room {
  id: string;
  room_code: string;        // Ví dụ: A.101
  building_id: string;
  floor: number;
  capacity: number;
  type: 'THEORY' | 'LAB' | 'HALL' | 'SPORT';
  status: 'AVAILABLE' | 'MAINTENANCE' | 'RESERVED';
  equipments: string[];
  description?: string;
  image_url?: string;
  buildings?: Building;      // Trả về từ Supabase Join Query
}

export interface RoomFilterState {
  searchQuery: string;
  building: string | null;      // 'Tòa K', 'Tòa B', ...
  roomType: string | null;      // 'Máy tính (Lab)', 'Lý thuyết', ...
  minCapacity: number | null;   // 30, 50, 100
  hasProjector: boolean;
  hasAirConditioner: boolean;
}