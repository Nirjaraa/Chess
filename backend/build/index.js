"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var app = (0, express_1.default)();
var server = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
var rooms = {};
io.on("connection", function (socket) {
    var playerName = socket.handshake.query.playerName || "Guest";
    console.log("A user connected:", socket.id, "(".concat(playerName, ")"));
    socket.data.playerName = playerName;
    var roomId;
    for (var id in rooms) {
        if (rooms[id].length < 2) {
            roomId = id;
            rooms[roomId].push(socket);
            socket.join(roomId);
            break;
        }
    }
    if (!roomId) {
        roomId = "room-".concat(Date.now());
        rooms[roomId] = [socket];
        socket.join(roomId);
    }
    var playerColor = rooms[roomId].length === 1 ? "WHITE" : "BLACK";
    socket.emit("player-color", playerColor);
    console.log("player-color", playerColor);
    socket.emit("player-name", playerName);
    console.log("".concat(playerName, " joined ").concat(roomId, " as ").concat(playerColor));
    if (rooms[roomId].length === 2) {
        var _a = rooms[roomId], player1 = _a[0], player2 = _a[1];
        var playerInfo = {
            white: player1.data.playerName,
            black: player2.data.playerName,
        };
        io.to(roomId).emit("player-info", playerInfo);
        player1.emit("start the game", { roomId: roomId, color: "WHITE" });
        player2.emit("start the game", { roomId: roomId, color: "BLACK" });
        console.log("Game started in room: ".concat(roomId));
    }
    socket.on("move", function (movePiece) {
        var roomId = Array.from(socket.rooms).find(function (id) { return id !== socket.id; });
        if (roomId) {
            socket.to(roomId).emit("move", movePiece);
            io.to(roomId).emit("turn", {
                turn: movePiece.playerColor === "WHITE" ? "BLACK" : "WHITE",
            });
            console.log("Move made by ".concat(movePiece.playerName, ":"), movePiece);
        }
        else {
            console.error("Room ID is undefined. Move cannot be emitted.");
        }
    });
    socket.on("disconnect", function () {
        console.log("User disconnected:", socket.id);
        for (var roomId_1 in rooms) {
            rooms[roomId_1] = rooms[roomId_1].filter(function (s) { return s.id !== socket.id; });
            if (rooms[roomId_1].length === 1) {
                var remainingPlayer = rooms[roomId_1][0];
                remainingPlayer.emit("Other player disconnected. Game-over");
            }
            if (rooms[roomId_1].length === 0) {
                delete rooms[roomId_1];
            }
        }
    });
});
server.listen(5000, function () {
    console.log("Socket IO server running on http://localhost:5000");
});
