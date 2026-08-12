package com.joshiev.discordclone.repository;

import com.joshiev.discordclone.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByName(String name);
}
