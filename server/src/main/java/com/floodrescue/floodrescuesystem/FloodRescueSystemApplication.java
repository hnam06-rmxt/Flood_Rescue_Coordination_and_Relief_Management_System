package com.floodrescue.floodrescuesystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class FloodRescueSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(FloodRescueSystemApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Đảm bảo bảng flood_alerts tồn tại
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS flood_alerts (
                        id BIGSERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        severity VARCHAR(50) NOT NULL,
                        location_area VARCHAR(255) NOT NULL,
                        start_time TIMESTAMP,
                        end_time TIMESTAMP,
                        user_id BIGINT NOT NULL REFERENCES users(id),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """);
                System.out.println("Ensured flood_alerts table exists.");
                
                // Ép kiểu cột image_url sang TEXT vì Hibernate ddl-auto=update không tự động sửa cột đã có
                jdbcTemplate.execute("ALTER TABLE rescue_requests ALTER COLUMN image_url TYPE TEXT;");
                System.out.println("Altered rescue_requests.image_url to TEXT successfully.");
                
                // Đảm bảo rescue_teams có cột latitude/longitude
                try {
                    jdbcTemplate.execute("ALTER TABLE rescue_teams ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;");
                    jdbcTemplate.execute("ALTER TABLE rescue_teams ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;");
                    System.out.println("Ensured rescue_teams has latitude/longitude columns.");
                } catch (Exception e2) {
                    System.out.println("rescue_teams columns check: " + e2.getMessage());
                }
            } catch (Exception e) {
                System.out.println("DB init: " + e.getMessage());
            }
        };
    }
}