package a2_java;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    @Bean
    public HelloWorldService helloWorldService() {
        return new HelloWorldService();
    }
}