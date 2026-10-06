# BÁO CÁO KỸ THUẬT MINI-PROJECT
**Môn học:** Cross-Platform Mobile App Development (VKU)  
**Tên Mini-Project:** Mini-Project 2 — VKU Room Booking  
**Nhóm / Sinh viên:** Lê Anh Tú  
**Ngày nộp:** 06/10/2026

---

## 1. THÔNG TIN CHUNG VÀ LIÊN KẾT SẢN PHẨM

* **Thành viên nhóm:**
  1. Lê Anh Tú — MSSV: 23IT.B238 — Vai trò: Sinh Viên — Đóng góp: [100%]
* **🔗 Bản demo:** [Bổ sung URL demo hoặc liên kết tải APK nếu có]
* **💻 GitHub Repository:** [Bổ sung URL repository]
* **🎥 Video demo (không bắt buộc):** [Bổ sung URL video nếu có]

> Các thông tin trong ngoặc vuông cần được nhóm cập nhật trước khi nộp. Workspace hiện không cung cấp thông tin thành viên, liên kết demo hoặc repository công khai.

---

## 2. DANH SÁCH KIỂM TRA TÍNH NĂNG

| # | Tính năng | Trạng thái | Chi tiết triển khai và mức độ nghiệm thu |
|:---:|---|:---:|---|
| 1 | Đăng ký, đăng nhập và khôi phục mật khẩu | ✅ Đã triển khai | Dùng Supabase Auth với email VKU (`@vku.udn.vn`) và mật khẩu. Có kiểm tra đầu vào, đăng ký thông tin họ tên/mã sinh viên và gửi email đặt lại mật khẩu. |
| 2 | Duyệt và tìm phòng | ✅ Đã triển khai | Tải danh sách phòng và thông tin tòa nhà từ Supabase; hỗ trợ tìm kiếm, lọc khu/tòa, sức chứa, máy chiếu, điều hòa, ngày và khung tiết. |
| 3 | Hiển thị phòng theo kích thước thiết bị | ✅ Đã triển khai | Dùng kích thước cửa sổ để bố trí một, hai hoặc ba cột; danh sách dùng `FlatList` và hỗ trợ kéo để tải lại. |
| 4 | Gửi yêu cầu đặt phòng | ✅ Đã triển khai | Chọn ngày, tiết bắt đầu/kết thúc và mục đích; kiểm tra ngày Chủ Nhật, giới hạn tiết 1–10, lịch trùng của người dùng và lịch trùng của phòng trước khi ghi vào Supabase. |
| 5 | Xem và hủy lịch đặt | ✅ Đã triển khai | Hiển thị lịch sử, phòng, ngày, tiết, mục đích và trạng thái; có xác nhận hủy cho lịch `PENDING`, kéo để làm mới danh sách. |
| 6 | Hồ sơ và đăng xuất | ✅ Đã triển khai | Tải hồ sơ người dùng từ Supabase, hiển thị vai trò và thông tin email/mã sinh viên; có xác nhận trước khi đăng xuất. |
| 7 | Lưu trữ ngoại tuyến và đồng bộ nền | ⏳ Chưa triển khai | Zustand lưu trạng thái bộ lọc trong phiên chạy; chưa thấy cơ chế lưu bộ lọc ngoại tuyến hoặc hàng đợi đồng bộ khi mất mạng. Supabase Auth dùng AsyncStorage để lưu phiên đăng nhập. |

**Lưu ý nghiệm thu:** mã hiện tại gửi bản ghi đặt phòng với trạng thái `APPROVED` ngay khi tạo, trong khi giao diện lịch sử cũng hỗ trợ `PENDING`. Nhóm cần xác nhận trạng thái này đúng với quy trình duyệt của dự án trước khi chốt nghiệp vụ.

---

## 3. KIẾN TRÚC KỸ THUẬT VÀ CẤU TRÚC DỰ ÁN

### Công nghệ

* **Ứng dụng:** React Native và Expo SDK 57, viết bằng TypeScript.
* **Điều hướng:** React Navigation với bottom tabs.
* **Backend và xác thực:** Supabase Auth và Supabase Database.
* **Lưu phiên:** AsyncStorage thông qua cấu hình Supabase Auth.
* **State giao diện lọc:** Zustand; state hiện được giữ trong bộ nhớ trong thời gian ứng dụng chạy.
* **Thành phần giao diện:** React Native, `react-native-safe-area-context`, `@react-native-community/datetimepicker`, `lucide-react-native`.

### Luồng ứng dụng

`App.tsx` khởi tạo việc đọc phiên Supabase và đăng ký listener thay đổi trạng thái xác thực. Khi chưa có phiên, ứng dụng hiển thị màn hình xác thực; khi đã đăng nhập, ứng dụng hiển thị `TabNavigator` gồm các tab tìm phòng, lịch đặt và hồ sơ.

Màn hình tìm phòng lấy danh sách phòng cùng dữ liệu đặt chỗ theo ngày từ Supabase. Zustand cung cấp các tiêu chí lọc cho màn hình. Khi người dùng chọn phòng, `BookingModal` kiểm tra dữ liệu đầu vào và lịch trùng rồi ghi yêu cầu đặt vào bảng `bookings`. Các màn hình lịch sử và hồ sơ tiếp tục truy vấn dữ liệu theo người dùng hiện tại.

### Cấu trúc chính

```text
App.tsx
src/
  components/       Thành phần dùng chung, bộ lọc và biểu mẫu đặt phòng
  config/           Khởi tạo Supabase client và cấu hình xác thực
  hooks/            Hook bố cục theo kích thước màn hình
  navigation/       Điều hướng bottom tabs
  screens/          Xác thực, tìm phòng, lịch đặt và hồ sơ
  store/            Trạng thái bộ lọc bằng Zustand
  types/            Kiểu dữ liệu TypeScript cho phòng và tòa nhà
```

### Xử lý lỗi và dữ liệu

Các thao tác xác thực/đặt phòng có xử lý lỗi và thông báo bằng `Alert`; một số lỗi tải danh sách được ghi vào console. Phiên xác thực được lưu cục bộ bằng AsyncStorage. Dữ liệu phòng, hồ sơ và lịch đặt được lấy từ Supabase; dự án chưa thể hiện cơ chế hoạt động đầy đủ khi không có kết nối mạng.

---

## 4. MINH CHỨNG THỰC TẾ VÀ ẢNH CHỤP MÀN HÌNH

> Chưa có ảnh chụp từ emulator hoặc thiết bị trong workspace. Chèn ảnh thực tế sau khi chạy ứng dụng; không dùng ảnh thiết kế thay cho minh chứng chạy thật.

1. **Màn hình đăng nhập / đăng ký:** [Chèn ảnh tại đây]
2. **Màn hình tìm phòng và bộ lọc:** [Chèn ảnh tại đây]
3. **Biểu mẫu đặt phòng:** [Chèn ảnh tại đây]
4. **Lịch sử đặt phòng hoặc hồ sơ:** [Chèn ảnh tại đây]

---

## 5. THÁCH THỨC KỸ THUẬT VÀ CÁCH GIẢI QUYẾT

### 5.1. Tránh đặt trùng lịch phòng hoặc trùng lịch cá nhân

Lịch phòng phụ thuộc vào ngày và khoảng tiết, nên chỉ kiểm tra phòng còn tồn tại là chưa đủ. Luồng đặt phòng hiện kiểm tra các lịch `PENDING`/`APPROVED` trong cùng ngày, sau đó so sánh khoảng tiết với lịch của người dùng và của phòng. Nếu thao tác ghi nhận trả về lỗi xung đột được nhận diện, ứng dụng thông báo để người dùng chọn phòng hoặc khung giờ khác. Cần kiểm thử thêm trường hợp hai người gửi yêu cầu đồng thời và xác nhận cơ sở dữ liệu có ràng buộc phù hợp.

### 5.2. Tổ chức dữ liệu và giao diện trên nhiều kích thước màn hình

Danh sách phòng cần giữ khả năng sử dụng trên cả điện thoại và màn hình rộng. Hook `useResponsiveLayout` dựa trên kích thước cửa sổ để chọn số cột và chiều rộng thẻ; `FlatList` đảm nhiệm hiển thị danh sách và hỗ trợ làm mới. Cần nghiệm thu trực tiếp trên các kích thước điện thoại và tablet mục tiêu.

---

**Việc cần hoàn tất trước khi nộp:** điền thông tin thành viên/ngày nộp/liên kết sản phẩm, chèn ảnh chụp thật, và xác nhận trạng thái nghiệp vụ của bản ghi đặt phòng mới.
