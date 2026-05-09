package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.CreateDistributionRequest;
import com.floodrescue.floodrescuesystem.dto.request.CreateReliefItemRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.DistributionResponse;
import com.floodrescue.floodrescuesystem.dto.response.ReliefItemResponse;
import com.floodrescue.floodrescuesystem.service.ReliefService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/relief")
@Tag(name = "Relief Management", description = "Quản lý kho hàng cứu trợ và phân phối")
public class ReliefController {

    private final ReliefService reliefService;

    public ReliefController(ReliefService reliefService) {
        this.reliefService = reliefService;
    }

    // ========== RELIEF ITEMS (Inventory) ==========

    @PostMapping("/items")
    @Operation(summary = "Thêm hàng cứu trợ", description = "Thêm mặt hàng cứu trợ mới vào kho")
    public ApiResponse<ReliefItemResponse> createItem(@Valid @RequestBody CreateReliefItemRequest request) {
        return ApiResponse.success("Relief item created", reliefService.createItem(request));
    }

    @GetMapping("/items")
    @Operation(summary = "Danh sách hàng cứu trợ", description = "Xem tất cả hàng cứu trợ trong kho")
    public ApiResponse<List<ReliefItemResponse>> getAllItems() {
        return ApiResponse.success("All relief items retrieved", reliefService.getAllItems());
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Chi tiết hàng cứu trợ", description = "Xem chi tiết 1 mặt hàng")
    public ApiResponse<ReliefItemResponse> getItemById(@PathVariable Long id) {
        return ApiResponse.success("Relief item retrieved", reliefService.getItemById(id));
    }

    @GetMapping("/items/category/{category}")
    @Operation(summary = "Lọc theo danh mục", description = "Lọc hàng cứu trợ theo danh mục: FOOD, WATER, MEDICINE, CLOTHING, SHELTER, OTHER")
    public ApiResponse<List<ReliefItemResponse>> getByCategory(@PathVariable String category) {
        return ApiResponse.success("Items by category", reliefService.getItemsByCategory(category));
    }

    @GetMapping("/items/low-stock")
    @Operation(summary = "Hàng sắp hết", description = "Xem danh sách hàng cứu trợ sắp hết (dưới ngưỡng tối thiểu)")
    public ApiResponse<List<ReliefItemResponse>> getLowStockItems() {
        return ApiResponse.success("Low stock items", reliefService.getLowStockItems());
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Cập nhật hàng cứu trợ", description = "Cập nhật thông tin mặt hàng và tồn kho")
    public ApiResponse<ReliefItemResponse> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody CreateReliefItemRequest request) {
        return ApiResponse.success("Relief item updated", reliefService.updateItem(id, request));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Xóa hàng cứu trợ", description = "Xóa mặt hàng cứu trợ khỏi kho")
    public ApiResponse<Void> deleteItem(@PathVariable Long id) {
        reliefService.deleteItem(id);
        return ApiResponse.success("Relief item deleted", null);
    }

    // ========== RELIEF DISTRIBUTION ==========

    @PostMapping("/distributions")
    @Operation(summary = "Ghi nhận phân phối", description = "Ghi nhận phân phối hàng cứu trợ (tự động trừ tồn kho)")
    public ApiResponse<DistributionResponse> createDistribution(
            Authentication auth,
            @Valid @RequestBody CreateDistributionRequest request) {
        return ApiResponse.success("Distribution recorded", reliefService.createDistribution(auth.getName(), request));
    }

    @GetMapping("/distributions")
    @Operation(summary = "Lịch sử phân phối", description = "Xem tất cả lịch sử phân phối hàng cứu trợ")
    public ApiResponse<List<DistributionResponse>> getAllDistributions() {
        return ApiResponse.success("All distributions retrieved", reliefService.getAllDistributions());
    }

    @GetMapping("/distributions/item/{itemId}")
    @Operation(summary = "Lịch sử phân phối theo mặt hàng", description = "Xem lịch sử phân phối của 1 mặt hàng")
    public ApiResponse<List<DistributionResponse>> getDistributionsByItem(@PathVariable Long itemId) {
        return ApiResponse.success("Distributions by item", reliefService.getDistributionsByItem(itemId));
    }
}
