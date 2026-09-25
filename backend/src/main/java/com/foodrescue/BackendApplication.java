package com.foodrescue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class BackendApplication {

    /** Server-side default for logs and formatting. Storage stays UTC (hibernate.jdbc.time_zone) and the API sends ISO instants. */
    public static final String APP_TIME_ZONE = "Asia/Kolkata";

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(APP_TIME_ZONE));
        SpringApplication.run(BackendApplication.class, args);
    }
}
