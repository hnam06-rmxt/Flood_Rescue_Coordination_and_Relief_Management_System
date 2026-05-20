package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateDistributionRequest;
import com.floodrescue.floodrescuesystem.dto.request.CreateReliefItemRequest;
import com.floodrescue.floodrescuesystem.dto.response.DistributionResponse;
import com.floodrescue.floodrescuesystem.dto.response.ReliefItemResponse;
import com.floodrescue.floodrescuesystem.entity.ReliefDistribution;
import com.floodrescue.floodrescuesystem.entity.ReliefItem;
import com.floodrescue.floodrescuesystem.entity.RescueRequest;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.ReliefDistributionRepository;
import com.floodrescue.floodrescuesystem.repository.ReliefItemRepository;
import com.floodrescue.floodrescuesystem.repository.RescueRequestRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReliefService {

    private final ReliefItemRepository itemRepository;
    private final ReliefDistributionRepository distributionRepository;
    private final UserRepository userRepository;
    private final RescueRequestRepository rescueRequestRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private NotificationService notificationService;

    public ReliefService(ReliefItemRepository itemRepository,
                         ReliefDistributionRepository distributionRepository,
                         UserRepository userRepository,
                         RescueRequestRepository rescueRequestRepository) {
        this.itemRepository = itemRepository;
        this.distributionRepository = distributionRepository;
        this.userRepository = userRepository;
        this.rescueRequestRepository = rescueRequestRepository;
    }

    // ========== Relief Items ==========

    @Transactional
    public ReliefItemResponse createItem(CreateReliefItemRequest request) {
        ReliefItem item = new ReliefItem();
        item.setName(request.getName());
        item.setCategory(request.getCategory());
        item.setUnit(request.getUnit());
        item.setQuantityInStock(request.getQuantityInStock());
        item.setMinimumStockLevel(request.getMinimumStockLevel());
        item.setDescription(request.getDescription());
        ReliefItem saved = itemRepository.save(item);
        return ReliefItemResponse.fromEntity(saved);
    }

    public List<ReliefItemResponse> getAllItems() {
        return itemRepository.findAll().stream()
                .map(ReliefItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ReliefItemResponse getItemById(Long id) {
        ReliefItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Relief item not found with ID: " + id));
        return ReliefItemResponse.fromEntity(item);
    }

    public List<ReliefItemResponse> getItemsByCategory(String category) {
        return itemRepository.findByCategory(category).stream()
                .map(ReliefItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReliefItemResponse> getLowStockItems() {
        return itemRepository.findAll().stream()
                .filter(item -> item.getMinimumStockLevel() != null
                        && item.getQuantityInStock() <= item.getMinimumStockLevel())
                .map(ReliefItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReliefItemResponse updateItem(Long id, CreateReliefItemRequest request) {
        ReliefItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Relief item not found with ID: " + id));
        if (request.getName() != null) item.setName(request.getName());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getUnit() != null) item.setUnit(request.getUnit());
        if (request.getQuantityInStock() != null) item.setQuantityInStock(request.getQuantityInStock());
        if (request.getMinimumStockLevel() != null) item.setMinimumStockLevel(request.getMinimumStockLevel());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        ReliefItem saved = itemRepository.save(item);
        return ReliefItemResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteItem(Long id) {
        ReliefItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Relief item not found with ID: " + id));
        itemRepository.delete(item);
    }

    // ========== Relief Distribution ==========

    @Transactional
    public DistributionResponse createDistribution(String username, CreateDistributionRequest request) {
        User distributor = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ReliefItem item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Relief item not found with ID: " + request.getItemId()));

        if (item.getQuantityInStock() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + item.getQuantityInStock());
        }

        // Deduct stock
        item.setQuantityInStock(item.getQuantityInStock() - request.getQuantity());
        ReliefItem savedItem = itemRepository.save(item);

        try {
            if (savedItem.getMinimumStockLevel() != null && savedItem.getQuantityInStock() <= savedItem.getMinimumStockLevel()) {
                // Notify managers and admins
                List<User> staff = userRepository.findAll().stream()
                        .filter(u -> {
                            if (u.getRole() == null || u.getRole().getName() == null) return false;
                            String r = u.getRole().getName().toUpperCase();
                            return r.contains("ADMIN") || r.contains("MANAGER");
                        })
                        .collect(Collectors.toList());
                for (User u : staff) {
                    notificationService.createNotification(
                        u.getId(),
                        "⚠️ CẢNH BÁO KHO: SẮP HẾT HÀNG",
                        "Mặt hàng '" + savedItem.getName() + "' chỉ còn lại " + savedItem.getQuantityInStock() + " " + savedItem.getUnit() + " trong kho (Mức tối thiểu: " + savedItem.getMinimumStockLevel() + "). Vui lòng nhập hàng bổ sung.",
                        "LOW_STOCK",
                        savedItem.getId()
                    );
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }

        ReliefDistribution distribution = new ReliefDistribution();
        distribution.setItem(item);
        distribution.setQuantity(request.getQuantity());
        distribution.setRecipientName(request.getRecipientName());
        distribution.setRecipientLocation(request.getRecipientLocation());
        distribution.setDistributedBy(distributor);
        distribution.setNotes(request.getNotes());

        if (request.getRescueRequestId() != null) {
            RescueRequest rescueRequest = rescueRequestRepository.findById(request.getRescueRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rescue request not found"));
            distribution.setRescueRequest(rescueRequest);
        }

        ReliefDistribution saved = distributionRepository.save(distribution);
        return DistributionResponse.fromEntity(saved);
    }

    public List<DistributionResponse> getAllDistributions() {
        return distributionRepository.findAll().stream()
                .map(DistributionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DistributionResponse> getDistributionsByItem(Long itemId) {
        return distributionRepository.findByItemId(itemId).stream()
                .map(DistributionResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
