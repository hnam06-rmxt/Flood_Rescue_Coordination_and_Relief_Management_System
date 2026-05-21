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

    @Transactional
    public RescueRequestResponse createRescueRequest(Long userId, CreateRescueRequestDTO requestDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

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

        UrgencyLevel urgencyLevel;
        try {
            urgencyLevel = UrgencyLevel.valueOf(requestDTO.getUrgencyLevel().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Mức độ khẩn cấp không hợp lệ. Vui lòng sử dụng: LOW, MEDIUM, HIGH, CRITICAL");
        }

        RescueRequest rescueRequest = new RescueRequest(
                user,
                requestDTO.getDescription(),
                requestDTO.getLocation(),
                requestDTO.getLatitude(),
                requestDTO.getLongitude(),
                requestDTO.getImage(),
                urgencyLevel,
                requestDTO.getNumberOfPeople());

        RescueRequest savedRequest = rescueRequestRepository.save(rescueRequest);

        try {
            notificationService.createNotification(
                    user.getId(),
                    "Đã tiếp nhận yêu cầu SOS",
                    "Yêu cầu cứu nạn '" + savedRequest.getDescription() + "' tại " + savedRequest.getLocation()
                            + " đã được ghi nhận thành công.",
                    "SOS_REQUEST",
                    savedRequest.getRequestId());

            List<User> staff = userRepository.findAll().stream()
                    .filter(u -> {
                        if (u.getRole() == null || u.getRole().getName() == null)
                            return false;
                        String r = u.getRole().getName().toUpperCase();
                        return r.contains("ADMIN") || r.contains("COORDINATOR") || r.contains("MANAGER");
                    })
                    .collect(Collectors.toList());

            for (User u : staff) {
                notificationService.createNotification(
                        u.getId(),
                        "🚨 CA SOS KHẨN CẤP MỚI",
                        "Yêu cầu SOS từ " + user.getFullName() + ": '" + savedRequest.getDescription() + "' tại "
                                + savedRequest.getLocation(),
                        "SOS_REQUEST",
                        savedRequest.getRequestId());
            }
        } catch (Exception ignored) {
        }

        RescueRequestResponse responseForWs = mapToResponse(savedRequest);
        webSocketNotificationService.broadcastSosAlert(responseForWs);

        return responseForWs;
    }

    public List<RescueRequestResponse> getAllRescueRequests() {
        return rescueRequestRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RescueRequestResponse getRescueRequestById(Long requestId) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        return mapToResponse(rescueRequest);
    }

    public List<RescueRequestResponse> getUserRescueRequests(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

        return rescueRequestRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RescueRequestResponse> getRescueRequestsByStatus(String status) {
        RequestStatus requestStatus;
        try {
            requestStatus = RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ");
        }

        return rescueRequestRepository.findByStatus(requestStatus)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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
            if (rescueTeam.getTeamLeaderId() != null) {
                notificationService.createNotification(
                        rescueTeam.getTeamLeaderId(),
                        "🎯 NHIỆM VỤ CỨU HỘ MỚI",
                        "Đội của bạn đã được giao cứu hộ ca SOS #" + updatedRequest.getRequestId() + ": '"
                                + updatedRequest.getDescription() + "' tại " + updatedRequest.getLocation(),
                        "SOS_ASSIGNMENT",
                        updatedRequest.getRequestId());
            }

            if (rescueRequest.getUser() != null) {
                notificationService.createNotification(
                        rescueRequest.getUser().getId(),
                        "Đội cứu hộ đã xuất phát",
                        "Đội '" + rescueTeam.getTeamName()
                                + "' đã tiếp nhận ca SOS của bạn và đang di chuyển đến vị trí của bạn.",
                        "SOS_ASSIGNMENT",
                        updatedRequest.getRequestId());
            }
        } catch (Exception ignored) {
        }

        webSocketNotificationService.broadcastStatusUpdate(
                updatedRequest.getRequestId(),
                updatedRequest.getStatus().name(),
                updatedRequest.getAssignedTeam() != null ? updatedRequest.getAssignedTeam().getTeamId() : null);

        return mapToResponse(updatedRequest);
    }

    @Transactional
    public RescueRequestResponse updateRescueRequestStatus(Long requestId, String status) {
        return updateRescueRequestStatus(requestId, status, null, null);
    }

    @Transactional
    public RescueRequestResponse startRescue(Long requestId) {
        return updateRescueRequestStatus(requestId, RequestStatus.IN_PROGRESS.name(), null, null);
    }

    @Transactional
    public RescueRequestResponse completeRequest(Long requestId, String notes, String proofImageUrl) {
        return updateRescueRequestStatus(requestId, RequestStatus.COMPLETED.name(), notes, proofImageUrl);
    }

    @Transactional
    public RescueRequestResponse rejectRequest(Long requestId, String reason) {
        return updateRescueRequestStatus(requestId, RequestStatus.REJECTED.name(), reason, null);
    }

    @Transactional
    public RescueRequestResponse cancelRequest(Long requestId, Long userId, boolean citizenOnly, String reason) {
        RescueRequest req = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue request not found with ID: " + requestId));

        if (citizenOnly && (req.getUser() == null || !req.getUser().getId().equals(userId))) {
            throw new BadRequestException("You can only cancel your own request.");
        }

        return updateRescueRequestStatus(requestId, RequestStatus.CANCELLED.name(), reason, null);
    }

    @Transactional
    public RescueRequestResponse confirmRescued(Long requestId, Long citizenId) {
        RescueRequest req = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue request not found with ID: " + requestId));

        if (citizenId != null && (req.getUser() == null || !req.getUser().getId().equals(citizenId))) {
            throw new BadRequestException("You can only confirm your own request.");
        }

        return updateRescueRequestStatus(requestId, RequestStatus.COMPLETED.name(), null, null);
    }

    @Transactional
    public RescueRequestResponse updateRescueRequestStatus(Long requestId, String status, String notes,
            String proofImageUrl) {
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

                if (requestStatus == RequestStatus.ASSIGNED) {
                    vietnameseStatusText = "Đã giao cho đội cứu hộ";
                } else if (requestStatus == RequestStatus.IN_PROGRESS) {
                    vietnameseStatusText = "Đang tiến hành giải cứu";
                } else if (requestStatus == RequestStatus.COMPLETED) {
                    vietnameseStatusText = "Hoàn thành giải cứu an toàn";
                } else if (requestStatus == RequestStatus.VERIFIED) {
                    vietnameseStatusText = "Đã xác minh hợp lệ";
                } else if (requestStatus == RequestStatus.RELIEF_RECEIVED) {
                    vietnameseStatusText = "Đã nhận hàng cứu trợ";
                }

                notificationService.createNotification(
                        rescueRequest.getUser().getId(),
                        "Cập nhật ca SOS #" + updatedRequest.getRequestId(),
                        "Trạng thái ca cứu hộ của bạn đã chuyển sang: " + vietnameseStatusText,
                        "SOS_STATUS",
                        updatedRequest.getRequestId());
            }
        } catch (Exception ignored) {
        }

        webSocketNotificationService.broadcastStatusUpdate(
                updatedRequest.getRequestId(),
                updatedRequest.getStatus().name(),
                updatedRequest.getAssignedTeam() != null ? updatedRequest.getAssignedTeam().getTeamId() : null);

        return mapToResponse(updatedRequest);
    }

    @Transactional
    public RescueRequestResponse verifyRequest(Long requestId, String notes) {
        RescueRequest req = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        req.setStatus(RequestStatus.VERIFIED);

        if (notes != null && !notes.isBlank()) {
            req.setNotes(notes);
        }

        req.setUpdatedTime(LocalDateTime.now());
        RescueRequest saved = rescueRequestRepository.save(req);

        try {
            if (req.getUser() != null) {
                notificationService.createNotification(
                        req.getUser().getId(),
                        "✅ SOS đã được xác minh",
                        "Yêu cầu cứu hộ của bạn đã được điều phối viên xác minh và đang được xử lý.",
                        "SOS_VERIFIED",
                        saved.getRequestId());
            }
        } catch (Exception ignored) {
        }

        webSocketNotificationService.broadcastStatusUpdate(
                saved.getRequestId(),
                "VERIFIED",
                saved.getAssignedTeam() != null ? saved.getAssignedTeam().getTeamId() : null);

        return mapToResponse(saved);
    }

    @Transactional
    public RescueRequestResponse markReliefReceived(Long requestId, Long citizenId) {
        RescueRequest req = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        if (citizenId != null && !req.getUser().getId().equals(citizenId)) {
            throw new BadRequestException("Bạn chỉ có thể xác nhận yêu cầu của chính mình!");
        }

        req.setStatus(RequestStatus.RELIEF_RECEIVED);
        req.setUpdatedTime(LocalDateTime.now());

        RescueRequest saved = rescueRequestRepository.save(req);

        try {
            List<User> staff = userRepository.findAll()
                    .stream()
                    .filter(u -> u.getRole() != null
                            && u.getRole().getName() != null
                            && (u.getRole().getName().contains("ADMIN")
                                    || u.getRole().getName().contains("COORDINATOR")))
                    .collect(Collectors.toList());

            for (User u : staff) {
                notificationService.createNotification(
                        u.getId(),
                        "Citizen xác nhận đã nhận cứu trợ",
                        req.getUser().getFullName() + " đã xác nhận nhận được cứu trợ cho ca #" + requestId,
                        "RELIEF_RECEIVED",
                        requestId);
            }
        } catch (Exception ignored) {
        }

        webSocketNotificationService.broadcastStatusUpdate(
                saved.getRequestId(),
                "RELIEF_RECEIVED",
                saved.getAssignedTeam() != null ? saved.getAssignedTeam().getTeamId() : null);

        return mapToResponse(saved);
    }

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

    @Transactional
    public RescueRequestResponse updateLocation(Long requestId, Double latitude, Double longitude) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        rescueRequest.setLatitude(latitude);
        rescueRequest.setLongitude(longitude);
        rescueRequest.setUpdatedTime(LocalDateTime.now());

        return mapToResponse(rescueRequestRepository.save(rescueRequest));
    }

    @Transactional
    public void deleteRescueRequest(Long requestId) {
        RescueRequest rescueRequest = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        rescueRequestRepository.delete(rescueRequest);
    }

    public List<RescueRequestResponse> getRescueRequestsByTeam(Long teamId) {
        rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Đội cứu hộ không tồn tại với ID: " + teamId));

        return rescueRequestRepository.findByAssignedTeamTeamId(teamId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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
