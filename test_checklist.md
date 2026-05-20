# Kịch Bản & Checklist Kiểm Thử (Test Scenarios & Checklists)

Tài liệu này cung cấp các kịch bản kiểm thử (Test Scenarios) chi tiết và danh sách kiểm tra (Checklist) toàn diện cho Hệ Thống Điều Phối Cứu Hộ và Quản Lý Cứu Trợ Lũ Lụt, đặc biệt tập trung vào các tính năng mới: WebSocket Real-time, Upload ảnh minh chứng, và Rate Limiting.

---

## 1. Kịch Bản Kiểm Thử Cốt Lõi (Core Test Scenarios)

### Kịch Bản 1: Quy trình cứu hộ End-to-End (Từ khi kêu cứu đến khi nhận hàng)
**Mục tiêu**: Đảm bảo luồng xử lý SOS hoạt động thông suốt qua 3 vai trò (Citizen, Coordinator, Rescuer) kết hợp WebSocket.
**Các bước**:
1. **[Citizen]** Đăng nhập. Gửi yêu cầu SOS (10 người, có ảnh, vị trí A). 
2. **[Coordinator]** Đang mở tab Bản đồ/Danh sách SOS. Thấy SOS mới xuất hiện ngay lập tức (không cần F5) nhờ WebSocket.
3. **[Coordinator]** Bấm "Xác minh" ca SOS. Chuyển trạng thái sang `VERIFIED`.
4. **[Coordinator]** Bấm "Điều phối đội". Hệ thống hiện danh sách đội cứu hộ (Redis Geo). Chọn Đội X (Rescuer đang login ở tab khác).
5. **[Rescuer]** Nhận được thông báo đẩy WebSocket "Nhiệm vụ mới".
6. **[Rescuer]** Cập nhật trạng thái thành `IN_PROGRESS` (Đang di chuyển).
7. **[Citizen]** Màn hình Citizen tự động cập nhật trạng thái `IN_PROGRESS`.
8. **[Rescuer]** Đến nơi, bấm hoàn thành. Form yêu cầu upload ảnh minh chứng xuất hiện.
9. **[Rescuer]** Chọn 1-5 ảnh từ máy, bấm xác nhận tải lên. Trạng thái chuyển thành `COMPLETED`.
10. **[Citizen]** Thấy trạng thái `COMPLETED` và ảnh minh chứng. Bấm nút "Đã nhận cứu trợ".
11. **[Coordinator]** Ca SOS chuyển thành `RELIEF_RECEIVED` và khép lại vòng đời.

### Kịch Bản 2: Kiểm thử chống Spam SOS (Rate Limiting với Bucket4j)
**Mục tiêu**: Đảm bảo hệ thống không bị sập khi có luồng tấn công DDoS hoặc spam gửi yêu cầu SOS.
**Các bước**:
1. **[Citizen]** Viết 1 script hoặc bấm nút gửi SOS liên tục > 5 lần trong vòng 1 phút.
2. **[Hệ thống]** Ở lần gửi thứ 6, API trả về lỗi `429 Too Many Requests`.
3. **[Frontend]** Hiển thị thông báo thân thiện: "Bạn đang thao tác quá nhanh. Vui lòng chờ 1 phút...".
4. **[Hệ thống]** Chờ qua 1 phút, gửi lại SOS. Yêu cầu được chấp nhận bình thường (Mã 201).

### Kịch Bản 3: Tính năng Bản đồ Tác Chiến và Live Location (WebSocket + Redis Geo)
**Mục tiêu**: Xác minh tọa độ đội cứu hộ được broadcast liên tục cho trung tâm chỉ huy.
**Các bước**:
1. **[Rescuer]** Đang làm nhiệm vụ. Ứng dụng tự động gửi tọa độ mới mỗi 30s.
2. **[Coordinator]** Mở tab Bản đồ (MapPage). 
3. **[Hệ thống]** Mỗi khi Rescuer cập nhật tọa độ, icon xe của Rescuer trên bản đồ Coordinator tự động dịch chuyển trơn tru đến tọa độ mới (thông qua kênh `/topic/map-refresh`).
4. **[Citizen]** Nhìn thấy khoảng cách từ đội cứu hộ đến vị trí của mình bị thu hẹp dần.

---

## 2. Checklist Kiểm Thử Chi Tiết

### 2.1. Phân Hệ Xác Thực & Phân Quyền (Auth & RBAC)
- [ ] Đăng nhập đúng username/password trả về JWT Token và Refresh Token.
- [ ] Mật khẩu mã hóa (BCrypt) không bị lộ ở API response.
- [ ] Đăng xuất thành công. Token cũ bị đưa vào Blacklist (Redis).
- [ ] Dùng Token đã Blacklist gửi API sẽ nhận lỗi `401 Unauthorized`.
- [ ] Tài khoản bị khóa (Locked) không thể đăng nhập.
- [ ] Truy cập API trái phép (Citizen gọi API của Admin) trả về lỗi `403 Forbidden`.
- [ ] Refresh token hoạt động, cấp lại Access token mới khi Access token cũ hết hạn (15 phút).

### 2.2. Phân Hệ Người Dân (Citizen)
- [ ] Gửi SOS lấy được tọa độ GPS chính xác của thiết bị (Xin quyền Location).
- [ ] Giao diện SOS đỏ, chữ rõ ràng dễ thao tác trên màn hình điện thoại (Responsive).
- [ ] (Rate Limit) Bấm gửi SOS liên tục bị chặn (Lỗi 429).
- [ ] (Cập nhật vị trí) Kéo thả ghim trên bản đồ để sửa tọa độ gửi về hệ thống thành công.
- [ ] Hủy yêu cầu SOS (chỉ được hủy khi trạng thái là `PENDING` hoặc `VERIFIED`).
- [ ] Có nút "Đã nhận cứu trợ" khi trạng thái là `COMPLETED` hoặc `IN_PROGRESS`.
- [ ] Xem danh sách các SOS đã gửi và trạng thái realtime.

### 2.3. Phân Hệ Điều Phối Viên (Coordinator)
- [ ] Xem danh sách toàn bộ SOS trên Dashboard.
- [ ] (WebSocket) Danh sách SOS tự động xuất hiện dòng mới khi có người dân gửi, không cần F5.
- [ ] Nút **Xác minh (Verify)**: Chuyển SOS thành `VERIFIED`, có thể thêm ghi chú.
- [ ] Nút **Từ chối (Reject)**: Đóng ca SOS giả mạo.
- [ ] (Redis Geo) Khi bấm "Điều phối", API `/nearby-teams` trả về đúng các đội `ACTIVE` có khoảng cách tăng dần, có thông số mét/km rõ ràng.
- [ ] Cập nhật mức độ khẩn cấp (CRITICAL, HIGH, MEDIUM, LOW) thành công.
- [ ] (Bản đồ) Hiển thị ghim Đỏ (SOS), ghim Xanh Lá (Shelter), ghim Xanh Dương (Team). Các ghim hiển thị đúng tọa độ.
- [ ] Tạo mới, sửa thông tin, xóa Điểm trú ẩn (Shelter).
- [ ] Quản lý đội cứu hộ: Tạo đội, đổi trưởng đội, đổi trạng thái (`ACTIVE`, `INACTIVE`).
- [ ] Cấp phát xe (Vehicle) cho một đội cứu hộ cụ thể thành công.
- [ ] Phát cảnh báo thiên tai (Flood Alert), tất cả các user khác nhận được thông báo.

### 2.4. Phân Hệ Đội Cứu Hộ (Rescuer)
- [ ] Xem danh sách các SOS đã được Sở chỉ huy giao cho đội của mình.
- [ ] Bấm xác nhận tiếp nhận nhiệm vụ -> Trạng thái thành `IN_PROGRESS`.
- [ ] Giao diện định vị: Vẽ đường từ vị trí Đội đến Nạn nhân (Nếu có Leaflet Routing).
- [ ] **Tính năng Upload ảnh minh chứng**: 
  - [ ] Ở trạng thái `COMPLETED`, ấn Hoàn thành xuất hiện Modal Upload.
  - [ ] Giao diện drag-drop hoặc click chọn file.
  - [ ] Hiển thị grid preview ảnh (tối đa 5 ảnh).
  - [ ] Có icon xóa ảnh đã chọn ở preview.
  - [ ] Bấm xác nhận -> hiện vòng quay Spinner "Đang tải ảnh...".
  - [ ] Tải lên API `/api/uploads/images` thành công, lấy được chuỗi URL.
  - [ ] Yêu cầu được cập nhật trạng thái `COMPLETED` kèm field `proofImageUrl`.
- [ ] API cập nhật vị trí Đội (`PATCH /api/rescue-teams/{id}/location`) hoạt động ổn định.

### 2.5. Phân Hệ Hậu Cần & Logistics
- [ ] Quản lý danh sách hàng hóa trong kho (Thêm, Sửa, Xóa).
- [ ] API Cảnh báo tồn kho (`/low-stock`) hoạt động đúng định mức cấu hình (ví dụ < 10 thùng).
- [ ] Chức năng Phân phối (Distribution): Tạo phiếu xuất kho, số lượng trong kho bị trừ đi chính xác (Có khóa Lock Transaction nếu 2 người xuất cùng lúc).
- [ ] Dashboard Hậu cần hiển thị biểu đồ tròn/bar chuẩn xác.

### 2.6. Thử Nghiệm Kỹ Thuật (System & Non-Functional Testing)
- [ ] **Tràn bộ nhớ Cache**: Thêm 1 Shelter mới, kiểm tra Cache đã được xóa tự động chưa (Eviction) bằng cách fetch lại list.
- [ ] **Upload File Lớn**: Thử upload ảnh minh chứng > 5MB, đảm bảo Spring Boot không bị crash (có cấu hình max-file-size 10MB).
- [ ] **WebSocket Multi-Tab**: Mở 3 tab bằng 3 tài khoản (Citizen, Coordinator, Rescuer). Khi Citizen tạo SOS, *cả 3 tab* đều nhận được bản tin qua console log.
- [ ] **Database Transaction**: Nếu lỗi trong lúc lưu Notification khi assign đội, đảm bảo transaction bị Rollback (Rescue request không bị lưu lửng lơ).
- [ ] **Responsive Design**: Giao diện hiển thị tốt, không vỡ layout trên điện thoại di động (iPhone SE, Pixel) và Tablet (iPad). Tối ưu HSL Theme không chói mắt vào ban đêm.
