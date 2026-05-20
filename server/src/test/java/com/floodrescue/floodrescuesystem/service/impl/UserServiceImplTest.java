package com.floodrescue.floodrescuesystem.service.impl;

import com.floodrescue.floodrescuesystem.dto.request.UpdateUserProfileRequest;
import com.floodrescue.floodrescuesystem.dto.response.UserProfileResponse;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void updateCurrentUserProfile_shouldUpdateFieldsSuccessfully() {
        User user = buildUser(1L, "demo", "Demo User", "demo@example.com", "0123");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFullName("  New Name  ");
        request.setEmail("new@example.com");
        request.setPhone("0999");
        request.setAddress("  District 1 ");
        request.setAvatarUrl(" https://img.example/avatar.png ");

        when(userRepository.findByUsername("demo")).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = userService.updateCurrentUserProfile("demo", request);

        assertEquals("New Name", response.getFullName());
        assertEquals("new@example.com", response.getEmail());
        assertEquals("0999", response.getPhone());
        assertEquals("District 1", response.getAddress());
        assertEquals("https://img.example/avatar.png", response.getAvatarUrl());
        verify(userRepository).save(user);
    }

    @Test
    void updateCurrentUserProfile_shouldThrowWhenEmailAlreadyExists() {
        User currentUser = buildUser(1L, "demo", "Demo User", "demo@example.com", "0123");
        User anotherUser = buildUser(2L, "other", "Other User", "taken@example.com", "0999");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setEmail("taken@example.com");

        when(userRepository.findByUsername("demo")).thenReturn(Optional.of(currentUser));
        when(userRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(anotherUser));

        assertThrows(BadRequestException.class,
                () -> userService.updateCurrentUserProfile("demo", request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateCurrentUserProfile_shouldSetNullableFieldsToNullWhenBlank() {
        User user = buildUser(1L, "demo", "Demo User", "demo@example.com", "0123");
        user.setAddress("Old address");
        user.setAvatarUrl("old-avatar");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setEmail("   ");
        request.setAddress("   ");
        request.setAvatarUrl("   ");

        when(userRepository.findByUsername("demo")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = userService.updateCurrentUserProfile("demo", request);

        assertNull(response.getEmail());
        assertNull(response.getAddress());
        assertNull(response.getAvatarUrl());
    }

    @Test
    void updateCurrentUserProfile_shouldThrowWhenUserNotFound() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateCurrentUserProfile("missing", new UpdateUserProfileRequest()));
    }

    private User buildUser(Long id, String username, String fullName, String email, String phone) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        return user;
    }
}
