package com.shipyard.repair.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LegacyApiDecommissionFilter extends OncePerRequestFilter {

    @Value("${app.legacy-api.block-enabled:true}")
    private boolean blockLegacyApi;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (blockLegacyApi && uri != null && uri.startsWith("/api/")) {
            response.setStatus(HttpServletResponse.SC_GONE);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Legacy monolith API is decommissioned. Use API gateway routes.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
