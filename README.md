# discord-clone

A small Discord-style chat app, built as practice material for reading and modifying an existing full-stack codebase (auth, WebSockets, JPA/Postgres) rather than starting from a blank file every time.

**Stack:** React + TypeScript (Vite) frontend, Spring Boot + PostgreSQL backend, JWT auth, STOMP over WebSocket for real-time messaging.

## What's implemented

- Register / login with JWT-based auth (BCrypt password hashing)
- A single shared chat room (`general`)
- Real-time messaging via STOMP over WebSocket
- Message history persisted in Postgres, loaded on join

## Project structure

```
backend/    Spring Boot API (Java 21, Maven)
frontend/   React + TypeScript app (Vite)
```

## Running locally

**Backend** (needs a Postgres instance — see `backend/src/main/resources/application.properties` for the connection URL):

```
cd backend
mvn spring-boot:run
```

**Frontend:**

```
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8080`.
