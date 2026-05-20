package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateVehicleRequest;
import com.floodrescue.floodrescuesystem.dto.response.VehicleResponse;
import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import com.floodrescue.floodrescuesystem.entity.RescueVehicle;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.RescueTeamRepository;
import com.floodrescue.floodrescuesystem.repository.RescueVehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final RescueVehicleRepository vehicleRepository;
    private final RescueTeamRepository rescueTeamRepository;

    @Autowired
    private VehicleUsageLogService usageLogService;

    public VehicleService(RescueVehicleRepository vehicleRepository, RescueTeamRepository rescueTeamRepository) {
        this.vehicleRepository = vehicleRepository;
        this.rescueTeamRepository = rescueTeamRepository;
    }

    @Transactional
    public VehicleResponse createVehicle(CreateVehicleRequest request) {
        RescueVehicle vehicle = new RescueVehicle();
        vehicle.setName(request.getName());
        vehicle.setType(request.getType());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setCapacity(request.getCapacity());
        vehicle.setCurrentLocation(request.getCurrentLocation());
        vehicle.setNotes(request.getNotes());
        vehicle.setStatus(RescueVehicle.VehicleStatus.AVAILABLE);

        RescueVehicle saved = vehicleRepository.save(vehicle);
        return VehicleResponse.fromEntity(saved);
    }

    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(VehicleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public VehicleResponse getVehicleById(Long id) {
        RescueVehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + id));
        return VehicleResponse.fromEntity(vehicle);
    }

    public List<VehicleResponse> getVehiclesByStatus(String status) {
        try {
            RescueVehicle.VehicleStatus vehicleStatus = RescueVehicle.VehicleStatus.valueOf(status.toUpperCase());
            return vehicleRepository.findByStatus(vehicleStatus).stream()
                    .map(VehicleResponse::fromEntity)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status. Use: AVAILABLE, IN_USE, MAINTENANCE, DECOMMISSIONED");
        }
    }

    @Transactional
    public VehicleResponse updateVehicleStatus(Long id, String status) {
        RescueVehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + id));
        String oldStatus = vehicle.getStatus() != null ? vehicle.getStatus().name() : null;
        try {
            vehicle.setStatus(RescueVehicle.VehicleStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status");
        }
        RescueVehicle saved = vehicleRepository.save(vehicle);
        usageLogService.log(saved.getId(), saved.getName(),
            saved.getAssignedTeam() != null ? saved.getAssignedTeam().getTeamId() : null,
            saved.getAssignedTeam() != null ? saved.getAssignedTeam().getTeamName() : null,
            null, "STATUS_CHANGED", oldStatus, status.toUpperCase(), null, null);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleResponse assignVehicleToTeam(Long vehicleId, Long teamId) {
        RescueVehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));
        RescueTeam team = rescueTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with ID: " + teamId));

        String oldTeam = vehicle.getAssignedTeam() != null ? vehicle.getAssignedTeam().getTeamName() : null;
        vehicle.setAssignedTeam(team);
        vehicle.setStatus(RescueVehicle.VehicleStatus.IN_USE);
        RescueVehicle saved = vehicleRepository.save(vehicle);
        usageLogService.log(saved.getId(), saved.getName(), teamId, team.getTeamName(),
            null, "ASSIGNED",
            oldTeam != null ? "TEAM:" + oldTeam : "UNASSIGNED",
            "TEAM:" + team.getTeamName(), null, null);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleResponse updateVehicle(Long id, CreateVehicleRequest request) {
        RescueVehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + id));
        vehicle.setName(request.getName());
        vehicle.setType(request.getType());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setCapacity(request.getCapacity());
        vehicle.setCurrentLocation(request.getCurrentLocation());
        vehicle.setNotes(request.getNotes());

        RescueVehicle saved = vehicleRepository.save(vehicle);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        RescueVehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + id));
        vehicleRepository.delete(vehicle);
    }
}
