package com.foodrescue.service;

import com.foodrescue.config.AppProperties;
import com.foodrescue.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhotoStorageServiceTest {

    private static final String BASE = "https://abc.supabase.co";
    private final UUID donor = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private final PhotoStorageService storage = new PhotoStorageService(
            new AppProperties(null, null, null, new AppProperties.Storage(BASE + "/", "key", "donation-photos"), null));

    @Test
    void recognisesImagesByTheirBytes() {
        assertThat(PhotoStorageService.sniff(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo(PhotoStorageService.ImageType.JPEG);
        assertThat(PhotoStorageService.sniff(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})).isEqualTo(PhotoStorageService.ImageType.PNG);
        assertThat(PhotoStorageService.sniff("RIFF1234WEBPVP8 ".getBytes())).isEqualTo(PhotoStorageService.ImageType.WEBP);
        assertThat(PhotoStorageService.sniff("<svg onload=alert(1)>".getBytes())).isNull();
        assertThat(PhotoStorageService.sniff(new byte[0])).isNull();
    }

    @Test
    void rejectsNonImagesBeforeUploading() {
        assertThatThrownBy(() -> storage.upload(donor, "<html></html>".getBytes()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("JPEG, PNG or WebP");
    }

    @Test
    void onlyAcceptsTheDonorsOwnUploads() {
        String own = BASE + "/storage/v1/object/public/donation-photos/donations/" + donor + "/0d9b3c1e-6f7a-4b8c-9d0e-1f2a3b4c5d6e.jpg";
        String someoneElse = BASE + "/storage/v1/object/public/donation-photos/donations/" + UUID.randomUUID() + "/0d9b3c1e-6f7a-4b8c-9d0e-1f2a3b4c5d6e.jpg";

        assertThat(storage.isOwnUpload(own, donor)).isTrue();
        assertThat(storage.isOwnUpload(someoneElse, donor)).isFalse();
        assertThat(storage.isOwnUpload(own + "?x=1", donor)).isFalse();
        assertThat(storage.isOwnUpload("https://evil.com/cat.jpg", donor)).isFalse();
        assertThat(storage.isOwnUpload(own.replace(".jpg", "/../../x.jpg"), donor)).isFalse();
    }

    @Test
    void isOffWithoutAKey() {
        PhotoStorageService off = new PhotoStorageService(
                new AppProperties(null, null, null, new AppProperties.Storage("", "", null), null));
        assertThat(off.isConfigured()).isFalse();
        assertThatThrownBy(() -> off.upload(donor, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("aren't set up");
    }
}
