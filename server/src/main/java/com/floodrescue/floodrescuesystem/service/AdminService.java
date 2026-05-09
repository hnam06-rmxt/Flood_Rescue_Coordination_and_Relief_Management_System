package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.AdminCreateUserRequest;
import com.floodrescue.floodrescuesystem.dto.response.DashboardStatsResponse;
import com.floodrescue.floodrescuesystem.dto.response.UserProfileResponse;
import com.floodrescue.floodrescuesystem.entity.*;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RescueRequestRepository rescueRequestRepository;
    private final RescueTeamRepository rescueTeamRepository;
    private final RescueVehicleRepository vehicleRepository;
    private final ReliefItemRepository reliefItemRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, RoleRepository roleRepository,
                        RescueRequestRepository rescueRequestRepository,
                        RescueTeamRepository rescueTeamRepository,
                        RescueVehicleRepository vehicleRepository,
                        ReliefItemRepository reliefItemRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.rescueRequestRepository = rescueRequestRepository;
        this.rescueTeamRepository = rescueTeamRepository;
        this.vehicleRepository = vehicleRepository;
        this.reliefItemRepository = reliefItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ========== User Management ==========

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserProfileResponse::fromUser)
                .collect(Collectors.toList());
    }

    public UserProfileResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return UserProfileResponse.fromUser(user);
    }

    @Transactional
    public UserProfileResponse createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        Role role = roleRepository.findByName(request.getRole().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        User user = new User();
        user.setFullName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setRole(role);
        user.setStatus("ACTIVE");

        User saved = userRepository.save(user);
        return UserProfileResponse.fromUser(saved);
    }

    @Transactional
    public UserProfileResponse updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        user.setRole(role);
        User saved = userRepository.save(user);
        return UserProfileResponse.fromUser(saved);
    }

    @Transactional
    public UserProfileResponse updateUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setStatus(status.toUpperCase());
        User saved = userRepository.save(user);
        return UserProfileResponse.fromUser(saved);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        userRepository.delete(user);
    }

    // ========== Dashboard Statistics ==========

    public DashboardStatsResponse getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        List<RescueRequest> allRequests = rescueRequestRepository.findAll();
        stats.setTotalRequests(allRequests.size());
        stats.setPendingRequests(allRequests.stream()
                .filter(r -> r.getStatus() == RequestStatus.PENDING).count());
        stats.setInProgressRequests(allRequests.stream()
                .filter(r -> r.getStatus() == RequestStatus.IN_PROGRESS || r.getStatus() == RequestStatus.ASSIGNED).count());
        stats.setCompletedRequests(allRequests.stream()
                .filter(r -> r.getStatus() == RequestStatus.COMPLETED).count());

        stats.setTotalTeams(rescueTeamRepository.count());
        stats.setActiveTeams(rescueTeamRepository.findByStatus(RescueTeam.TeamStatus.ACTIVE).size());

        stats.setTotalVehicles(vehicleRepository.count());
        stats.setAvailableVehicles(vehicleRepository.findByStatus(RescueVehicle.VehicleStatus.AVAILABLE).size());

        stats.setTotalReliefItems(reliefItemRepository.count());
        stats.setLowStockItems(reliefItemRepository.findAll().stream()
                .filter(item -> item.getMinimumStockLevel() != null
                        && item.getQuantityInStock() <= item.getMinimumStockLevel())
                .count());

        // Requests by urgency breakdown
        Map<String, Long> byUrgency = new HashMap<>();
        for (UrgencyLevel level : UrgencyLevel.values()) {
            long count = allRequests.stream()
                    .filter(r -> r.getUrgencyLevel() == level).count();
            byUrgency.put(level.name(), count);
        }
        stats.setRequestsByUrgency(byUrgency);

        return stats;
    }
}
