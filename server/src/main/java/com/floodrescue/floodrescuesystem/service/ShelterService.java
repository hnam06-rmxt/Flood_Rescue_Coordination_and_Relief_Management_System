package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateShelterRequest;
import com.floodrescue.floodrescuesystem.dto.response.ShelterResponse;
import com.floodrescue.floodrescuesystem.entity.Shelter;
import com.floodrescue.floodrescuesystem.repository.ShelterRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShelterService {

    private final ShelterRepository shelterRepository;

    public ShelterService(ShelterRepository shelterRepository) {
        this.shelterRepository = shelterRepository;
    }

    @Cacheable(value = "shelters", key = "'all'")
    public List<ShelterResponse> getAllShelters() {
        return shelterRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Cacheable(value = "shelters", key = "#id")
    public ShelterResponse getShelterById(Long id) {
        Shelter shelter = shelterRepository.findById(id).orElseThrow(() -> new RuntimeException("Shelter not found"));
        return mapToResponse(shelter);
    }

    @CacheEvict(value = "shelters", allEntries = true)
    public ShelterResponse createShelter(CreateShelterRequest request) {
        Shelter shelter = new Shelter();
        shelter.setName(request.getName());
        shelter.setLocation(request.getLocation());
        shelter.setLatitude(request.getLatitude());
        shelter.setLongitude(request.getLongitude());
        shelter.setCapacity(request.getCapacity());
        if (request.getCurrentOccupancy() != null) shelter.setCurrentOccupancy(request.getCurrentOccupancy());
        if (request.getStatus() != null) shelter.setStatus(request.getStatus());
        shelter.setContactInfo(request.getContactInfo());
        Shelter saved = shelterRepository.save(shelter);
        return mapToResponse(saved);
    }

    @CacheEvict(value = "shelters", allEntries = true)
    public ShelterResponse updateShelter(Long id, CreateShelterRequest request) {
        Shelter shelter = shelterRepository.findById(id).orElseThrow(() -> new RuntimeException("Shelter not found"));
        shelter.setName(request.getName());
        shelter.setLocation(request.getLocation());
        shelter.setLatitude(request.getLatitude());
        shelter.setLongitude(request.getLongitude());
        shelter.setCapacity(request.getCapacity());
        if (request.getCurrentOccupancy() != null) shelter.setCurrentOccupancy(request.getCurrentOccupancy());
        if (request.getStatus() != null) shelter.setStatus(request.getStatus());
        shelter.setContactInfo(request.getContactInfo());
        Shelter saved = shelterRepository.save(shelter);
        return mapToResponse(saved);
    }

    @CacheEvict(value = "shelters", allEntries = true)
    public void deleteShelter(Long id) {
        shelterRepository.deleteById(id);
    }

    private ShelterResponse mapToResponse(Shelter shelter) {
        ShelterResponse res = new ShelterResponse();
        res.setId(shelter.getId());
        res.setName(shelter.getName());
        res.setLocation(shelter.getLocation());
        res.setLatitude(shelter.getLatitude());
        res.setLongitude(shelter.getLongitude());
        res.setCapacity(shelter.getCapacity());
        res.setCurrentOccupancy(shelter.getCurrentOccupancy());
        res.setStatus(shelter.getStatus());
        res.setContactInfo(shelter.getContactInfo());
        res.setCreatedAt(shelter.getCreatedAt());
        return res;
    }
}
