package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.UploadResponse;
import com.floodrescue.floodrescuesystem.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Uploads", description = "Upload media files to Cloudinary")
public class UploadController {

    private final CloudinaryService cloudinaryService;

    public UploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/images")
    @Operation(summary = "Upload images", description = "Upload one or more image files to Cloudinary")
    public ApiResponse<UploadResponse> uploadImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(required = false, defaultValue = "rescue-requests") String folder) {
        List<String> urls = cloudinaryService.uploadImages(Arrays.asList(files), folder);
        return ApiResponse.success("Images uploaded successfully", new UploadResponse(urls));
    }
}
