"use client";
import React, { useState, useEffect } from "react";
import { PieceColor, initialBoard } from "@/constants/enums";
import Piece, { PieceProps } from "@/components/piece";
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
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmateState, setIsCheckmateState] = useState(false);

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

  const isKingInCheck = (board: PieceProps[], color: PieceColor): boolean => {
    const { whiteKing, blackKing } = findKings(board);
    const kingPos = color === PieceColor.WHITE ? whiteKing : blackKing;

    // If king position isn't found, return false
    if (!kingPos) return false;

    const row = rows.indexOf(Number(kingPos[1]));
    const col = columns.indexOf(kingPos[0]);

    for (const piece of board) {
      if (piece.color === color) continue; // Skip pieces of the same color

      const enemyRow = rows.indexOf(Number(piece.position[1]));
      const enemyCol = columns.indexOf(piece.position[0]);

      // Make sure the piece position is valid
      if (enemyRow < 0 || enemyCol < 0) continue;

      const moves = highlightMoves(
        enemyRow,
        enemyCol,
        piece.color,
        piece.name,
        board
      );

      if (moves.some((move) => move.row === row && move.col === col)) {
        return true;
      }
    }

    return false;
  };

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

    const kingInCheck = isKingInCheck(boardState, color);

    // Get all raw moves for this piece
    const allPossibleMoves = highlightMoves(row, col, color, name, boardState);

    // Filter moves to ensure they are legal (don't leave/keep king in check)
    const legalMoves = allPossibleMoves.filter((move) => {
      // Create a simulated board with this move
      const simulatedBoard = JSON.parse(JSON.stringify(boardState));
      const targetPos = columns[move.col] + rows[move.row];
      const fromPos = columns[col] + rows[row];

      // Remove any captured piece
      const boardAfterCapture = simulatedBoard.filter(
        (p: PieceProps) => p.position !== targetPos
      );

      // Move the piece
      const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
        if (p.position === fromPos) {
          return { ...p, position: targetPos };
        }
        return p;
      });

      // The move is legal if it doesn't leave our king in check
      return !isKingInCheck(updatedBoard, color);
    });

    // Now check if move is capturing opponent's king (should never be allowed)
    const finalLegalMoves = legalMoves.filter((move) => {
      const targetPos = columns[move.col] + rows[move.row];
      const targetPiece = boardState.find((p) => p.position === targetPos);

      // Don't allow capturing an opponent's king
      return !(targetPiece && targetPiece.name === "king");
    });

    if (kingInCheck) {
      // When in check, show moves that get the king out of check
      // These are already filtered by getLegalMovesInCheck
      const legalMovesInCheck = getLegalMovesInCheck(boardState, color);
      const currentPosition = columns[col] + rows[row];
      const pieceWithMoves = legalMovesInCheck.find(
        (p) => p.piece.position === currentPosition
      );

      if (pieceWithMoves) {
        setPossibleMoves(
          pieceWithMoves.legalMoves.map((move) => ({
            ...move,
            isCapture: move.isCapture ?? false,
          }))
        );
        setSelectedPiece({ row, col });
      } else {
        console.log("This piece cannot move while king is in check");
        setPossibleMoves([]);
        setSelectedPiece(null);
      }
    } else {
      // For normal moves, show all legal moves that don't leave king in check
      setPossibleMoves(
        finalLegalMoves.map((move) => ({
          ...move,
          isCapture: move.capture || false,
        }))
      );
      setSelectedPiece({ row, col });
    }
  };
  //   const moves = highlightMoves(row, col, color, name, boardState).map(
  //     (move) => ({
  //       ...move,
  //       isCapture: move.capture || false,
  //     })
  //   );
  //   setPossibleMoves(moves);
  //   setSelectedPiece({ row, col });
  // };

  // Fix the movePiece function to properly update check and checkmate states
  const movePiece = (position: string) => {
    if (!selectedPiece || !playerColor) return;

    const fromPosition = columns[selectedPiece.col] + rows[selectedPiece.row];
    const piece = boardState.find((p) => p.position === fromPosition);

    if (!piece) return;

    // Check if this is a valid move
    const row = rows.indexOf(Number(position[1]));
    const col = columns.indexOf(position[0]);
    const moveIsValid = possibleMoves.some(
      (m) => m.row === row && m.col === col
    );

    if (!moveIsValid) {
      console.log("Invalid move");
      return;
    }

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

    // Get the opponent's color
    const opponentColor =
      piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    // Check if the opponent is in check after our move
    const opponentInCheck = isKingInCheck(newBoardState, opponentColor);

    // Check if it's checkmate
    const opponentInCheckmate =
      opponentInCheck && isCheckmate(newBoardState, opponentColor);

    setIsCheck(opponentInCheck);
    setIsCheckmateState(opponentInCheckmate);

    if (opponentInCheckmate) {
      console.log("Checkmate! " + piece.color + " wins.");
    } else if (opponentInCheck) {
      console.log("Check!");
    }

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

  const isCheckmate = (board: PieceProps[], color: PieceColor): boolean => {
    // If the king is not in check, it can't be checkmate
    if (!isKingInCheck(board, color)) return false;

    // Try all possible moves for all pieces of the checked color
    for (const piece of board) {
      if (piece.color !== color) continue;

      const row = rows.indexOf(Number(piece.position[1]));
      const col = columns.indexOf(piece.position[0]);

      // Skip invalid positions
      if (row < 0 || col < 0) continue;

      const moves = highlightMoves(row, col, color, piece.name, board);

      for (const move of moves) {
        // Create a deep copy of the board for simulation
        const simulatedBoard = JSON.parse(JSON.stringify(board));
        const targetPos = columns[move.col] + rows[move.row];
        const fromPos = piece.position;

        // Remove any captured piece at the target position
        const boardAfterCapture = simulatedBoard.filter(
          (p: PieceProps) => p.position !== targetPos
        );

        // Then move the current piece to the target position
        const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
          if (p.position === fromPos) {
            return { ...p, position: targetPos };
          }
          return p;
        });

        // If this move gets the king out of check, it's not checkmate
        if (!isKingInCheck(updatedBoard, color)) {
          return false;
        }
      }
    }

    // If no move can get the king out of check, it's checkmate
    return true;
  };

  const restartGame = () => {
    setBoardState(initialBoard);
  };

  const findKings = (board: PieceProps[]) => {
    let whiteKing = "";
    let blackKing = "";

    board.forEach((piece) => {
      if (piece.name === "king") {
        if (piece.color === PieceColor.WHITE) {
          whiteKing = piece.position;
        } else {
          blackKing = piece.position;
        }
      }
    });

    return { whiteKing, blackKing };
  };

  const getLegalMovesInCheck = (
    board: PieceProps[],
    color: PieceColor
  ): {
    piece: PieceProps;
    legalMoves: { row: number; col: number; isCapture?: boolean }[];
  }[] => {
    const legalPiecesWithMoves: {
      piece: PieceProps;
      legalMoves: { row: number; col: number; isCapture?: boolean }[];
    }[] = [];

    // For each piece of the right color
    for (const piece of board) {
      if (piece.color !== color) continue;

      const row = rows.indexOf(Number(piece.position[1]));
      const col = columns.indexOf(piece.position[0]);

      if (row < 0 || col < 0) continue;

      // Get all possible moves for this piece
      const possibleMoves = highlightMoves(row, col, color, piece.name, board);

      // For each move, check if it gets the king out of check
      const legalMoves = possibleMoves.filter((move) => {
        // Create a simulated board with this move
        const simulatedBoard = JSON.parse(JSON.stringify(board));
        const targetPos = columns[move.col] + rows[move.row];

        // Remove any captured piece
        const boardAfterCapture = simulatedBoard.filter(
          (p: PieceProps) => p.position !== targetPos
        );

        // Move the piece
        const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
          if (p.position === piece.position) {
            return { ...p, position: targetPos };
          }
          return p;
        });

        // Check if the king is still in check after this move
        return !isKingInCheck(updatedBoard, color);
      });

      // If this piece has legal moves, add it to the list
      if (legalMoves.length > 0) {
        legalPiecesWithMoves.push({
          piece,
          legalMoves: legalMoves.map((move) => ({
            ...move,
            isCapture: move.capture || false,
          })),
        });
      }
    }

    return legalPiecesWithMoves;
  };

  const createBoard = () => {
    // Find which king(s) are in check
    const whiteInCheck = isKingInCheck(boardState, PieceColor.WHITE);
    const blackInCheck = isKingInCheck(boardState, PieceColor.BLACK);
    const { whiteKing, blackKing } = findKings(boardState);

    return rows.map((row, rowIndex) =>
      columns.map((col, colIndex) => {
        const position = col + row;
        const piece = boardState.find((p) => p.position === position);
        const moveInfo = possibleMoves.find(
          (m) => m.row === rowIndex && m.col === colIndex
        );
        const isCapture = moveInfo?.isCapture;

        const currentPos = columns[colIndex] + rows[rowIndex];
        let squareColor =
          (rowIndex + colIndex) % 2 === 0 ? "bg-gray-200" : "bg-gray-800";

        // Check highlighting logic
        if (moveInfo) {
          squareColor = isCapture ? "bg-red-400" : "bg-green-400";
        } else if (
          (whiteInCheck && currentPos === whiteKing) ||
          (blackInCheck && currentPos === blackKing)
        ) {
          squareColor = "bg-red-600";
        }
        // Rest of your code...

        // const squareColor = moveInfo
        //   ? isCapture
        //     ? "bg-red-400"
        //     : "bg-green-400"
        //   : (rowIndex + colIndex) % 2 === 0
        //   ? "bg-gray-200"
        //   : "bg-gray-800";

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
            {isCheckmateState && (
              <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center text-white text-3xl font-bold">
                Checkmate!
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
