package com.foodrescue.service;

import com.foodrescue.config.AppProperties;
import com.foodrescue.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores food photos in a public Supabase Storage bucket. The server checks the file bytes itself
 * (not the browser's content type) and files every photo under its donor, so a donation can only
 * point at a photo its own donor uploaded.
 */
@Service
public class PhotoStorageService {

    private static final Logger log = LoggerFactory.getLogger(PhotoStorageService.class);
    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Pattern FILE_NAME = Pattern.compile("^[0-9a-f-]{36}\\.(jpg|png|webp)$");

    enum ImageType {
        JPEG("jpg", "image/jpeg"), PNG("png", "image/png"), WEBP("webp", "image/webp");

        final String ext;
        final String mime;

        ImageType(String ext, String mime) {
            this.ext = ext;
            this.mime = mime;
        }
    }

    private final String baseUrl;
    private final String serviceKey;
    private final String bucket;
    private final RestClient http;

    public PhotoStorageService(AppProperties props) {
        AppProperties.Storage cfg = props.storage();
        this.baseUrl = cfg == null || cfg.supabaseUrl() == null ? "" : cfg.supabaseUrl().trim().replaceAll("/+$", "");
        this.serviceKey = cfg == null || cfg.serviceKey() == null ? "" : cfg.serviceKey().trim();
        this.bucket = cfg == null || cfg.bucket() == null || cfg.bucket().isBlank() ? "donation-photos" : cfg.bucket().trim();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.http = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isConfigured() {
        return !baseUrl.isEmpty() && !serviceKey.isEmpty();
    }

    /** Uploads a photo for this donor and returns its public URL. */
    public String upload(UUID ownerId, byte[] bytes) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Photos unavailable", "Photo uploads aren't set up on this server.");
        }
        if (bytes.length == 0) {
            throw ApiException.badRequest("The photo is empty.");
        }
        if (bytes.length > MAX_BYTES) {
            throw ApiException.badRequest("Photos must be 5 MB or smaller.");
        }
        ImageType type = sniff(bytes);
        if (type == null) {
            throw ApiException.badRequest("Upload a JPEG, PNG or WebP photo.");
        }

        String path = folder(ownerId) + UUID.randomUUID() + "." + type.ext;
        try {
            var request = http.post()
                    .uri(baseUrl + "/storage/v1/object/" + bucket + "/" + path)
                    .header("apikey", serviceKey)
                    .header("x-upsert", "false")
                    .header("cache-control", "max-age=31536000")
                    .contentType(MediaType.parseMediaType(type.mime));
            // Legacy service_role keys are JWTs and go in Authorization; new sb_secret keys only need apikey.
            if (serviceKey.startsWith("eyJ")) {
                request = request.header("Authorization", "Bearer " + serviceKey);
            }
            request.body(bytes).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Photo upload to Supabase Storage failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Upload failed", "Couldn't store the photo. Please try again.");
        }
        return publicBase() + path;
    }

    /** True only for photos this donor uploaded through {@link #upload}. */
    public boolean isOwnUpload(String url, UUID ownerId) {
        if (!isConfigured() || url == null) return false;
        String prefix = publicBase() + folder(ownerId);
        return url.startsWith(prefix) && FILE_NAME.matcher(url.substring(prefix.length())).matches();
    }

    private String publicBase() {
        return baseUrl + "/storage/v1/object/public/" + bucket + "/";
    }

    private static String folder(UUID ownerId) {
        return "donations/" + ownerId + "/";
    }

    /** Identifies the image format from its magic bytes. */
    static ImageType sniff(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return ImageType.JPEG;
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return ImageType.PNG;
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return ImageType.WEBP;
        return null;
    }
}
