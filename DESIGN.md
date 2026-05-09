# Cẩm nang Thiết kế Giao diện (UI/UX Design System)
*Hệ thống: Phần mềm điều phối cứu hộ và quản lý cứu trợ lũ lụt*

Tài liệu này định nghĩa các tiêu chuẩn thiết kế (Design System) cho toàn bộ giao diện của dự án, nhằm đảm bảo tính nhất quán, chuyên nghiệp và tối ưu trải nghiệm người dùng, đặc biệt trong các tình huống khẩn cấp (cứu hộ, cứu trợ).

---

## 1. Triết lý Thiết kế (Design Principles)
*   **Tối giản và Sạch sẽ (Clean & Minimalist):** Giảm thiểu yếu tố thừa, tập trung hiển thị dữ liệu quan trọng nhất (vị trí, mức độ khẩn cấp).
*   **Rõ ràng & Tương phản cao (High Contrast):** Đảm bảo khả năng đọc tốt ngoài trời (cho đội cứu hộ) và trong môi trường ánh sáng yếu.
*   **Phản hồi theo thời gian thực (Real-time Focus):** Mọi thay đổi trạng thái (có thông báo mới, vị trí thay đổi) phải được thể hiện ngay lập tức qua hiệu ứng mượt mà.
*   **Đa nền tảng (Responsive & Mobile-first):**
    *   *Người dân & Đội cứu hộ:* Ưu tiên giao diện trên điện thoại di động (Mobile). Nút bấm lớn, thao tác vuốt chạm dễ dàng.
    *   *Điều phối viên, Quản lý & Admin:* Ưu tiên giao diện Desktop với Dashboard rộng rãi để bao quát thông tin và bản đồ (Map).

---

## 2. Bảng màu (Color Palette)
Hệ thống sử dụng bảng màu phản ánh sự chuyên nghiệp, tin cậy và phân cấp mức độ khẩn cấp rõ ràng.

### Màu chủ đạo (Primary Colors)
*   **Primary (Xanh dương đậm - `#1d4ed8` / Blue 700):** Dùng cho các thành phần chính (Header, Nút bấm chính, Liên kết). Tạo cảm giác an tâm, chuyên nghiệp.
*   **Secondary (Cam cứu hộ - `#ea580c` / Orange 600):** Dùng làm điểm nhấn cho các hành động cứu trợ, các khu vực cảnh báo trung bình.

### Màu hệ thống & Khẩn cấp (Semantic & Urgency Colors)
Được sử dụng cho các Label, Badge, và Marker trên bản đồ để hiển thị trạng thái yêu cầu:
*   **🔴 Critical (Đỏ - `#dc2626` / Red 600):** Nguy hiểm đến tính mạng, cần cứu hộ lập tức.
*   **🟠 High (Cam - `#f97316` / Orange 500):** Rất khẩn cấp, mức độ ưu tiên cao.
*   **🟡 Medium (Vàng - `#eab308` / Yellow 500):** Cần hỗ trợ (thiếu lương thực, nước uống).
*   **🟢 Low / Success (Xanh lá - `#16a34a` / Green 600):** An toàn, đã cứu hộ thành công, hoặc thông báo hệ thống bình thường.

### Màu Nền & Văn bản (Neutrals)
*   **Background (Nền):** `#f8fafc` (Slate 50) cho nền ứng dụng; `#ffffff` (White) cho các Thẻ (Card) và Bảng biểu (Panel).
*   **Text (Văn bản):** `#0f172a` (Slate 900) cho Tiêu đề; `#475569` (Slate 600) cho đoạn văn.

---

## 3. Kiểu chữ (Typography)
Sử dụng các font chữ không chân (San-serif) hiện đại, hỗ trợ Tiếng Việt tốt:
*   **Font Family:** `Inter`, `Roboto` hoặc `System-UI`.
*   **Tiêu đề (Headings):** Font weight `Bold` (700) hoặc `Semi-bold` (600). Kích thước lớn, rõ ràng.
*   **Nội dung (Body):** Font weight `Regular` (400), size `16px` chuẩn để đảm bảo khả năng đọc.
*   **Chú thích (Caption/Eyebrow):** In hoa, kích thước nhỏ `12px` - `14px`, Tracking rộng, thường màu xám nhạt để phân biệt không gian.

---

## 4. Cấu trúc Giao diện theo Role (Layout & Navigation)

### 4.1. Citizen (Người dân) & Rescue Team (Đội cứu hộ)
*   **Bố cục (Layout):** App-like (Giống ứng dụng di động).
*   **Thanh điều hướng (Navigation):** Bottom Navigation Bar (Thanh điều hướng dưới cùng) trên Mobile.
*   **Màn hình chính:** 
    *   *Người dân:* Form tạo yêu cầu lớn, bản đồ định vị GPS hiện tại, danh sách yêu cầu đã gửi dưới dạng Thẻ (Card).
    *   *Đội cứu hộ:* Bản đồ toàn màn hình hiển thị vị trí các nạn nhân, có bảng trượt (Swipe-up bottom sheet) để xem chi tiết danh sách nhiệm vụ.

### 4.2. Coordinator (Điều phối viên) & Manager (Quản lý)
*   **Bố cục (Layout):** Dashboard chuyên nghiệp.
*   **Thanh điều hướng (Navigation):** Sidebar Navigation (Cột điều hướng bên trái) có thể thu gọn.
*   **Màn hình chính:**
    *   *Điều phối viên:* Chia đôi màn hình (Split-screen). Một nửa là Bản đồ thời gian thực (Real-time Map), nửa còn lại là Bảng/Lưới danh sách các yêu cầu đang chờ xử lý.
    *   *Quản lý:* Các bảng biểu (Data Table), Biểu đồ thống kê (Chart) nguồn lực và thanh công cụ tìm kiếm/lọc nâng cao.

---

## 5. Thiết kế Thành phần (Key UI Components)

### Bản đồ thời gian thực (Real-time Map Integration)
*   Tích hợp bản đồ (Leaflet / Mapbox) kết nối với PostGIS.
*   Thiết kế Marker (ghim vị trí) theo màu sắc khẩn cấp (Đỏ, Cam, Vàng).
*   *UI Effect:* Các marker khẩn cấp cấp độ "Critical" có hiệu ứng "Pulse" (vòng tròn tỏa ra liên tục) để thu hút sự chú ý.
*   Sử dụng phong cách Glassmorphism (Kính mờ) cho các bảng thông tin trôi (Floating panel) xếp đè lên bản đồ để không bị mất tầm nhìn tổng thể.

### Bảng dữ liệu (Data Tables)
*   Dùng để hiển thị danh sách dài (cho Admin, Manager).
*   Tính năng bắt buộc: Phân trang (Pagination), Cố định cột tiêu đề (Sticky Header), và Thanh tìm kiếm (Search Bar) tích hợp ngay phía trên.
*   Các hàng (Row) có hiệu ứng Hover đổi màu nhạt để dễ theo dõi.

### Trạng thái (Status Badges)
*   Badge luôn có màu nền nhạt (Opacity 10-20%) và chữ màu đậm (Opacity 100%) của nhóm màu Semantic.
*   Ví dụ: Badge `Chờ xử lý` (Nền cam nhạt, chữ cam đậm), `Đã hoàn thành` (Nền xanh nhạt, chữ xanh đậm).

### Thông báo (Notifications/Toasts)
*   Sử dụng Spring WebSocket để bắn thông báo.
*   Hiển thị dạng Toast Messages xuất hiện góc trên bên phải màn hình (Desktop) hoặc phía trên cùng (Mobile).
*   Có thanh tiến trình (Progress bar) tự động biến mất sau 3-5 giây (ngoại trừ thông báo báo động khẩn cấp cần người dùng tự bấm tắt).

---

## 6. Hiệu ứng & Tương tác (Micro-interactions)
*   **Skeleton Loading:** Thay vì dùng Spinner xoay vòng đơn điệu, khi tải dữ liệu trang sẽ hiển thị các khối xám nhấp nháy mô phỏng nội dung sắp xuất hiện, giúp người dùng cảm thấy ứng dụng tải nhanh hơn.
*   **Hover & Active States:** Nút bấm khi di chuột vào (Hover) sẽ sáng hoặc tối hơn 1 tone, khi bấm (Active) sẽ có hiệu ứng thu nhỏ nhẹ (Scale 0.95) tạo cảm giác nút nhấn vật lý.
*   **Chuyển trang (Page Transitions):** Hiệu ứng Fade-in nhẹ nhàng khi điều hướng giữa các trang (Modules).
