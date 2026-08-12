package com.joshiev.discordclone;

import com.joshiev.discordclone.model.Room;
import com.joshiev.discordclone.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DiscordcloneApplication {

	public static void main(String[] args) {
		SpringApplication.run(DiscordcloneApplication.class, args);
	}

	@Bean
	CommandLineRunner seedGeneralRoom(RoomRepository roomRepository) {
		return args -> {
			if (roomRepository.findByName("general").isEmpty()) {
				roomRepository.save(new Room("general"));
			}
		};
	}
}
