package com.joshiev.discordclone.controller;

import com.joshiev.discordclone.dto.MessageResponse;
import com.joshiev.discordclone.service.MessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/{roomName}/messages")
    public List<MessageResponse> getHistory(@PathVariable String roomName) {
        return messageService.getHistory(roomName);
    }
}
