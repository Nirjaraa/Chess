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

io.on("connection", (socket: Socket) => {
  console.log("A user connected:", socket.id);

  socket.on("message", (msg) => {
    console.log("Message received from client:", msg);
    socket.emit("message", "Hi from the server!");
  });
  socket.emit("message", "Hi from the server!");

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Socket IO server running on http://localhost:5000");
});
