package com.foodrescue.service;

import com.foodrescue.config.AppProperties;
import com.foodrescue.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.regex.Pattern;

/**
 * Confirms a Phone.email sign-in. After the user enters the OTP, the Phone.email button hands the page a
 * user_json_url; the server fetches it and reads the verified number from there. Only URLs under the
 * configured Phone.email prefix are fetched, and redirects are not followed, so the endpoint can't be
 * pointed at internal addresses.
 */
@Service
public class PhoneVerificationService {

    private static final Logger log = LoggerFactory.getLogger(PhoneVerificationService.class);
    private static final Pattern FILE_NAME = Pattern.compile("^[A-Za-z0-9_-]{1,120}\\.json$");
    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final String FAILED = "We couldn't confirm your phone number. Please try again.";

    public record VerifiedPhone(String e164, String firstName, String lastName) {
    }

    private final URI prefix;
    private final RestClient http;
    private final JsonMapper json;

    public PhoneVerificationService(AppProperties props, JsonMapper json) {
        String configured = props.phoneEmail() == null || props.phoneEmail().userJsonPrefix() == null
                ? "https://user.phone.email/"
                : props.phoneEmail().userJsonPrefix().trim();
        this.prefix = URI.create(configured.endsWith("/") ? configured : configured + "/");
        this.json = json;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.http = RestClient.builder().requestFactory(factory).build();
    }

    public VerifiedPhone verify(String userJsonUrl) {
        URI uri = allowedUri(userJsonUrl);
        String body;
        try {
            body = http.get().uri(uri).retrieve().body(String.class);
        } catch (RestClientException e) {
            log.warn("Phone.email lookup failed: {}", e.getMessage());
            throw ApiException.unauthorized(FAILED);
        }
        JsonNode node;
        try {
            node = json.readTree(body == null ? "" : body);
        } catch (JacksonException e) {
            throw ApiException.unauthorized(FAILED);
        }
        String e164 = toE164(text(node, "user_country_code"), text(node, "user_phone_number"));
        if (e164 == null) {
            throw ApiException.unauthorized(FAILED);
        }
        return new VerifiedPhone(e164, text(node, "user_first_name"), text(node, "user_last_name"));
    }

    /** Accepts only a single .json file directly under the configured prefix: same scheme, host and port. */
    URI allowedUri(String raw) {
        URI uri;
        try {
            uri = new URI(raw == null ? "" : raw.trim()).normalize();
        } catch (URISyntaxException e) {
            throw ApiException.badRequest("That sign-in link isn't valid.");
        }
        String path = uri.getRawPath() == null ? "" : uri.getRawPath();
        boolean ok = uri.getScheme() != null && prefix.getScheme().equalsIgnoreCase(uri.getScheme())
                && uri.getHost() != null && uri.getHost().equalsIgnoreCase(prefix.getHost())
                && prefix.getPort() == uri.getPort()
                && uri.getRawUserInfo() == null
                && uri.getRawQuery() == null
                && uri.getRawFragment() == null
                && path.startsWith(prefix.getRawPath())
                && FILE_NAME.matcher(path.substring(prefix.getRawPath().length())).matches();
        if (!ok) {
            throw ApiException.badRequest("That sign-in link isn't valid.");
        }
        return uri;
    }

    static String toE164(String countryCode, String number) {
        if (countryCode == null || number == null) return null;
        String e164 = "+" + countryCode.replaceAll("\\D", "") + number.replaceAll("\\D", "");
        return E164.matcher(e164).matches() ? e164 : null;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node == null ? null : node.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asString().trim();
        return s.isEmpty() ? null : s;
    }
}
