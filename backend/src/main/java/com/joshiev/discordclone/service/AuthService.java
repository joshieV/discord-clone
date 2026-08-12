package com.joshiev.discordclone.service;

import com.joshiev.discordclone.dto.AuthResponse;
import com.joshiev.discordclone.dto.LoginRequest;
import com.joshiev.discordclone.dto.RegisterRequest;
import com.joshiev.discordclone.model.User;
import com.joshiev.discordclone.repository.UserRepository;
import com.joshiev.discordclone.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password())
        );
        userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user.getUsername()), user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        return new AuthResponse(jwtService.generateToken(request.username()), request.username());
    }
}
