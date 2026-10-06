# VKU Room Booking

Ứng dụng di động hỗ trợ sinh viên và giảng viên VKU tra cứu phòng học, kiểm tra lịch trống và đăng ký sử dụng phòng. Ứng dụng được xây dựng bằng React Native/Expo, TypeScript và Supabase.

## Tính năng

- Đăng ký, đăng nhập bằng email VKU (`@vku.udn.vn`) và khôi phục mật khẩu.
- Tra cứu phòng và thông tin tòa nhà từ Supabase.
- Tìm phòng theo từ khóa, khu, tòa, sức chứa, máy chiếu và điều hòa.
- Chọn ngày và khoảng tiết để lọc phòng không bị trùng lịch.
- Đặt phòng theo ngày, tiết học và mục đích; kiểm tra các lịch trùng trước khi gửi.
- Xem lịch sử đặt phòng, trạng thái và hủy lịch đang `PENDING`.
- Xem hồ sơ và đăng xuất.
- Bố cục danh sách thích ứng với kích thước màn hình; hỗ trợ kéo để làm mới dữ liệu.

> Theo mã hiện tại, đơn đặt mới được ghi với trạng thái `APPROVED`. Cần xác nhận đây có phải quy trình nghiệp vụ mong muốn hay không.

## Công nghệ

- Expo SDK 57
- React Native 0.86 và React 19
- TypeScript
- React Navigation
- Supabase Auth và Supabase Database
- Zustand cho trạng thái bộ lọc
- AsyncStorage để lưu phiên xác thực
- `react-native-safe-area-context`, `@react-native-community/datetimepicker`, `lucide-react-native`

## Yêu cầu

- Node.js và npm
- Tài khoản/dự án Supabase
- Để chạy Android native: Android Studio/Android SDK hoặc thiết bị Android đã bật gỡ lỗi USB
- Để chạy iOS native: macOS và Xcode

## Cài đặt và chạy

```bash
npm install
```

Đặt cấu hình Supabase theo phần bên dưới, sau đó chạy:

```bash
# Khởi động Expo development server
npm run start

# Chạy ứng dụng Android native (cần Android SDK)
npm run android

# Chạy ứng dụng iOS native (cần macOS/Xcode)
npm run ios

# Chạy phiên bản web
npm run web
```

Các lệnh được khai báo trong `package.json`. Lần đầu chạy native có thể cần tạo/cài development build tương thích với thiết bị.

## Cấu hình Supabase

Client được khởi tạo trong `src/config/supabase.ts`. Thay các giá trị `SUPABASE_URL` và `SUPABASE_ANON_KEY` bằng URL dự án và **publishable/anon key** của Supabase.

- Chỉ đưa khóa public/publishable dành cho client vào ứng dụng.
- Không đưa `service_role` key, mật khẩu database hoặc secret của OAuth vào ứng dụng di động hay Git.
- Hiện dự án đọc cấu hình từ hằng số trong mã nguồn; chưa có cấu hình `.env` được thiết lập.

### Cấu trúc dữ liệu được ứng dụng sử dụng

Đảm bảo Supabase có schema, khóa ngoại và quyền truy cập phù hợp với các truy vấn của ứng dụng:

- `buildings`: ít nhất có `id`, `code`, `name`.
- `rooms`: ít nhất có `id`, `room_code`, `building_id`, `floor`, `capacity`, `type`, `status`, `equipments`, `description`, `image_url`; có quan hệ tới `buildings`.
- `profiles`: có `id` gắn với `auth.users.id`, `email`, `full_name`, `student_id`, `role`.
- `bookings`: có `id`, `room_id`, `user_id`, `booking_date`, `start_slot`, `end_slot`, `purpose`, `status`, `created_at`; có quan hệ tới `rooms` và người dùng.

Đây là danh sách các trường ứng dụng tham chiếu, không phải migration SQL đầy đủ. Repository hiện không kèm migration/schema SQL; cần tạo schema và cấu hình **Row Level Security (RLS)** trên Supabase theo chính sách của hệ thống. Không cho phép client đọc hoặc sửa dữ liệu người dùng khác ngoài phạm vi nghiệp vụ đã định.

### Xác thực

Màn hình hiện tại đăng ký/đăng nhập bằng email và mật khẩu qua Supabase Auth, đồng thời giới hạn định dạng email theo miền `@vku.udn.vn`. Nếu bật email confirmation hoặc sử dụng OAuth, cần cấu hình provider và redirect URL tương ứng trong Supabase trước khi kiểm thử luồng đó.

## Cấu trúc thư mục

```text
.
├── App.tsx
├── app.json
├── index.ts
└── src/
    ├── components/
    │   ├── BookingModal.tsx
    │   ├── FilterSection.tsx
    │   └── RoomCard.tsx
    ├── config/
    │   └── supabase.ts
    ├── hooks/
    │   └── useResponsiveLayout.ts
    ├── navigation/
    │   └── TabNavigator.tsx
    ├── screens/
    │   ├── AuthScreen.tsx
    │   ├── BrowseRoomsScreen.tsx
    │   ├── MyBookingsScreen.tsx
    │   └── ProfileScreen.tsx
    ├── store/
    │   └── useFilterStore.ts
    └── types/
        └── index.ts
```

## Luồng đặt phòng

1. Người dùng chọn ngày, khoảng tiết và một phòng còn phù hợp.
2. Ứng dụng kiểm tra ngày đặt (Thứ Hai đến Thứ Bảy), tiết từ 1 đến 10, mục đích sử dụng và phiên đăng nhập.
3. Ứng dụng truy vấn các lịch `PENDING`/`APPROVED` để kiểm tra trùng lịch người dùng và trùng lịch phòng.
4. Nếu không xung đột, ứng dụng tạo bản ghi trong `bookings` và làm mới danh sách.

Kiểm tra ở client giúp phản hồi nhanh nhưng không thay thế các constraint/transaction phía database. Cần bảo vệ tính nhất quán ở Supabase để xử lý đúng trường hợp nhiều người đặt đồng thời.

## Trạng thái và giới hạn đã biết

- Bộ lọc Zustand chỉ được lưu trong state ứng dụng; chưa có persist bộ lọc qua lần khởi động tiếp theo.
- Phiên đăng nhập được lưu bằng AsyncStorage qua Supabase Auth.
- Chưa có hàng đợi đồng bộ nền hoặc chức năng hoạt động ngoại tuyến đầy đủ.
- Danh sách phòng phụ thuộc dữ liệu và quyền truy cập Supabase.
- Giao diện hỗ trợ các trạng thái đặt `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`; việc tạo đơn hiện đặt trạng thái `APPROVED`.
- Chưa có migration SQL hoặc test tự động đi kèm trong repository.

## Kiểm tra mã nguồn

TypeScript:

```bash
npx tsc --noEmit
```

Chưa có script lint hoặc test được khai báo trong `package.json`.

## Đóng góp

1. Tạo branch cho thay đổi.
2. Thực hiện thay đổi và kiểm tra TypeScript.
3. Mở pull request kèm mô tả, ảnh/video nếu có thay đổi giao diện.

## Bản quyền

Chưa có thông tin giấy phép được khai báo trong repository. Hãy bổ sung license nếu dự án cần phát hành hoặc tái sử dụng công khai.
