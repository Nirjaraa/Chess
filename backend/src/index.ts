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
  console.log("A user connected:", socket.id);

  socket.on("joinroom", (roomId: string) => {
    console.log(`${socket.id} is in the ${roomId}`);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length >= 2) {
      socket.emit("Room is filled");
    }

    rooms[roomId].push(socket);
    socket.join(roomId);
    const playerColor = rooms[roomId].length === 1 ? "white" : "black";
    socket.emit("player-color", playerColor);
    if (rooms[roomId].length === 2) {
      io.to(roomId).emit("start the game");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((s) => s.id !== socket.id);
      if (rooms[roomId].length === 1)
        socket.emit("Other player disconnected.Game-over");
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(5000, () => {
  console.log("Socket IO server running on http://localhost:5000");
});
