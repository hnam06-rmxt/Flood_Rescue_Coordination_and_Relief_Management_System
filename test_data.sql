-- ========================================================
-- DATABASE SCHEMA VÀ DATA TEST
-- Hệ Thống Điều Phối Cứu Hộ & Cứu Trợ Lũ Lụt
-- ========================================================

-- ========================================================
-- PHẦN 1: TẠO BẢNG (DDL)
-- ========================================================

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(255),
    avatar_url VARCHAR(255),
    status VARCHAR(20),
    role_id BIGINT REFERENCES roles(id),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_teams (
    team_id BIGSERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    description TEXT,
    team_leader_id BIGINT REFERENCES users(id),
    member_count INT,
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_requests (
    request_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url VARCHAR(255),
    urgency_level VARCHAR(20),
    status VARCHAR(20),
    assigned_team_id BIGINT REFERENCES rescue_teams(team_id),
    notes TEXT,
    created_time TIMESTAMP,
    updated_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_vehicles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    license_plate VARCHAR(20),
    capacity INT,
    current_location VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    assigned_team_id BIGINT REFERENCES rescue_teams(team_id),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relief_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    quantity_in_stock INT NOT NULL DEFAULT 0,
    minimum_stock_level INT,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relief_distributions (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT REFERENCES relief_items(id) NOT NULL,
    quantity INT NOT NULL,
    recipient_name VARCHAR(100),
    recipient_location VARCHAR(255),
    distributed_by BIGINT REFERENCES users(id),
    rescue_request_id BIGINT REFERENCES rescue_requests(request_id),
    notes TEXT,
    distributed_at TIMESTAMP,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shelters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    capacity INT NOT NULL,
    current_occupancy INT DEFAULT 0,
    status VARCHAR(20),
    contact_info VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flood_alerts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    location_area VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP
);

-- ========================================================
-- PHẦN 2: CHÈN DỮ LIỆU MẪU (DML)
-- ========================================================

-- 1. Chèn danh sách Role
INSERT INTO roles (name, description, created_at) 
VALUES 
('ADMIN', 'Quản trị viên hệ thống', NOW()),
('COORDINATOR', 'Điều phối viên cứu hộ', NOW()),
('MANAGER', 'Quản lý tài nguyên và cứu trợ', NOW()),
('RESCUER', 'Đội viên cứu hộ', NOW()),
('CITIZEN', 'Người dân', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Chèn danh sách User (Password mặc định: 123456)
-- Hash BCrypt cho '123456' là '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu'
INSERT INTO users (full_name, username, password_hash, email, phone, address, status, role_id, created_at)
SELECT 'Nguyễn Văn Admin', 'admin_test', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', 'admin@test.com', '0901234567', 'Hà Nội', 'ACTIVE', id, NOW() FROM roles WHERE name = 'ADMIN'
UNION ALL
SELECT 'Trần Thị Điều Phối', 'coord_test', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', 'coord@test.com', '0902234567', 'Đà Nẵng', 'ACTIVE', id, NOW() FROM roles WHERE name = 'COORDINATOR'
UNION ALL
SELECT 'Lê Văn Kho', 'manager_test', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', 'manager@test.com', '0903234567', 'Huế', 'ACTIVE', id, NOW() FROM roles WHERE name = 'MANAGER'
UNION ALL
SELECT 'Phạm Văn Cứu Hộ', 'rescuer_test', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', 'rescuer@test.com', '0904234567', 'Quảng Bình', 'ACTIVE', id, NOW() FROM roles WHERE name = 'RESCUER'
UNION ALL
SELECT 'Bùi Thị Dân', 'citizen_test', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00dmxs.TVuHOnu', 'citizen@test.com', '0905234567', 'Quảng Nam', 'ACTIVE', id, NOW() FROM roles WHERE name = 'CITIZEN'
ON CONFLICT (username) DO NOTHING;

-- 3. Chèn Đội cứu hộ
INSERT INTO rescue_teams (team_name, description, team_leader_id, member_count, status, created_at)
VALUES ('Đội Phản Ứng Nhanh Sông Hàn', 'Chuyên cứu hộ đường thủy khu vực miền Trung', 
       (SELECT id FROM users WHERE username = 'rescuer_test'), 5, 'ACTIVE', NOW());

-- 4. Chèn Phương tiện
INSERT INTO rescue_vehicles (name, type, license_plate, capacity, current_location, status, assigned_team_id, created_at)
VALUES ('Cano 01', 'BOAT', 'QN-1234', 10, 'Bến thuyền Hội An', 'AVAILABLE', 
       (SELECT team_id FROM rescue_teams WHERE team_name = 'Đội Phản Ứng Nhanh Sông Hàn'), NOW());

-- 5. Chèn Khu trú ẩn (Shelter)
INSERT INTO shelters (name, location, latitude, longitude, capacity, current_occupancy, status, contact_info, created_at)
VALUES ('Trường THPT Duy Xuyên', 'Số 10 Hùng Vương, Duy Xuyên, Quảng Nam', 15.8250, 108.2360, 200, 45, 'OPEN', '0235-3877123', NOW());

-- 6. Chèn Cảnh báo lũ (Flood Alert)
INSERT INTO flood_alerts (title, description, severity, location_area, start_time, end_time, created_by, created_at)
VALUES ('Cảnh báo lũ khẩn cấp sông Thu Bồn', 'Mực nước đang dâng cao trên mức báo động 3. Yêu cầu người dân vùng thấp trũng di dời ngay lập tức.', 
       'EMERGENCY', 'Hạ lưu sông Thu Bồn', NOW(), NOW() + INTERVAL '24 hours', (SELECT id FROM users WHERE username = 'admin_test'), NOW());

-- 7. Chèn Hàng cứu trợ
INSERT INTO relief_items (name, category, unit, quantity_in_stock, minimum_stock_level, description, created_at)
VALUES ('Thùng Mì Tôm Hảo Hảo', 'FOOD', 'Thùng', 500, 50, 'Thực phẩm khẩn cấp', NOW());

-- 8. Chèn Yêu cầu cứu hộ
INSERT INTO rescue_requests (user_id, description, location, latitude, longitude, urgency_level, status, created_time)
VALUES ((SELECT id FROM users WHERE username = 'citizen_test'), 
        'Nước dâng cao đến mái nhà, có người già và trẻ em cần di tản gấp', 
        'Thôn 5, xã Duy Xuyên, Quảng Nam', 15.8234, 108.2345, 'CRITICAL', 'PENDING', NOW());

-- ========================================================
-- PHẦN 3: CÁC CÂU LỆNH TRUY VẤN KIỂM TRA (SELECT QUERIES)
-- ========================================================

-- Kiểm tra danh sách User và Role
-- SELECT u.username, u.full_name, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id;

-- Kiểm tra các yêu cầu cứu hộ khẩn cấp chưa được xử lý
-- SELECT * FROM rescue_requests WHERE urgency_level = 'CRITICAL' AND status = 'PENDING';

-- Kiểm tra tồn kho hàng cứu trợ
-- SELECT name, quantity_in_stock, unit FROM relief_items;

-- Kiểm tra danh sách điểm an toàn và số chỗ còn trống
-- SELECT name, (capacity - current_occupancy) as slots_available, status FROM shelters;

-- Xem các cảnh báo thiên tai mới nhất
-- SELECT title, severity, location_area FROM flood_alerts ORDER BY created_at DESC;

-- Kiểm tra các đội đang hoạt động và phương tiện họ sử dụng
-- SELECT t.team_name, v.name as vehicle_name, v.status as vehicle_status 
-- FROM rescue_teams t 
-- LEFT JOIN rescue_vehicles v ON t.team_id = v.assigned_team_id;
