package com.joshiev.discordclone.dto;

import com.joshiev.discordclone.model.Message;

import java.time.Instant;

public record MessageResponse(Long id, String content, String author, Instant createdAt) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getContent(),
                message.getAuthor().getUsername(),
                message.getCreatedAt()
        );
    }
}
