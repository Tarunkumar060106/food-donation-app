package com.foodrescue.service;

import com.foodrescue.config.AppProperties;
import com.foodrescue.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhoneVerificationServiceTest {

    private final PhoneVerificationService service = new PhoneVerificationService(
            new AppProperties(null, null, null, null, new AppProperties.PhoneEmail("https://user.phone.email/")),
            JsonMapper.builder().build());

    @Test
    void acceptsAPhoneEmailUserFile() {
        assertThat(service.allowedUri("https://user.phone.email/user_abcxd123fgbfg43454.json").toString())
                .isEqualTo("https://user.phone.email/user_abcxd123fgbfg43454.json");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://user.phone.email/user_1.json",
            "https://user.phone.email.evil.com/user_1.json",
            "https://evil.com/user_1.json",
            "https://user.phone.email:8443/user_1.json",
            "https://attacker@user.phone.email/user_1.json",
            "https://user.phone.email/user_1.json?x=1",
            "https://user.phone.email/nested/user_1.json",
            "https://user.phone.email/../admin.json",
            "https://user.phone.email/user_1.txt",
            "https://169.254.169.254/latest/meta-data.json",
            "file:///etc/passwd",
            "not a url",
            ""
    })
    void rejectsAnythingElse(String url) {
        assertThatThrownBy(() -> service.allowedUri(url)).isInstanceOf(ApiException.class);
    }

    @Test
    void buildsE164Numbers() {
        assertThat(PhoneVerificationService.toE164("+91", "98400 22001")).isEqualTo("+919840022001");
        assertThat(PhoneVerificationService.toE164("91", "9840022001")).isEqualTo("+919840022001");
        assertThat(PhoneVerificationService.toE164("+91", "12")).isNull();
        assertThat(PhoneVerificationService.toE164(null, "9840022001")).isNull();
    }
}
