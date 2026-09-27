package com.foodrescue.controller;

import com.foodrescue.exception.ApiException;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.PhotoStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Photos")
public class UploadController {

    private final PhotoStorageService photos;

    public UploadController(PhotoStorageService photos) {
        this.photos = photos;
    }

    @GetMapping("/status")
    @Operation(summary = "Whether photo uploads are available on this server")
    public Map<String, Boolean> status() {
        return Map.of("photoUploads", photos.isConfigured());
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('DONOR')")
    @Operation(summary = "Upload a food photo", description = "JPEG, PNG or WebP up to 5 MB. Returns the public URL to send as imageUrl.")
    public Map<String, String> upload(@AuthenticationPrincipal Jwt jwt, @RequestParam("file") MultipartFile file) {
        try {
            return Map.of("url", photos.upload(CurrentUser.from(jwt).id(), file.getBytes()));
        } catch (IOException e) {
            throw ApiException.badRequest("Couldn't read the photo.");
        }
    }
}
