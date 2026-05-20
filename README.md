# Phần mềm điều phối cứu hộ và quản lý cứu trợ lũ lụt
*(Flood Rescue Coordination and Relief Management System)*

## 1. Ngữ cảnh (Context)
Trong bối cảnh lũ lụt khẩn cấp, cần một hệ thống phần mềm quản lý tập trung hoạt động cứu hộ – cứu trợ, hỗ trợ tiếp nhận yêu cầu, định vị, phân loại mức độ khẩn cấp và điều phối lực lượng, phương tiện nhằm cứu người kịp thời và hiệu quả.

## 2. Vấn đề (Problems)
Trong các đợt lũ lụt, hoạt động cứu hộ – cứu trợ thường thiếu thông tin tập trung, phản ứng chậm và phối hợp kém giữa các lực lượng. Việc tiếp nhận yêu cầu, điều phối đội cứu hộ, phương tiện và phân phối hàng cứu trợ chưa hiệu quả, dẫn đến chậm trễ, trùng lặp hoặc bỏ sót người cần hỗ trợ.

## 3. Các Tác nhân chính (Primary Actors)
Hệ thống được thiết kế phục vụ cho 5 nhóm đối tượng người dùng chính:
*   **Citizen** (Người dân)
*   **Rescue Team** (Đội cứu hộ)
*   **Rescue Coordinator** (Điều phối viên)
*   **Manager** (Người quản lý)
*   **Admin** (Quản trị viên hệ thống)

## 4. Yêu cầu Chức năng (Functional Requirements)

### 🧑‍🤝‍🧑 Citizen (Người dân)
*   Gửi yêu cầu cứu hộ kèm vị trí, mô tả, hình ảnh
*   Theo dõi và nhận thông báo trạng thái xử lý yêu cầu
*   Xác nhận đã được cứu hộ / nhận cứu trợ

### 🚁 Rescue Team (Đội cứu hộ)
*   Nhận nhiệm vụ cứu hộ được phân công
*   Xem chi tiết yêu cầu và vị trí cứu hộ trên bản đồ
*   Cập nhật trạng thái thực hiện và báo cáo kết quả cứu hộ

### 🎧 Rescue Coordinator (Điều phối viên cứu hộ)
*   Tiếp nhận, xác minh yêu cầu cứu hộ
*   Phân loại mức độ khẩn cấp
*   Điều phối đội cứu hộ và phương tiện
*   Theo dõi, điều chỉnh và tổng hợp trạng thái xử lý yêu cầu

### 📦 Manager (Quản lý nguồn lực)
*   Quản lý phương tiện cứu hộ và tình trạng sử dụng
*   Quản lý kho hàng cứu trợ, tồn kho
*   Theo dõi và ghi nhận phân phối hàng cứu trợ
*   Thống kê sử dụng nguồn lực

### ⚙️ Admin (Quản trị viên)
*   Quản lý người dùng và phân quyền
*   Cấu hình danh mục, tham số hệ thống
*   Báo cáo tổng hợp hoạt động cứu hộ – cứu trợ

---

## 5. Công nghệ sử dụng (Technology Stack)
*   **Frontend**: ReactJS (Vite), TypeScript, Tailwind CSS, Zustand.
*   **Backend**: Java (Spring Boot), Spring Security, JWT (JSON Web Tokens).
    *   **Spring WebSocket**: Đẩy thông báo khẩn cấp ngay lập tức đến Dashboard.
*   **Database & Caching**: 
    *   **PostgreSQL + PostGIS**: Lưu trữ dữ liệu quan hệ và xử lý các truy vấn không gian (Spatial Queries).
    *   **Redis**: Caching vị trí Real-time của đội cứu hộ và giới hạn băng thông (Rate Limiting).

## 6. Hướng dẫn chạy dự án (How to Run)

### Yêu cầu (Prerequisites)
*   Java 17+
*   Node.js 18+ & npm
*   PostgreSQL
*   Redis (cổng `6379`) — dùng cho JWT blacklist, cache và Geo tìm đội cứu hộ

### Khởi chạy Redis (Docker)
```bash
docker compose up -d redis
```

### Khởi chạy Backend (Server)
```bash
cd server
./mvnw spring-boot:run
```
*API Backend sẽ chạy tại cổng: `http://localhost:8080`*

### Khởi chạy Frontend (Client)
```bash
cd client
npm install
npm run dev
```
*Giao diện Web sẽ chạy tại cổng: `http://localhost:5173`*

## Cloudinary

Backend uploads rescue request images to Cloudinary through `/api/uploads/images`.
Set these environment variables before starting the server:

```bash
set CLOUDINARY_CLOUD_NAME=your_cloud_name
set CLOUDINARY_API_KEY=your_api_key
set CLOUDINARY_API_SECRET=your_api_secret
```
