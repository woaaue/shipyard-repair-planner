package com.shipyard.repair.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class LegacyApiDeprecationHeaderFilter extends OncePerRequestFilter {

    private static final String LEGACY_API_PREFIX = "/api/";
    private static final String SUNSET_DATE = "Wed, 30 Sep 2026 23:59:59 GMT";
    private static final String DEPRECATION_DOC =
            "</docs/legacy-cutover-plan.md>; rel=\"deprecation\"; type=\"text/markdown\"";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(request, response);
        if (isLegacyApiRequest(request)) {
            response.setHeader("Deprecation", "true");
            response.setHeader("Sunset", SUNSET_DATE);
            response.setHeader("Link", DEPRECATION_DOC);
        }
    }

    private boolean isLegacyApiRequest(HttpServletRequest request) {
        return request.getRequestURI() != null && request.getRequestURI().startsWith(LEGACY_API_PREFIX);
    }
}
