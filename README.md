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
desktop/    Electron wrapper that runs the app as a native window
```

## Running as a desktop app

`desktop/` wraps the app in an Electron window: on launch it starts the local Postgres instance and the backend jar if they're not already running, waits for the backend to be healthy, then loads the built frontend. There's a portable exe at `desktop/dist/Discord Clone 1.0.0.exe` (not committed — build it yourself, see below) and a Desktop shortcut pointing at it.

To rebuild after backend/frontend changes:

```
cd backend && mvn clean package -DskipTests
cd frontend && npm run build
cd desktop && npm install && npm run dist
```

Note: `desktop/main.js` hardcodes `D:\discord-clone` as the project root, since the packaged exe can't derive it from its own location (it runs out of an asar archive). If you move the project, update that constant.

## Running locally (without the desktop wrapper)

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
