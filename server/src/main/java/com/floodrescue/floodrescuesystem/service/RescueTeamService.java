package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateRescueTeamRequest;
import com.floodrescue.floodrescuesystem.dto.response.RescueTeamResponse;
import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.RescueTeamRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RescueTeamService {

    private final RescueTeamRepository rescueTeamRepository;
    private final UserRepository userRepository;

    public RescueTeamService(RescueTeamRepository rescueTeamRepository, UserRepository userRepository) {
        this.rescueTeamRepository = rescueTeamRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RescueTeamResponse createTeam(CreateRescueTeamRequest request) {
        User leader = userRepository.findById(request.getTeamLeaderId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getTeamLeaderId()));

        RescueTeam team = new RescueTeam();
        team.setTeamName(request.getTeamName());
        team.setDescription(request.getDescription());
        team.setTeamLeaderId(request.getTeamLeaderId());
        team.setMemberCount(request.getMemberCount() != null ? request.getMemberCount() : 1);
        team.setStatus(RescueTeam.TeamStatus.ACTIVE);

        RescueTeam saved = rescueTeamRepository.save(team);
        return RescueTeamResponse.fromEntity(saved, leader.getFullName());
    }

    public List<RescueTeamResponse> getAllTeams() {
        return rescueTeamRepository.findAll().stream()
                .map(team -> {
                    String leaderName = userRepository.findById(team.getTeamLeaderId())
                            .map(User::getFullName).orElse("Unknown");
                    return RescueTeamResponse.fromEntity(team, leaderName);
                })
                .collect(Collectors.toList());
    }

    public RescueTeamResponse getTeamById(Long teamId) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        String leaderName = userRepository.findById(team.getTeamLeaderId())
                .map(User::getFullName).orElse("Unknown");
        return RescueTeamResponse.fromEntity(team, leaderName);
    }

    @Transactional
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
    public void deleteTeam(Long teamId) {
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue team not found with ID: " + teamId));
        rescueTeamRepository.delete(team);
    }
}
