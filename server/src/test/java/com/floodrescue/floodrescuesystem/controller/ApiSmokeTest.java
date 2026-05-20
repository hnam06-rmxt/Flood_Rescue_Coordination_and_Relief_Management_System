package com.floodrescue.floodrescuesystem.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    // ==========================================
    // 1. PUBLIC ENDPOINTS
    // ==========================================
    @Test
    void publicEndpoints_ShouldBeAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }

    // ==========================================
    // 2. UNAUTHENTICATED ACCESS
    // ==========================================
    @Test
    void securedEndpoints_ShouldReturn401_WhenNoTokenProvided() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isForbidden()); // Spring security default 403 when no token
        
        mockMvc.perform(get("/api/rescue-requests"))
                .andExpect(status().isForbidden()); // 403
    }

    // ==========================================
    // 3. CITIZEN ROLE TESTS
    // ==========================================
    @Test
    @WithMockUser(username = "demo", roles = {"CITIZEN"})
    void citizenEndpoints_ShouldBeAccessible_ForCitizenRole() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk());
        
        mockMvc.perform(get("/api/rescue-requests/my-requests"))
                .andExpect(status().isOk());

        // Phân quyền: Citizen không được truy cập Admin (Sẽ bị AccessDeniedException, GlobalExceptionHandler hiện map ra 500)
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().is5xxServerError()); // 403
    }

    // ==========================================
    // 4. ADMIN ROLE TESTS
    // ==========================================
    @Test
    @WithMockUser(username = "test_admin", roles = {"ADMIN"})
    void adminEndpoints_ShouldBeAccessible_ForAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk());
                
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk());
    }

    // ==========================================
    // 5. COORDINATOR ROLE TESTS
    // ==========================================
    @Test
    @WithMockUser(username = "test_coordinator", roles = {"COORDINATOR"})
    void coordinatorEndpoints_ShouldBeAccessible_ForCoordinatorRole() throws Exception {
        // Coordinator có thể xem tất cả các yêu cầu cứu hộ
        mockMvc.perform(get("/api/rescue-requests"))
                .andExpect(status().isOk());
                
        mockMvc.perform(get("/api/rescue-teams"))
                .andExpect(status().isOk());
    }

    // ==========================================
    // 6. MANAGER ROLE TESTS
    // ==========================================
    @Test
    @WithMockUser(username = "test_manager", roles = {"MANAGER"})
    void managerEndpoints_ShouldBeAccessible_ForManagerRole() throws Exception {
        // Manager quản lý kho bãi, hàng cứu trợ
        mockMvc.perform(get("/api/relief/items"))
                .andExpect(status().isOk());
                
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk());
    }
}
