package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateRescueTeamRequest;
import com.floodrescue.floodrescuesystem.dto.response.RescueTeamResponse;
import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.entity.RescueRequest;
import com.floodrescue.floodrescuesystem.repository.RescueRequestRepository;
import com.floodrescue.floodrescuesystem.repository.RescueTeamRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class RescueTeamService {

    private final RescueTeamRepository rescueTeamRepository;
    private final RescueRequestRepository rescueRequestRepository;
    private final UserRepository userRepository;

    public RescueTeamService(RescueTeamRepository rescueTeamRepository,
                             RescueRequestRepository rescueRequestRepository,
                             UserRepository userRepository) {
        this.rescueTeamRepository = rescueTeamRepository;
        this.rescueRequestRepository = rescueRequestRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    @CacheEvict(value = "rescueTeams", allEntries = true)
    public RescueTeamResponse createTeam(CreateRescueTeamRequest request) {
        User leader = userRepository.findById(request.getTeamLeaderId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getTeamLeaderId()));

        RescueTeam team = new RescueTeam();
        team.setTeamName(request.getTeamName());
        team.setDescription(request.getDescription());
        team.setTeamLeaderId(request.getTeamLeaderId());
        team.setMemberCount(request.getMemberCount() != null ? request.getMemberCount() : 1);
        team.setContactPhone(request.getContactPhone());
        team.setCurrentLocation(request.getCurrentLocation());
        team.setLatitude(request.getLatitude());
        team.setLongitude(request.getLongitude());
        team.setStatus(RescueTeam.TeamStatus.ACTIVE);

        RescueTeam saved = rescueTeamRepository.save(team);
        return RescueTeamResponse.fromEntity(saved, leader.getFullName());
    }

    @Cacheable(value = "rescueTeams", key = "'all'")
    public List<RescueTeamResponse> getAllTeams() {
        return rescueTeamRepository.findAll().stream()
                .map(team -> {
                    String leaderName = userRepository.findById(team.getTeamLeaderId())
                            .map(User::getFullName).orElse("Unknown");
                    return RescueTeamResponse.fromEntity(team, leaderName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Các đội cứu hộ đang được gán cho ca SOS của citizen (dùng trên bản đồ).
     */
    public List<RescueTeamResponse> getTeamsAssignedToCitizen(Long userId) {
        List<Long> teamIds = rescueRequestRepository.findByUserId(userId).stream()
                .map(RescueRequest::getAssignedTeam)
                .filter(Objects::nonNull)
                .map(RescueTeam::getTeamId)
                .distinct()
                .toList();

        return teamIds.stream()
                .map(this::getTeamById)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "rescueTeams", key = "#teamId")
    public RescueTeamResponse getTeamById(Long teamId) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        String leaderName = userRepository.findById(team.getTeamLeaderId())
                .map(User::getFullName).orElse("Unknown");
        return RescueTeamResponse.fromEntity(team, leaderName);
    }

    @Transactional
    @CacheEvict(value = "rescueTeams", allEntries = true)
    public RescueTeamResponse updateTeamStatus(Long teamId, String status) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        try {
            team.setStatus(RescueTeam.TeamStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status. Use: ACTIVE, INACTIVE, ON_DUTY");
        }
        RescueTeam saved = rescueTeamRepository.save(team);
        String leaderName = userRepository.findById(team.getTeamLeaderId())
                .map(User::getFullName).orElse("Unknown");
        return RescueTeamResponse.fromEntity(saved, leaderName);
    }

    @Transactional
    @CacheEvict(value = "rescueTeams", allEntries = true)
    public RescueTeamResponse updateTeam(Long teamId, CreateRescueTeamRequest request) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        
        User leader = userRepository.findById(request.getTeamLeaderId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getTeamLeaderId()));

        team.setTeamName(request.getTeamName());
        team.setDescription(request.getDescription());
        team.setTeamLeaderId(request.getTeamLeaderId());
        team.setMemberCount(request.getMemberCount() != null ? request.getMemberCount() : 1);
        team.setContactPhone(request.getContactPhone());
        team.setCurrentLocation(request.getCurrentLocation());
        team.setLatitude(request.getLatitude());
        team.setLongitude(request.getLongitude());

        RescueTeam saved = rescueTeamRepository.save(team);
        return RescueTeamResponse.fromEntity(saved, leader.getFullName());
    }

    @Transactional
    @CacheEvict(value = "rescueTeams", allEntries = true)
    public void deleteTeam(Long teamId) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        rescueTeamRepository.delete(team);
    }

    @Transactional
    @CacheEvict(value = "rescueTeams", allEntries = true)
    public RescueTeamResponse updateTeamLocation(Long teamId, Double latitude, Double longitude) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        team.setLatitude(latitude);
        team.setLongitude(longitude);
        RescueTeam saved = rescueTeamRepository.save(team);
        String leaderName = userRepository.findById(team.getTeamLeaderId())
                .map(User::getFullName).orElse("Unknown");
        return RescueTeamResponse.fromEntity(saved, leaderName);
    }
}
