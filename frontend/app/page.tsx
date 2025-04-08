"use client";

import React, { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "@/socket/socket";

const Page = () => {
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    socket.on("start the game", (roomId: string) => {
      console.log("Redirecting to /play for room:", roomId);
      router.push(`/play?roomId=${roomId}`);
    });

    return () => {
      socket.off("start the game");
    };
  }, []);

  const handleJoinButton = () => {
    if (playerName.trim()) {
      socket.connect();
      setJoining(true);
      socket.emit("joinroom", playerName.trim());
    } else {
      alert("Please enter your username");
    }
  };

  const squares: JSX.Element[] = [];
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8);
    const lightSquare = (row + i) % 2 === 0;
    squares.push(
      <div
        key={i}
        className={`w-full h-full ${
          lightSquare ? "bg-yellow-100" : "bg-yellow-900"
        }`}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="w-64 h-64 grid grid-cols-8 grid-rows-8">{squares}</div>
      <div className="text-5xl font-bold text-center p-5">
        Want to play Chess?
      </div>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter your username"
        className="px-4 py-2 border border-yellow-700 rounded-lg text-lg"
      />
      {joining && (
        <div className="text-sm font-semibold px-6 py-3 text-gray-600">
          Joining as {playerName}. Please wait a moment...
        </div>
      )}
      <button
        onClick={handleJoinButton}
        className="text-2xl font-semibold px-6 py-3 text-white bg-yellow-700 rounded-lg hover:bg-yellow-800"
      >
        Join room
      </button>
    </div>
  );
};

export default Page;
