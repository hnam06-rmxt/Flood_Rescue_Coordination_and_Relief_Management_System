package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateRescueRequestDTO;
import com.floodrescue.floodrescuesystem.dto.response.RescueRequestResponse;
import com.floodrescue.floodrescuesystem.entity.*;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.RescueRequestRepository;
import com.floodrescue.floodrescuesystem.repository.RescueTeamRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RescueRequestService {

    @Autowired
    private RescueRequestRepository rescueRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RescueTeamRepository rescueTeamRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private WebSocketNotificationService webSocketNotificationService;

    /**
     * Tạo yêu cầu cứu hộ mới
     */
    @Transactional
    public RescueRequestResponse createRescueRequest(Long userId, CreateRescueRequestDTO requestDTO) {
        // Kiểm tra người dùng tồn tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        // Validate dữ liệu
        if (requestDTO.getDescription() == null || requestDTO.getDescription().trim().isEmpty()) {
            throw new BadRequestException("Mô tả yêu cầu không được để trống");
        }
        if (requestDTO.getLocation() == null || requestDTO.getLocation().trim().isEmpty()) {
            throw new BadRequestException("Địa điểm không được để trống");
        }
        if (requestDTO.getLatitude() == null) {
            throw new BadRequestException("Vĩ độ không được để trống");
        }
        if (requestDTO.getLongitude() == null) {
            throw new BadRequestException("Kinh độ không được để trống");
        }
        if (requestDTO.getUrgencyLevel() == null || requestDTO.getUrgencyLevel().trim().isEmpty()) {
            throw new BadRequestException("Mức độ khẩn cấp không được để trống");
        }

        // Parse urgency level
        UrgencyLevel urgencyLevel;
        try {
            urgencyLevel = UrgencyLevel.valueOf(requestDTO.getUrgencyLevel().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Mức độ khẩn cấp không hợp lệ. Vui lòng sử dụng: LOW, MEDIUM, HIGH, CRITICAL");
        }

        // Tạo rescue request mới
        RescueRequest rescueRequest = new RescueRequest(
                user,
                requestDTO.getDescription(),
                requestDTO.getLocation(),
                requestDTO.getLatitude(),
                requestDTO.getLongitude(),
                requestDTO.getImage(),
                urgencyLevel,
                requestDTO.getNumberOfPeople());

        // Lưu vào database
        RescueRequest savedRequest = rescueRequestRepository.save(rescueRequest);

        try {
            // Notify citizen who created it
            notificationService.createNotification(
                user.getId(),
                "Đã tiếp nhận yêu cầu SOS",
                "Yêu cầu cứu nạn '" + savedRequest.getDescription() + "' tại " + savedRequest.getLocation() + " đã được ghi nhận thành công.",
                "SOS_REQUEST",
                savedRequest.getRequestId()
            );

            // Notify all administrators, coordinators, and managers
            List<User> staff = userRepository.findAll().stream()
                    .filter(u -> {
                        if (u.getRole() == null || u.getRole().getName() == null) return false;
                        String r = u.getRole().getName().toUpperCase();
                        return r.contains("ADMIN") || r.contains("COORDINATOR") || r.contains("MANAGER");
                    })
                    .collect(Collectors.toList());
            for (User u : staff) {
                notificationService.createNotification(
                    u.getId(),
                    "🚨 CA SOS KHẨN CẤP MỚI",
                    "Yêu cầu SOS từ " + user.getFullName() + ": '" + savedRequest.getDescription() + "' tại " + savedRequest.getLocation(),
                    "SOS_REQUEST",
                    savedRequest.getRequestId()
                );
            }
        } catch (Exception e) {
            // Safe fallback to prevent transactional failure on notification errors
        }

        // Push WebSocket broadcast cho staff
        RescueRequestResponse responseForWs = mapToResponse(savedRequest);
        webSocketNotificationService.broadcastSosAlert(responseForWs);

        return responseForWs;
    }

    /**
     * Lấy tất cả yêu cầu cứu hộ
     */
    public List<RescueRequestResponse> getAllRescueRequests() {
        List<RescueRequest> requests = rescueRequestRepository.findAll();
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm yêu cầu cứu hộ theo ID
     */
    public RescueRequestResponse getRescueRequestById(Long requestId) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        return mapToResponse(rescueRequest);
    }

    /**
     * Lấy tất cả yêu cầu cứu hộ của một người dùng
     */
    public List<RescueRequestResponse> getUserRescueRequests(Long userId) {
        // Kiểm tra người dùng tồn tại
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        List<RescueRequest> requests = rescueRequestRepository.findByUserId(userId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả yêu cầu cứu hộ có trạng thái nhất định
     */
    public List<RescueRequestResponse> getRescueRequestsByStatus(String status) {
        RequestStatus requestStatus;
        try {
            requestStatus = RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ");
        }

        List<RescueRequest> requests = rescueRequestRepository.findByStatus(requestStatus);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Giao yêu cầu cứu hộ cho đội cứu hộ
     */
    @Transactional
    public RescueRequestResponse assignRescueRequestToTeam(Long requestId, Long teamId) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        RescueTeam rescueTeam = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Đội cứu hộ không tồn tại với ID: " + teamId));

        rescueRequest.setAssignedTeam(rescueTeam);
        rescueRequest.setStatus(RequestStatus.ASSIGNED);
        rescueRequest.setUpdatedTime(LocalDateTime.now());

        RescueRequest updatedRequest = rescueRequestRepository.save(rescueRequest);

        try {
            // Notify team leader
            if (rescueTeam.getTeamLeaderId() != null) {
                notificationService.createNotification(
                    rescueTeam.getTeamLeaderId(),
                    "🎯 NHIỆM VỤ CỨU HỘ MỚI",
                    "Đội của bạn đã được giao cứu hộ ca SOS #" + updatedRequest.getRequestId() + ": '" + updatedRequest.getDescription() + "' tại " + updatedRequest.getLocation(),
                    "SOS_ASSIGNMENT",
                    updatedRequest.getRequestId()
                );
            }

            // Notify citizen
            if (rescueRequest.getUser() != null) {
                notificationService.createNotification(
                    rescueRequest.getUser().getId(),
                    "Đội cứu hộ đã xuất phát",
                    "Đội '" + rescueTeam.getTeamName() + "' đã tiếp nhận ca SOS của bạn và đang di chuyển đến vị trí của bạn.",
                    "SOS_ASSIGNMENT",
                    updatedRequest.getRequestId()
                );
            }
        } catch (Exception e) {
            // Safe fallback
        }

        // Push WebSocket
        webSocketNotificationService.broadcastStatusUpdate(
            updatedRequest.getRequestId(),
            updatedRequest.getStatus().name(),
            updatedRequest.getAssignedTeam() != null ? updatedRequest.getAssignedTeam().getTeamId() : null
        );

        return mapToResponse(updatedRequest);
    }

    /**
     * Cập nhật trạng thái yêu cầu cứu hộ
     */
    /**
     * Cập nhật trạng thái yêu cầu cứu hộ (kèm notes và proof image)
     */
    @Transactional
    public RescueRequestResponse updateRescueRequestStatus(Long requestId, String status) {
        return updateRescueRequestStatus(requestId, status, null, null);
    }

    @Transactional
    public RescueRequestResponse updateRescueRequestStatus(Long requestId, String status, String notes, String proofImageUrl) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        RequestStatus requestStatus;
        try {
            requestStatus = RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ");
        }

        rescueRequest.setStatus(requestStatus);
        rescueRequest.setUpdatedTime(LocalDateTime.now());
        if (notes != null && !notes.isBlank()) {
            rescueRequest.setNotes(notes);
        }
        if (proofImageUrl != null && !proofImageUrl.isBlank()) {
            rescueRequest.setProofImageUrl(proofImageUrl);
        }

        RescueRequest updatedRequest = rescueRequestRepository.save(rescueRequest);

        try {
            if (rescueRequest.getUser() != null) {
                String vietnameseStatusText = "Đang chờ xử lý";
                if (requestStatus == RequestStatus.ASSIGNED) vietnameseStatusText = "Đã giao cho đội cứu hộ";
                else if (requestStatus == RequestStatus.IN_PROGRESS) vietnameseStatusText = "Đang tiến hành giải cứu";
                else if (requestStatus == RequestStatus.COMPLETED) vietnameseStatusText = "Hoàn thành giải cứu an toàn";
                else if (requestStatus == RequestStatus.VERIFIED) vietnameseStatusText = "Đã xác minh hợp lệ";
                else if (requestStatus == RequestStatus.RELIEF_RECEIVED) vietnameseStatusText = "Đã nhận hàng cứu trợ";
                
                notificationService.createNotification(
                    rescueRequest.getUser().getId(),
                    "Cập nhật ca SOS #" + updatedRequest.getRequestId(),
                    "Trạng thái ca cứu hộ của bạn đã chuyển sang: " + vietnameseStatusText,
                    "SOS_STATUS",
                    updatedRequest.getRequestId()
                );
            }
        } catch (Exception e) {
            // Safe fallback
        }

        // Push WebSocket
        webSocketNotificationService.broadcastStatusUpdate(
            updatedRequest.getRequestId(),
            updatedRequest.getStatus().name(),
            updatedRequest.getAssignedTeam() != null ? updatedRequest.getAssignedTeam().getTeamId() : null
        );

        return mapToResponse(updatedRequest);
    }

    /**
     * Cập nhật yêu cầu cứu hộ
     */
    @Transactional
    public RescueRequestResponse updateRescueRequest(Long requestId, CreateRescueRequestDTO requestDTO) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        if (requestDTO.getDescription() != null) {
            rescueRequest.setDescription(requestDTO.getDescription());
        }
        if (requestDTO.getLocation() != null) {
            rescueRequest.setLocation(requestDTO.getLocation());
        }
        if (requestDTO.getLatitude() != null) {
            rescueRequest.setLatitude(requestDTO.getLatitude());
        }
        if (requestDTO.getLongitude() != null) {
            rescueRequest.setLongitude(requestDTO.getLongitude());
        }
        if (requestDTO.getImage() != null) {
            rescueRequest.setImage(requestDTO.getImage());
        }
        if (requestDTO.getUrgencyLevel() != null) {
            try {
                rescueRequest.setUrgencyLevel(UrgencyLevel.valueOf(requestDTO.getUrgencyLevel().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Mức độ khẩn cấp không hợp lệ");
            }
        }

        if (requestDTO.getNumberOfPeople() != null) {
            rescueRequest.setNumberOfPeople(requestDTO.getNumberOfPeople());
        }

        rescueRequest.setUpdatedTime(LocalDateTime.now());
        RescueRequest updatedRequest = rescueRequestRepository.save(rescueRequest);
        return mapToResponse(updatedRequest);
    }

    /**
     * Cập nhật mức độ khẩn cấp
     */
    @Transactional
    public RescueRequestResponse updateRescueRequestUrgency(Long requestId, String urgencyLevel) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));
        try {
            rescueRequest.setUrgencyLevel(UrgencyLevel.valueOf(urgencyLevel.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Mức độ khẩn cấp không hợp lệ");
        }
        rescueRequest.setUpdatedTime(LocalDateTime.now());
        return mapToResponse(rescueRequestRepository.save(rescueRequest));
    }

    /**
     * Cập nhật vị trí trực tiếp (Ping SOS)
     */
    @Transactional
    public RescueRequestResponse updateLocation(Long requestId, Double latitude, Double longitude) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));
        rescueRequest.setLatitude(latitude);
        rescueRequest.setLongitude(longitude);
        rescueRequest.setUpdatedTime(LocalDateTime.now());
        return mapToResponse(rescueRequestRepository.save(rescueRequest));
    }

    /**
     * Xóa yêu cầu cứu hộ
     */
    @Transactional
    public void deleteRescueRequest(Long requestId) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        rescueRequestRepository.delete(rescueRequest);
    }

    /**
     * Lấy tất cả yêu cầu cứu hộ được giao cho một đội
     */
    public List<RescueRequestResponse> getRescueRequestsByTeam(Long teamId) {
        rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Đội cứu hộ không tồn tại với ID: " + teamId));

        List<RescueRequest> requests = rescueRequestRepository.findByAssignedTeamTeamId(teamId);
        return requests.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Coordinator xác minh SOS hợp lệ (PENDING → VERIFIED)
     */
    @Transactional
    public RescueRequestResponse verifyRequest(Long requestId, String notes) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại: " + requestId));
        if (!"PENDING".equals(rescueRequest.getStatus().toString())) {
            throw new BadRequestException("Chỉ có thể xác minh yêu cầu ở trạng thái PENDING");
        }
        rescueRequest.setStatus(RequestStatus.VERIFIED);
        if (notes != null && !notes.isBlank()) {
            rescueRequest.setNotes(notes);
        }
        rescueRequest.setUpdatedTime(LocalDateTime.now());
        RescueRequest saved = rescueRequestRepository.save(rescueRequest);
        // Push WebSocket notification
        try {
            webSocketNotificationService.notifyStatusUpdate(saved.getRequestId(), "VERIFIED",
                    rescueRequest.getUser().getId(), rescueRequest.getLocation());
        } catch (Exception ignored) {}
        return mapToResponse(saved);
    }

    /**
     * Citizen xác nhận đã nhận hàng cứu trợ (COMPLETED → RELIEF_RECEIVED)
     */
    @Transactional
    public RescueRequestResponse markReliefReceived(Long requestId, Long userId) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại: " + requestId));
        if (!rescueRequest.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền xác nhận yêu cầu này");
        }
        rescueRequest.setStatus(RequestStatus.RELIEF_RECEIVED);
        rescueRequest.setUpdatedTime(LocalDateTime.now());
        RescueRequest saved = rescueRequestRepository.save(rescueRequest);
        try {
            webSocketNotificationService.notifyStatusUpdate(saved.getRequestId(), "RELIEF_RECEIVED",
                    rescueRequest.getUser().getId(), rescueRequest.getLocation());
        } catch (Exception ignored) {}
        return mapToResponse(saved);
    }

    /**
     * Chuyển đổi RescueRequest entity sang RescueRequestResponse DTO
     */
    private RescueRequestResponse mapToResponse(RescueRequest rescueRequest) {
        RescueRequestResponse response = new RescueRequestResponse();
        response.setRequestId(rescueRequest.getRequestId());
        response.setUserId(rescueRequest.getUser().getId());
        response.setUserName(rescueRequest.getUser().getFullName());
        response.setDescription(rescueRequest.getDescription());
        response.setLocation(rescueRequest.getLocation());
        response.setLatitude(rescueRequest.getLatitude());
        response.setLongitude(rescueRequest.getLongitude());
        response.setImage(rescueRequest.getImage());
        response.setNumberOfPeople(rescueRequest.getNumberOfPeople());
        response.setUrgencyLevel(rescueRequest.getUrgencyLevel());
        response.setStatus(rescueRequest.getStatus());
        response.setCreatedTime(rescueRequest.getCreatedTime());
        response.setUpdatedTime(rescueRequest.getUpdatedTime());

        if (rescueRequest.getAssignedTeam() != null) {
            response.setAssignedTeamId(rescueRequest.getAssignedTeam().getTeamId());
            response.setAssignedTeamName(rescueRequest.getAssignedTeam().getTeamName());
        }

        response.setNotes(rescueRequest.getNotes());
        response.setProofImageUrl(rescueRequest.getProofImageUrl());
        return response;
    }
}
