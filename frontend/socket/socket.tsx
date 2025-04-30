import { io } from "socket.io-client";

const socket = io("https://chess-wdjm.onrender.com", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
