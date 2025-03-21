"use client";
import React, { useState } from "react";
import { PieceColor, initialBoard } from "@/constants/enums";

const getPieceSymbol = (name: string) => {
  switch (name) {
    case "rook":
      return "♖";
    case "knight":
      return "♘";
    case "bishop":
      return "♗";
    case "queen":
      return "♕";
    case "king":
      return "♔";
    case "pawn":
      return "♙";
    default:
      return "";
  }
};

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rows = [8, 7, 6, 5, 4, 3, 2, 1];

const Page = () => {
  const [boardState, setBoardState] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{ row: number; col: number }[]>([]);

  function isSquareEmpty(row: number, col: number) {
    return !boardState.some((piece) => piece.position === columns[col] + rows[row]);
  }

  const handlePieceClick = (row: number, col: number) => {
    const piece = boardState.find((p) => p.position === columns[col] + rows[row]);
    if (!piece) return;
    setSelectedPiece({ row, col });
    switch (piece.name) {
      case "pawn":
        highlightPawnMoves(row, col, piece.color);
        break;
    }
  };

  const highlightPawnMoves = (row: number, col: number, color: PieceColor) => {
    const moves = [];
    const direction = color === PieceColor.WHITE ? -1 : 1;
    const initialRow = color === PieceColor.WHITE ? 6 : 1;

    if (isSquareEmpty(row + direction, col)) {
      moves.push({ row: row + direction, col });
      if (row == initialRow && isSquareEmpty(row + 2 * direction, col)) {
        moves.push({ row: row + 2 * direction, col });
      }
    }
    setPossibleMoves(moves);
  };

  const movePiece = (row: number, col: number) => {
    if (!selectedPiece) return;
    setBoardState((prev) =>
      prev.map((piece) => {
        if (piece.position === columns[selectedPiece.col] + rows[selectedPiece.row]) {
          return { ...piece, position: columns[col] + rows[row] };
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
            onClick={() => (isHighlighted ? movePiece(rowIndex, colIndex) : handlePieceClick(rowIndex, colIndex))}
          >
            {piece && (
              <span
                style={{
                  fontSize: "2rem",
                  color: piece.color === PieceColor.WHITE ? "white" : "black",
                }}
              >
                {getPieceSymbol(piece.name)}
              </span>
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
