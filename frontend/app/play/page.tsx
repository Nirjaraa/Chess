"use client";
import React, { useState } from "react";
import { PieceColor, initialBoard } from "@/constants/enums";
import Piece from "@/components/piece";
import { highlightMoves } from "@/function/pieceLogic";

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rows = [8, 7, 6, 5, 4, 3, 2, 1];

const Page = () => {
  const [boardState, setBoardState] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{ row: number; col: number }[]>([]);

  const handlePieceClick = (row: number, col: number, color: PieceColor, name: string) => {
    const moves = highlightMoves(row, col, color, name, boardState);
    console.log("Possible moves:", moves);
    setPossibleMoves(moves);
    setSelectedPiece({ row, col });
  };

  const movePiece = (position: string) => {
    if (!selectedPiece) return;

    setBoardState((prev) =>
      prev.map((piece) => {
        if (piece.position === columns[selectedPiece.col] + rows[selectedPiece.row]) {
          return { ...piece, position };
        }
        return piece;
      })
    );

    setSelectedPiece(null);
    setPossibleMoves([]);
  };

  const createBoard = () => {
    return rows.map((row, rowIndex) =>
      columns.map((col, colIndex) => {
        const position = col + row;
        const piece = boardState.find((p) => p.position === position);
        const isHighlighted = possibleMoves.some((m) => m.row === rowIndex && m.col === colIndex);

        return (
          <div
            key={position}
            id={position}
            className={`w-full h-full flex items-center justify-center border cursor-pointer
              ${(rowIndex + colIndex) % 2 === 0 ? "bg-gray-200" : "bg-gray-800"}
              ${isHighlighted ? "bg-red-300" : ""}`}
            onClick={() => (isHighlighted ? movePiece(columns[colIndex] + rows[rowIndex]) : handlePieceClick(rowIndex, colIndex, piece?.color || PieceColor.WHITE, piece?.name || ""))}
          >
            {piece && (
              <Piece
                name={piece.name}
                color={piece.color}
                position={piece.position}
                onClick={() => handlePieceClick(rowIndex, colIndex, piece?.color || PieceColor.WHITE, piece?.name || "")}
              />
            )}
          </div>
        );
      })
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
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
