package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.UpdateUserProfileRequest;
import com.floodrescue.floodrescuesystem.dto.response.UserProfileResponse;

public interface UserService {

    UserProfileResponse getCurrentUserProfile(String username);

    UserProfileResponse updateCurrentUserProfile(String username, UpdateUserProfileRequest request);
}
