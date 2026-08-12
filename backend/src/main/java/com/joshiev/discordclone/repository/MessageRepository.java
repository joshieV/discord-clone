package com.joshiev.discordclone.repository;

import com.joshiev.discordclone.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findTop50ByRoomIdOrderByCreatedAtDesc(Long roomId);
}
