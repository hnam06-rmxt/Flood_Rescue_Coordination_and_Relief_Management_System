# Checklist & Kịch bản test — Flood Rescue System

**Dự án:** Phần mềm điều phối cứu hộ và quản lý cứu trợ lũ lụt  
**Phiên bản tài liệu:** 2026-05-20  
**URL:** Frontend `http://localhost:5173` · Backend `http://localhost:8080` · Swagger `http://localhost:8080/swagger-ui.html`

---

## 1. Checklist môi trường (trước khi test)

| # | Hạng mục | Cách kiểm tra | Pass |
|---|----------|---------------|:----:|
| E1 | Java 17+ | `java -version` | ☐ |
| E2 | Node.js 18+ | `node -v` | ☐ |
| E3 | PostgreSQL chạy, DB `flood_rescue_db` | Kết nối được, backend start không lỗi DB | ☐ |
| E4 | Redis cổng `6379` (khuyến nghị) | `docker compose up -d redis` hoặc Redis local | ☐ |
| E5 | PostGIS (tùy chọn) | `psql -U postgres -d flood_rescue_db -f sql/postgis_enable.sql` | ☐ |
| E6 | Backend | `cd server && ./mvnw spring-boot:run` → log `Started` | ☐ |
| E7 | Frontend | `cd client && npm install && npm run dev` | ☐ |
| E8 | Console trình duyệt | Không lỗi `global is not defined` (sockjs) | ☐ |
| E9 | Internet | Cần cho bản đồ OSM + OSRM chỉ đường | ☐ |

**Ghi chú:** Redis tắt → app vẫn chạy (blacklist logout, rate limit, Geo có thể giảm chức năng).

---

## 2. Tài khoản test

| Username | Password | Role | Ghi chú |
|----------|----------|------|---------|
| `admin` | `admin123` | ADMIN | Seed mặc định |
| `demo` | `demo123` | CITIZEN | Seed mặc định |

**Tạo thêm user** (Admin → Quản lý Users) hoặc Đăng ký:

| Role cần test | Gợi ý tạo user |
|---------------|----------------|
| COORDINATOR | Admin tạo user role `COORDINATOR` |
| MANAGER | Admin tạo user role `MANAGER` |
| RESCUER | Admin tạo user role `RESCUER` |

---

## 3. Checklist chức năng theo actor

### 3.1 Citizen (Người dân)

| ID | Chức năng | Pass |
|----|-----------|:----:|
| C1 | Đăng ký tài khoản mới | ☐ |
| C2 | Đăng nhập / đăng xuất | ☐ |
| C3 | Gửi yêu cầu cứu hộ: mô tả, địa chỉ, số người, mức khẩn cấp | ☐ |
| C4 | Lấy GPS / chọn vị trí trên bản đồ khi tạo SOS | ☐ |
| C5 | Đính kèm ảnh (upload Cloudinary) | ☐ |
| C6 | Xem danh sách yêu cầu của mình (`/rescue-requests`) | ☐ |
| C7 | Theo dõi timeline trạng thái (PENDING → … → COMPLETED) | ☐ |
| C8 | Nhận thông báo khi có cập nhật (badge + trang Thông báo) | ☐ |
| C9 | Bật SOS ping vị trí (~30s) | ☐ |
| C10 | Nút **Đã cứu** khi ASSIGNED / IN_PROGRESS | ☐ |
| C11 | Hủy yêu cầu khi PENDING / ASSIGNED | ☐ |
| C12 | **Dẫn đường** → bản đồ focus ca SOS | ☐ |

### 3.2 Rescue Team (Đội cứu hộ)

| ID | Chức năng | Pass |
|----|-----------|:----:|
| R1 | Đăng nhập role RESCUER | ☐ |
| R2 | Xem danh sách yêu cầu cứu hộ | ☐ |
| R3 | Xem chi tiết ca (modal): mô tả, ảnh, vị trí | ☐ |
| R4 | Cập nhật trạng thái: Tiếp nhận (IN_PROGRESS), Hoàn thành | ☐ |
| R5 | Từ chối ca (CANCELLED) | ☐ |
| R6 | Chia sẻ GPS đội (trưởng đội) | ☐ |
| R7 | Mở bản đồ, xem marker ca / đội | ☐ |
| R8 | **Dẫn đường** — lộ trình uốn theo đường (OSRM), không chỉ 1 đường thẳng | ☐ |

### 3.3 Rescue Coordinator (Điều phối viên)

| ID | Chức năng | Pass |
|----|-----------|:----:|
| O1 | Đăng nhập role COORDINATOR | ☐ |
| O2 | Xem tất cả yêu cầu, lọc theo trạng thái / tìm kiếm | ☐ |
| O3 | Đổi mức khẩn cấp (CRITICAL / HIGH / …) | ☐ |
| O4 | **Phân công đội** — modal gọi API `nearby-teams` (Redis Geo) | ☐ |
| O5 | Danh sách gợi ý có khoảng cách (`distanceDisplay`) | ☐ |
| O6 | Sau phân công: status ASSIGNED, thông báo tới đội | ☐ |
| O7 | Quản lý đội cứu hộ (`/teams`) | ☐ |
| O8 | Gán phương tiện cho đội (`/vehicles`) | ☐ |
| O9 | Bản đồ tác chiến: marker SOS, đội, tuyến đội→ca | ☐ |
| O10 | Cảnh báo lũ, điểm an toàn | ☐ |
| O11 | Dashboard / Báo cáo thống kê | ☐ |

### 3.4 Manager (Quản lý nguồn lực)

| ID | Chức năng | Pass |
|----|-----------|:----:|
| M1 | Đăng nhập role MANAGER | ☐ |
| M2 | CRUD phương tiện, đổi trạng thái (AVAILABLE / IN_USE / …) | ☐ |
| M3 | Gán xe cho đội cứu hộ | ☐ |
| M4 | Quản lý kho hàng cứu trợ (thêm/sửa tồn) | ☐ |
| M5 | Ghi nhận phân phối cứu trợ (trừ tồn) | ☐ |
| M6 | Cảnh báo tồn kho thấp | ☐ |
| M7 | Trang Báo cáo / export CSV | ☐ |

### 3.5 Admin (Quản trị)

| ID | Chức năng | Pass |
|----|-----------|:----:|
| A1 | Đăng nhập `admin` / `admin123` | ☐ |
| A2 | Dashboard tổng hợp | ☐ |
| A3 | Quản lý user: tạo / sửa role / khóa | ☐ |
| A4 | Trang Cấu hình (localStorage — lưu ý chưa sync server) | ☐ |
| A5 | Swagger mở được, gọi API có JWT | ☐ |

---

## 4. Checklist tính năng kỹ thuật (README/DESIGN)

| ID | Tính năng | Cách test | Kỳ vọng | Pass |
|----|-----------|-----------|---------|:----:|
| T1 | **WebSocket thông báo** | Đăng nhập 2 tab (coordinator + citizen). Coordinator phân công ca → tab citizen badge tăng **không cần F5** | Cập nhật trong vài giây; Console không lỗi WS | ☐ |
| T2 | **Redis Geo gợi ý đội** | Coordinator mở modal phân công, DevTools → Network: `GET .../nearby-teams` | Status 200, danh sách có `distanceKm` | ☐ |
| T3 | **PostGIS** | Chạy `postgis_enable.sql`, restart backend, tạo ca không có team trong Redis Geo | Log backend: thử PostGIS hoặc Haversine fallback | ☐ |
| T4 | **Rate limiting** | Gửi >120 request/phút cùng user (script hoặc refresh liên tục API) | HTTP **429** + message tiếng Việt | ☐ |
| T5 | **JWT logout blacklist** | Đăng xuất → dùng lại token cũ trên Postman | 401 / không truy cập được (cần Redis) | ☐ |
| T6 | **OSRM chỉ đường** | Map → Dẫn đường từ đội/nạn nhân | Polyline uốn theo đường; card hiện ~km · ~phút | ☐ |
| T7 | **sockjs polyfill** | Mở app, F12 Console | Không `global is not defined` | ☐ |

---

## 5. Kịch bản test end-to-end (E2E)

### Kịch bản 1 — Luồng cứu hộ hoàn chỉnh (Happy path)

**Mục tiêu:** Citizen gửi SOS → Coordinator phân công → Rescuer hoàn thành → Citizen xác nhận.

| Bước | Actor | Thao tác | Kết quả mong đợi |
|:----:|-------|----------|------------------|
| 1 | Citizen (`demo`) | Đăng nhập → Yêu cầu cứu hộ → Tạo ca: mô tả, GPS, ảnh, HIGH | Ca `PENDING`, có trên map |
| 2 | Coordinator | Đăng nhập → Xem ca mới → Đổi urgency `CRITICAL` | Urgency cập nhật |
| 3 | Coordinator | Phân công đội (chọn đội đầu danh sách gợi ý) | `ASSIGNED`, citizen nhận thông báo |
| 4 | Rescuer | Đăng nhập → Mở ca → **Tiếp nhận** | `IN_PROGRESS` |
| 5 | Rescuer | **Dẫn đường** → kiểm tra lộ trình trên map | Đường theo OSRM, có km/phút |
| 6 | Rescuer | Bật chia sẻ GPS (nếu là trưởng đội) | Vị trí đội cập nhật trên map |
| 7 | Rescuer | **Hoàn thành** | `COMPLETED` (hoặc chờ citizen xác nhận) |
| 8 | Citizen | **Đã cứu** / xác nhận | Ca đóng, timeline đủ bước |

**Pass scenario:** ☐

---

### Kịch bản 2 — Thông báo real-time (WebSocket)

| Bước | Thao tác | Kết quả mong đợi |
|:----:|----------|------------------|
| 1 | Tab A: Citizen đăng nhập, mở bất kỳ trang | Badge thông báo = 0 hoặc N |
| 2 | Tab B: Coordinator phân công ca của citizen | — |
| 3 | Tab A: Quan sát badge (không F5) | Badge tăng trong ~5s |
| 4 | Tab A: Vào `/notifications` | Có thông báo phân công mới |
| 5 | F12 → Console | Không lỗi WebSocket / sockjs |

**Pass scenario:** ☐

---

### Kịch bản 3 — Gợi ý đội gần nhất (Redis Geo + API)

**Điều kiện:** Có ≥2 đội `ACTIVE` với latitude/longitude; Redis chạy.

| Bước | Thao tác | Kết quả mong đợi |
|:----:|----------|------------------|
| 1 | Cập nhật GPS các đội (trang Đội cứu hộ / chia sẻ GPS) | Tọa độ trong DB |
| 2 | Tạo ca SOS có GPS rõ ràng | Ca `PENDING` |
| 3 | Coordinator → Phân công → xem modal | Gọi `nearby-teams`, sắp xếp theo khoảng cách |
| 4 | So sánh đội đầu danh sách | Gần vị trí nạn nhân nhất (badge "Gần nhất") |

**Pass scenario:** ☐

---

### Kịch bản 4 — Quản lý cứu trợ & tồn kho

| Bước | Actor | Thao tác | Kết quả mong đợi |
|:----:|-------|----------|------------------|
| 1 | Manager | Thêm hàng cứu trợ, số lượng tồn | Hiển thị trong kho |
| 2 | Manager | Phân phối số lượng > ngưỡng cảnh báo | Tồn giảm, có thể có thông báo low-stock |
| 3 | Manager | Phân phối vượt tồn | Lỗi / từ chối hợp lệ |
| 4 | Manager | Báo cáo → xuất CSV | File tải được |

**Pass scenario:** ☐

---

### Kịch bản 5 — Phân quyền & bảo mật

| Bước | Thao tác | Kết quả mong đợi |
|:----:|----------|------------------|
| 1 | Citizen truy cập `/admin/users` | Redirect / không vào được |
| 2 | Manager truy cập `/teams` (chỉ ADMIN/COORDINATOR) | Không vào menu hoặc 403 |
| 3 | Gọi API không token: `GET /api/rescue-requests` | 401 |
| 4 | Đăng xuất → gọi lại API với access token cũ | 401 (khi Redis + blacklist hoạt động) |

**Pass scenario:** ☐

---

### Kịch bản 6 — Hủy / từ chối ca

| Bước | Actor | Thao tác | Kết quả mong đợi |
|:----:|-------|----------|------------------|
| 1 | Citizen | Tạo ca → Hủy khi PENDING | `CANCELLED` |
| 2 | Rescuer | Từ chối ca đã ASSIGNED | `CANCELLED` + lý do (UI) |
| 3 | Coordinator | Xóa ca (nếu có quyền) | Ca biến mất khỏi danh sách |

**Pass scenario:** ☐

---

## 6. Checklist UI / trải nghiệm

| ID | Hạng mục | Pass |
|----|----------|:----:|
| U1 | Đăng nhập sai mật khẩu → thông báo lỗi rõ | ☐ |
| U2 | Form SOS thiếu GPS → cảnh báo | ☐ |
| U3 | Bản đồ load tile OpenStreetMap | ☐ |
| U4 | Menu sidebar đúng theo role | ☐ |
| U5 | Responsive cơ bản (thu nhỏ cửa sổ) | ☐ |
| U6 | Upload ảnh > 5MB → lỗi hợp lệ | ☐ |

---

## 7. API smoke test (Postman / curl)

| Method | Endpoint | Auth | Role gợi ý | Pass |
|--------|----------|------|------------|:----:|
| POST | `/api/auth/login` | — | — | ☐ |
| POST | `/api/auth/logout` | Bearer | Any | ☐ |
| GET | `/api/rescue-requests` | Bearer | COORDINATOR | ☐ |
| POST | `/api/rescue-requests` | Bearer | CITIZEN | ☐ |
| GET | `/api/rescue-requests/{id}/nearby-teams` | Bearer | COORDINATOR | ☐ |
| PATCH | `/api/rescue-requests/{id}/assign` | Bearer | COORDINATOR | ☐ |
| GET | `/api/notifications/unread/count` | Bearer | Any | ☐ |
| GET | `/api/admin/dashboard` | Bearer | ADMIN | ☐ |

**Lấy token:**
```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

---

## 8. Ghi nhận kết quả test

| Ngày test | Người test | Môi trường | Tổng Pass | Ghi chú lỗi |
|-----------|------------|------------|-----------|-------------|
| | | Dev local | / | |
| | | Docker Redis + PG | / | |
| | | Demo / Bảo vệ đồ án | / | |

---

## 9. Lỗi đã biết (không chặn demo cơ bản)

| Mô tả | Mức độ |
|-------|--------|
| Rescuer xem tất cả ca, chưa lọc riêng "nhiệm vụ của tôi" | Trung bình |
| Không có bước xác minh SOS chính thức (REJECTED) trên UI | Thấp |
| Cấu hình Admin (`/settings`) chỉ lưu localStorage | Thấp |
| OSRM public server đôi khi chậm → tạm hiện đường thẳng | Thấp |
| PostGIS cần chạy script SQL thủ công | Thông tin |

---

## 10. Thứ tự test khuyến nghị (30–45 phút)

1. Checklist môi trường (Mục 1)  
2. Đăng nhập `admin`, tạo user COORDINATOR, MANAGER, RESCUER  
3. **Kịch bản 1** (luồng cứu hộ)  
4. **Kịch bản 2** (WebSocket)  
5. **Kịch bản 3** (nearby-teams)  
6. Mục 4 (T1, T6, T7) — kỹ thuật  
7. **Kịch bản 4** (cứu trợ) nếu còn thời gian  

---

*Tài liệu này dùng cho kiểm thử thủ công, demo và nộp báo cáo. Cập nhật khi thêm tính năng mới.*
