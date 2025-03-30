import { io } from "socket.io-client";

const socket = io("ws://localhost:5000");

socket.on("hello", (arg) => {
  console.log(arg);
});

socket.emit("howdy", "stranger");

socket.on("connect", () => {
  console.log("Client connected to server with ID:", socket.id);
});
