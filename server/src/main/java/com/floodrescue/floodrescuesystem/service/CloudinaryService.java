package com.floodrescue.floodrescuesystem.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

    private final Cloudinary cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryService(Cloudinary cloudinary,
                             @Value("${cloudinary.cloud-name:}") String cloudName,
                             @Value("${cloudinary.api-key:}") String apiKey,
                             @Value("${cloudinary.api-secret:}") String apiSecret) {
        this.cloudinary = cloudinary;
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public List<String> uploadImages(List<MultipartFile> files, String folder) {
        ensureConfigured();
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No image files were provided");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            urls.add(uploadImage(file, folder));
        }
        return urls;
    }

    private String uploadImage(MultipartFile file, String folder) {
        validateImage(file);
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", normalizeFolder(folder),
                            "resource_type", "image"
                    )
            );
            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new BadRequestException("Cloudinary upload did not return a secure URL");
            }
            return secureUrl.toString();
        } catch (IOException e) {
            throw new BadRequestException("Unable to upload image to Cloudinary");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is empty");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BadRequestException("Image file must be 5MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }
    }

    private String normalizeFolder(String folder) {
        if (folder == null || folder.trim().isEmpty()) {
            return "flood-rescue";
        }
        return "flood-rescue/" + folder.trim().replaceAll("[^a-zA-Z0-9/_-]", "-");
    }

    private void ensureConfigured() {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new BadRequestException("Cloudinary is not configured on the server");
        }
    }
}
