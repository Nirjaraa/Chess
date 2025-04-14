"use client";
import React, { useState, useEffect } from "react";
import { PieceColor, initialBoard } from "@/constants/enums";
import Piece from "@/components/piece";
import { useSearchParams } from "next/navigation";
import { highlightMoves } from "@/function/pieceLogic";
import socket from "@/socket/socket";

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rows = [8, 7, 6, 5, 4, 3, 2, 1];

const Page = () => {
  const username = socket.io?.opts?.query?.playerName || "Guest";
  console.log("username:", username);
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");
  const [turn, setTurn] = useState<PieceColor>(PieceColor.WHITE);

  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [boardState, setBoardState] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<
    { row: number; col: number }[]
  >([]);

  useEffect(() => {
    if (!colorParam) {
      console.error("No color param found in the URL.");
      return;
    }

    if (colorParam.toLowerCase() === "white") {
      setPlayerColor(PieceColor.WHITE);
    } else if (colorParam.toLowerCase() === "black") {
      setPlayerColor(PieceColor.BLACK);
    } else {
      console.error("Invalid color param:", colorParam);
    }
  }, [colorParam]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("move", (moveData) => {
      setBoardState((prev) =>
        prev.map((piece) =>
          piece.position === moveData.fromPosition
            ? { ...piece, position: moveData.toPosition }
            : piece
        )
      );
    });

    socket.on("turn", ({ turn }) => {
      setTurn(turn === "WHITE" ? PieceColor.WHITE : PieceColor.BLACK);
    });

    return () => {
      socket.off("move");
      socket.off("turn");
    };
  }, []);

  const handlePieceClick = (
    row: number,
    col: number,
    color: PieceColor,
    name: string
  ) => {
    if (color !== playerColor || color !== turn) {
      console.log("Not your turn or not your piece.");
      return;
    }

    console.log("color:", color);
    console.log("player-color", playerColor);
    if (!color || !name) {
      return;
    }

    if (color !== playerColor) {
      console.log("Can't select opponent's piece");
      return;
    }
    const moves = highlightMoves(row, col, color, name, boardState);

    console.log(1);
    console.log("Possible moves:", moves);
    setPossibleMoves(moves);
    setSelectedPiece({ row, col });
  };

  const movePiece = (position: string) => {
    if (!selectedPiece) return;
    if (!playerColor) {
      console.log("Player color not yet assigned!");
      return;
    }
    const fromPosition = columns[selectedPiece.col] + rows[selectedPiece.row];

    setBoardState((prev) =>
      prev.map((piece) => {
        if (piece.position === fromPosition) {
          return { ...piece, position };
        }
        return piece;
      })
    );

    socket.emit("move", {
      fromPosition,
      toPosition: position,
      playerColor,
    });

    setSelectedPiece(null);
    setPossibleMoves([]);
    setTurn((prev) =>
      prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE
    );
  };

  const restartGame = () => {
    setBoardState(initialBoard);
  };

  const createBoard = () => {
    return rows.map((row, rowIndex) =>
      columns.map((col, colIndex) => {
        const position = col + row;
        const piece = boardState.find((p) => p.position === position);
        const isHighlighted = possibleMoves.some(
          (m) => m.row === rowIndex && m.col === colIndex
        );

        return (
          <div
            key={position}
            id={position}
            className={`w-full h-full flex items-center justify-center border cursor-pointer
              ${(rowIndex + colIndex) % 2 === 0 ? "bg-gray-200" : "bg-gray-800"}
              ${isHighlighted ? "bg-red-300" : ""}`}
            onClick={() =>
              isHighlighted
                ? movePiece(columns[colIndex] + rows[rowIndex])
                : handlePieceClick(
                    rowIndex,
                    colIndex,
                    piece?.color || PieceColor.WHITE,
                    piece?.name || ""
                  )
            }
          >
            {piece && (
              <Piece
                name={piece.name}
                color={piece.color}
                position={piece.position}
                onClick={() =>
                  handlePieceClick(
                    rowIndex,
                    colIndex,
                    piece?.color,
                    piece?.name || ""
                  )
                }
              />
            )}
          </div>
        );
      })
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-semibold mt-4 text-center">
        You are: {username || "Guest"}
      </h2>
      <h2 className="text-xl font-semibold mt-4 text-center">
        Turn: {turn === PieceColor.WHITE ? "White" : "Black"}
      </h2>
      <div
        className="w-[512px] h-[512px] grid grid-cols-8 grid-rows-8 border border-black"
        style={{
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
        }}
      >
        {createBoard()}
      </div>
    </div>
  );
};

export default Page;
