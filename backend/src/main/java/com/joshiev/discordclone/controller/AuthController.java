package com.joshiev.discordclone.controller;

import com.joshiev.discordclone.dto.AuthResponse;
import com.joshiev.discordclone.dto.LoginRequest;
import com.joshiev.discordclone.dto.RegisterRequest;
import com.joshiev.discordclone.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
