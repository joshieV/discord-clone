package com.joshiev.discordclone.controller;

import com.joshiev.discordclone.dto.MessageResponse;
import com.joshiev.discordclone.dto.SendMessageRequest;
import com.joshiev.discordclone.service.MessageService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/rooms/{roomName}/send")
    public void send(@DestinationVariable String roomName, SendMessageRequest request, Principal principal) {
        MessageResponse response = messageService.postMessage(roomName, principal.getName(), request.content());
        messagingTemplate.convertAndSend("/topic/rooms/" + roomName, response);
    }
}
