package com.foodrescue.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Seed seed, Storage storage, PhoneEmail phoneEmail) {

    public record Jwt(String secret, Duration ttl) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Seed(boolean enabled) {
    }

    /** Supabase Storage for food photos. Uploads are turned off while the URL or key is blank. */
    public record Storage(String supabaseUrl, String serviceKey, String bucket) {
    }

    /** Only user JSON URLs under this prefix are fetched after a Phone.email sign-in. */
    public record PhoneEmail(String userJsonPrefix) {
    }
}
