package com.floodrescue.floodrescuesystem.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Flood Rescue Coordination & Relief Management System API")
                        .description("Hệ thống điều phối cứu hộ và quản lý cứu trợ lũ lụt.\n\n"
                                + "**Roles:** CITIZEN, RESCUER, COORDINATOR, MANAGER, ADMIN\n\n"
                                + "**Authentication:** Sử dụng JWT Bearer Token.\n"
                                + "Đăng nhập tại `/api/auth/login` để lấy token, sau đó click nút 'Authorize' bên dưới và nhập: `Bearer <your-token>`")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("MPhuSE")
                                .email("lephu422@hotmail.com")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập JWT access token (không cần prefix 'Bearer')")));
    }
}
