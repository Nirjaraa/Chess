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
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");
  const [turn, setTurn] = useState<PieceColor>(PieceColor.WHITE);
  const [pawnChange, setPawnChange] = useState<{
    position: string;
    color: PieceColor;
    fromPosition: string;
  } | null>(null);

  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [boardState, setBoardState] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<
    { row: number; col: number; isCapture: boolean }[]
  >([]);
  useEffect(() => {
    console.log("Updated Board State:", boardState);
  }, [boardState]);

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
      setBoardState((prev) => {
        let newState = JSON.parse(JSON.stringify(prev));

        newState = newState.filter(
          (p: { position: any }) => p.position !== moveData.toPosition
        );

        newState = newState.map(
          (piece: { position: any; name: any; color: any }) => {
            if (piece.position === moveData.fromPosition) {
              return {
                ...piece,
                position: moveData.toPosition,
                name: moveData.newPiece || piece.name,
                color: moveData.pieceColor || piece.color,
              };
            }
            return piece;
          }
        );

        console.log("Socket move received:", moveData);
        console.log(
          "New board state after socket move:",
          newState.map(
            (p: { color: any; name: any; position: any }) =>
              `${p.color} ${p.name} at ${p.position}`
          )
        );

        return newState;
      });
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

    if (!color || !name) {
      return;
    }

    const moves = highlightMoves(row, col, color, name, boardState).map(
      (move) => ({
        ...move,
        isCapture: move.capture || false,
      })
    );
    setPossibleMoves(moves);
    setSelectedPiece({ row, col });
  };

  const movePiece = (position: string) => {
    if (!selectedPiece || !playerColor) return;

    const fromPosition = columns[selectedPiece.col] + rows[selectedPiece.row];
    const row = rows.indexOf(Number(position[1]));
    const col = columns.indexOf(position[0]);
    const piece = boardState.find((p) => p.position === fromPosition);

    if (!piece) return;

    const targetPiece = boardState.find((p) => p.position === position);
    const isPawn = piece.name === "pawn";
    const reachedLastRank =
      (piece.color === PieceColor.WHITE && row === 0) ||
      (piece.color === PieceColor.BLACK && row === 7);

    if (isPawn && reachedLastRank) {
      setPawnChange({ position, color: piece.color, fromPosition });
      return;
    }

    let newBoardState = JSON.parse(JSON.stringify(boardState));

    if (targetPiece && targetPiece.color !== piece.color) {
      newBoardState = newBoardState.filter(
        (p: { position: string }) => p.position !== position
      );
    }

    newBoardState = newBoardState.map((p: { position: string }) => {
      if (p.position === fromPosition) {
        return { ...p, position };
      }
      return p;
    });

    console.log(
      "After move - pieces:",
      newBoardState.map(
        (p: { color: any; name: any; position: any }) =>
          `${p.color} ${p.name} at ${p.position}`
      )
    );

    setBoardState(newBoardState);

    socket.emit("move", {
      fromPosition: fromPosition,
      toPosition: position,
      playerColor,
      pieceColor: piece.color,
      pieceName: piece.name,
    });

    setSelectedPiece(null);
    setPossibleMoves([]);
    setTurn(
      piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE
    );
  };
  const updatePiecePosition = (from: string, to: string, newPiece?: string) => {
    let newBoardState = [...boardState];

    newBoardState = newBoardState.filter((p) => p.position !== to);

    newBoardState = newBoardState.map((p) => {
      if (p.position === from) {
        return {
          ...p,
          position: to,
          name: newPiece || p.name,
        };
      }
      return p;
    });

    setBoardState(newBoardState);

    socket.emit("move", {
      fromPosition: from,
      toPosition: to,
      playerColor,
      newPiece,
    });

    setSelectedPiece(null);
    setPossibleMoves([]);
    setTurn((prev) =>
      prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE
    );
    setPawnChange(null);
  };

  const restartGame = () => {
    setBoardState(initialBoard);
  };

  const createBoard = () => {
    return rows.map((row, rowIndex) =>
      columns.map((col, colIndex) => {
        const position = col + row;
        const piece = boardState.find((p) => p.position === position);
        const moveInfo = possibleMoves.find(
          (m) => m.row === rowIndex && m.col === colIndex
        );

        const isCapture = moveInfo?.isCapture;
        const squareColor = moveInfo
          ? isCapture
            ? "bg-red-400"
            : "bg-green-400"
          : (rowIndex + colIndex) % 2 === 0
          ? "bg-gray-200"
          : "bg-gray-800";

        return (
          <div
            key={position}
            id={position}
            className={`w-full h-full flex items-center justify-center border cursor-pointer ${squareColor}`}
            onClick={() =>
              moveInfo
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
            {pawnChange && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                  {["queen", "rook", "bishop", "knight"].map((piece) => (
                    <button
                      key={piece}
                      className="w-16 h-16 bg-gray-100 hover:bg-gray-300 border rounded-md flex items-center justify-center text-sm font-medium"
                      onClick={() =>
                        updatePiecePosition(
                          columns[selectedPiece!.col] +
                            rows[selectedPiece!.row],
                          pawnChange.position,
                          piece
                        )
                      }
                    >
                      {piece.charAt(0).toUpperCase() + piece.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
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
