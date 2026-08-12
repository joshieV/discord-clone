package com.joshiev.discordclone.service;

import com.joshiev.discordclone.dto.MessageResponse;
import com.joshiev.discordclone.model.Message;
import com.joshiev.discordclone.model.Room;
import com.joshiev.discordclone.model.User;
import com.joshiev.discordclone.repository.MessageRepository;
import com.joshiev.discordclone.repository.RoomRepository;
import com.joshiev.discordclone.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public MessageService(
            MessageRepository messageRepository,
            RoomRepository roomRepository,
            UserRepository userRepository
    ) {
        this.messageRepository = messageRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public List<MessageResponse> getHistory(String roomName) {
        Room room = roomRepository.findByName(roomName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

        List<Message> messages = messageRepository.findTop50ByRoomIdOrderByCreatedAtDesc(room.getId());
        Collections.reverse(messages);

        return messages.stream().map(MessageResponse::from).toList();
    }

    public MessageResponse postMessage(String roomName, String username, String content) {
        Room room = roomRepository.findByName(roomName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));

        Message message = new Message(content, author, room);
        messageRepository.save(message);

        return MessageResponse.from(message);
    }
}
