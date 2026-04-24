package com.shipyard.repair.config;

import com.shipyard.repair.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                    .requestMatchers("/actuator/health").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/api/users/**").hasRole("ADMIN")

                    .requestMatchers(HttpMethod.POST, "/api/repair-requests").hasAnyRole("CLIENT", "ADMIN", "DISPATCHER")
                    .requestMatchers(HttpMethod.PATCH, "/api/repair-requests/*/status").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR")
                    .requestMatchers(HttpMethod.PUT, "/api/repair-requests/**").hasAnyRole("ADMIN", "DISPATCHER")
                    .requestMatchers(HttpMethod.DELETE, "/api/repair-requests/**").hasAnyRole("ADMIN", "DISPATCHER")

                    .requestMatchers(HttpMethod.POST, "/api/repairs").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")
                    .requestMatchers(HttpMethod.PUT, "/api/repairs/**").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")
                    .requestMatchers(HttpMethod.PATCH, "/api/repairs/*/status").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")
                    .requestMatchers(HttpMethod.DELETE, "/api/repairs/**").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")

                    .requestMatchers(HttpMethod.POST, "/api/work-items").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")
                    .requestMatchers(HttpMethod.PUT, "/api/work-items/**").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")
                    .requestMatchers(HttpMethod.DELETE, "/api/work-items/**").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER")
                    .requestMatchers(HttpMethod.PATCH, "/api/work-items/*/status").hasAnyRole("ADMIN", "DISPATCHER", "OPERATOR", "MASTER", "WORKER")

                    .requestMatchers(HttpMethod.POST, "/api/docks").hasAnyRole("ADMIN", "DISPATCHER")
                    .requestMatchers(HttpMethod.PUT, "/api/docks/**").hasAnyRole("ADMIN", "DISPATCHER")
                    .requestMatchers(HttpMethod.DELETE, "/api/docks/**").hasAnyRole("ADMIN", "DISPATCHER")

                    .requestMatchers(HttpMethod.POST, "/api/ships").hasAnyRole("ADMIN", "DISPATCHER")
                    .requestMatchers(HttpMethod.PUT, "/api/ships/**").hasAnyRole("ADMIN", "DISPATCHER")
                    .requestMatchers(HttpMethod.DELETE, "/api/ships/**").hasAnyRole("ADMIN", "DISPATCHER")

                    .requestMatchers(HttpMethod.POST, "/api/shipyards").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/shipyards/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/shipyards/**").hasRole("ADMIN")
                    .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
