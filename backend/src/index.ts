import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms: Record<string, Socket[]> = {};

io.on("connection", (socket: Socket) => {
  const playerName: string =
    (socket.handshake.query.playerName as string) || "Guest";
  console.log("A user connected:", socket.id, `(${playerName})`);
  socket.data.playerName = playerName;

  let roomId: string | undefined;

  for (const id in rooms) {
    if (rooms[id].length < 2) {
      roomId = id;
      rooms[roomId].push(socket);
      socket.join(roomId);
      break;
    }
  }

  if (!roomId) {
    roomId = `room-${Date.now()}`;
    rooms[roomId] = [socket];
    socket.join(roomId);
  }

  const playerColor = rooms[roomId].length === 1 ? "WHITE" : "BLACK";
  socket.emit("player-color", playerColor);
  socket.emit("player-name", playerName);
  console.log(`${playerName} joined ${roomId} as ${playerColor}`);

  if (rooms[roomId].length === 2) {
    const [player1, player2] = rooms[roomId];
    const playerInfo = {
      white: player1.data.playerName,
      black: player2.data.playerName,
    };

    io.to(roomId).emit("player-info", playerInfo);
    io.to(roomId).emit("start the game", roomId);
    console.log(`Game started in room: ${roomId}`);
  }

  socket.on("move", (movePiece) => {
    const roomId = Array.from(socket.rooms).find((id) => id !== socket.id);
    if (roomId) {
      socket.to(roomId).emit("move", movePiece);
      console.log(`Move made by ${movePiece.playerName}:`, movePiece);
    } else {
      console.error("Room ID is undefined. Move cannot be emitted.");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((s) => s.id !== socket.id);

      if (rooms[roomId].length === 1) {
        const remainingPlayer = rooms[roomId][0];
        remainingPlayer.emit("Other player disconnected. Game-over");
      }

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Socket IO server running on http://localhost:5000");
});
