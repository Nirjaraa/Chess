// "use client";
// import React, { useState, useEffect } from "react";
// import { PieceColor, initialBoard } from "@/constants/enums";
// import Piece, { PieceProps } from "@/components/piece";
// import { useSearchParams, useRouter } from "next/navigation";
// import { highlightMoves } from "@/function/pieceLogic";
// import socket from "@/socket/socket";

// const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
// const rows = [8, 7, 6, 5, 4, 3, 2, 1];

// const Page = () => {
//   const router = useRouter();
//   const username = socket.io?.opts?.query?.playerName || "Guest";
//   const searchParams = useSearchParams();
//   const colorParam = searchParams.get("color");
//   const [turn, setTurn] = useState<PieceColor>(PieceColor.WHITE);
//   const [pawnChange, setPawnChange] = useState<{
//     position: string;
//     color: PieceColor;
//     fromPosition: string;
//   } | null>(null);

//   const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
//   const [boardState, setBoardState] = useState(initialBoard);
//   const [selectedPiece, setSelectedPiece] = useState<{
//     row: number;
//     col: number;
//   } | null>(null);
//   const [possibleMoves, setPossibleMoves] = useState<
//     { row: number; col: number; isCapture: boolean }[]
//   >([]);
//   const [whiteInCheck, setWhiteInCheck] = useState(false);
//   const [blackInCheck, setBlackInCheck] = useState(false);
//   const [isCheckmateState, setIsCheckmateState] = useState(false);
//   const [winningColor, setWinningColor] = useState<PieceColor | null>(null);

//   useEffect(() => {
//     console.log("Updated Board State:", boardState);
//   }, [boardState]);

//   useEffect(() => {
//     if (!colorParam) {
//       console.error("No color param found in the URL.");
//       return;
//     }

//     if (colorParam.toLowerCase() === "white") {
//       setPlayerColor(PieceColor.WHITE);
//     } else if (colorParam.toLowerCase() === "black") {
//       setPlayerColor(PieceColor.BLACK);
//     } else {
//       console.error("Invalid color param:", colorParam);
//     }
//   }, [colorParam]);

//   useEffect(() => {
//     if (!socket.connected) socket.connect();

//     socket.on("move", (moveData) => {
//       setBoardState((prev) => {
//         let newState = JSON.parse(JSON.stringify(prev));

//         newState = newState.filter(
//           (p: { position: any }) => p.position !== moveData.toPosition
//         );

//         newState = newState.map(
//           (piece: { position: any; name: any; color: any }) => {
//             if (piece.position === moveData.fromPosition) {
//               return {
//                 ...piece,
//                 position: moveData.toPosition,
//                 name: moveData.newPiece || piece.name,
//                 color: moveData.pieceColor || piece.color,
//               };
//             }
//             return piece;
//           }
//         );

//         console.log("Socket move received:", moveData);
//         console.log(
//           "New board state after socket move:",
//           newState.map(
//             (p: { color: any; name: any; position: any }) =>
//               `${p.color} ${p.name} at ${p.position}`
//           )
//         );

//         const whiteIsInCheck = isKingInCheck(newState, PieceColor.WHITE);
//         const blackIsInCheck = isKingInCheck(newState, PieceColor.BLACK);

//         setWhiteInCheck(whiteIsInCheck);
//         setBlackInCheck(blackIsInCheck);

//         if (whiteIsInCheck && isCheckmate(newState, PieceColor.WHITE)) {
//           setIsCheckmateState(true);
//           setWinningColor(PieceColor.BLACK);
//         } else if (blackIsInCheck && isCheckmate(newState, PieceColor.BLACK)) {
//           setIsCheckmateState(true);
//           setWinningColor(PieceColor.WHITE);
//         }

//         return newState;
//       });
//     });

//     socket.on("turn", ({ turn }) => {
//       setTurn(turn === "WHITE" ? PieceColor.WHITE : PieceColor.BLACK);
//     });

//     return () => {
//       socket.off("move");
//       socket.off("turn");
//     };
//   }, []);

//   const isKingInCheck = (board: PieceProps[], color: PieceColor): boolean => {
//     const { whiteKing, blackKing } = findKings(board);
//     const kingPos = color === PieceColor.WHITE ? whiteKing : blackKing;

//     if (!kingPos) return false;

//     const row = rows.indexOf(Number(kingPos[1]));
//     const col = columns.indexOf(kingPos[0]);

//     for (const piece of board) {
//       if (piece.color === color) continue;

//       const enemyRow = rows.indexOf(Number(piece.position[1]));
//       const enemyCol = columns.indexOf(piece.position[0]);

//       if (enemyRow < 0 || enemyCol < 0) continue;

//       const moves = highlightMoves(
//         enemyRow,
//         enemyCol,
//         piece.color,
//         piece.name,
//         board
//       );

//       if (moves.some((move) => move.row === row && move.col === col)) {
//         return true;
//       }
//     }

//     return false;
//   };

//   const handlePieceClick = (
//     row: number,
//     col: number,
//     color: PieceColor,
//     name: string
//   ) => {
//     if (color !== playerColor || color !== turn) {
//       console.log("Not your turn or not your piece.");
//       return;
//     }

//     if (!color || !name) {
//       return;
//     }

//     const kingInCheck = isKingInCheck(boardState, color);

//     const allPossibleMoves = highlightMoves(row, col, color, name, boardState);

//     const legalMoves = allPossibleMoves.filter((move) => {
//       const simulatedBoard = JSON.parse(JSON.stringify(boardState));
//       const targetPos = columns[move.col] + rows[move.row];
//       const fromPos = columns[col] + rows[row];

//       const boardAfterCapture = simulatedBoard.filter(
//         (p: PieceProps) => p.position !== targetPos
//       );

//       const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
//         if (p.position === fromPos) {
//           return { ...p, position: targetPos };
//         }
//         return p;
//       });

//       return !isKingInCheck(updatedBoard, color);
//     });

//     const finalLegalMoves = legalMoves.filter((move) => {
//       const targetPos = columns[move.col] + rows[move.row];
//       const targetPiece = boardState.find((p) => p.position === targetPos);

//       return !(targetPiece && targetPiece.name === "king");
//     });

//     if (kingInCheck) {
//       const legalMovesInCheck = getLegalMovesInCheck(boardState, color);
//       const currentPosition = columns[col] + rows[row];
//       const pieceWithMoves = legalMovesInCheck.find(
//         (p) => p.piece.position === currentPosition
//       );

//       if (pieceWithMoves) {
//         setPossibleMoves(
//           pieceWithMoves.legalMoves.map((move) => ({
//             ...move,
//             isCapture: move.isCapture ?? false,
//           }))
//         );
//         setSelectedPiece({ row, col });
//       } else {
//         console.log("This piece cannot move while king is in check");
//         setPossibleMoves([]);
//         setSelectedPiece(null);
//       }
//     } else {
//       setPossibleMoves(
//         finalLegalMoves.map((move) => ({
//           ...move,
//           isCapture: move.capture || false,
//         }))
//       );
//       setSelectedPiece({ row, col });
//     }
//   };

//   const movePiece = (position: string) => {
//     if (!selectedPiece || !playerColor) return;

//     const fromPosition = columns[selectedPiece.col] + rows[selectedPiece.row];
//     const piece = boardState.find((p) => p.position === fromPosition);

//     if (!piece) return;

//     const row = rows.indexOf(Number(position[1]));
//     const col = columns.indexOf(position[0]);
//     const moveIsValid = possibleMoves.some(
//       (m) => m.row === row && m.col === col
//     );

//     if (!moveIsValid) {
//       console.log("Invalid move");
//       return;
//     }

//     const targetPiece = boardState.find((p) => p.position === position);
//     const isPawn = piece.name === "pawn";
//     const reachedLastRank =
//       (piece.color === PieceColor.WHITE && row === 0) ||
//       (piece.color === PieceColor.BLACK && row === 7);

//     if (isPawn && reachedLastRank) {
//       setPawnChange({ position, color: piece.color, fromPosition });
//       return;
//     }

//     let newBoardState = JSON.parse(JSON.stringify(boardState));

//     if (targetPiece && targetPiece.color !== piece.color) {
//       newBoardState = newBoardState.filter(
//         (p: { position: string }) => p.position !== position
//       );
//     }

//     newBoardState = newBoardState.map((p: { position: string }) => {
//       if (p.position === fromPosition) {
//         return { ...p, position };
//       }
//       return p;
//     });

//     const opponentColor =
//       piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

//     const whiteIsInCheck = isKingInCheck(newBoardState, PieceColor.WHITE);
//     const blackIsInCheck = isKingInCheck(newBoardState, PieceColor.BLACK);

//     setWhiteInCheck(whiteIsInCheck);
//     setBlackInCheck(blackIsInCheck);

//     if (whiteIsInCheck && isCheckmate(newBoardState, PieceColor.WHITE)) {
//       setIsCheckmateState(true);
//       setWinningColor(PieceColor.BLACK);
//       console.log("Checkmate! Black wins.");
//     } else if (blackIsInCheck && isCheckmate(newBoardState, PieceColor.BLACK)) {
//       setIsCheckmateState(true);
//       setWinningColor(PieceColor.WHITE);
//       console.log("Checkmate! White wins.");
//     } else if (whiteIsInCheck) {
//       console.log("White is in check!");
//     } else if (blackIsInCheck) {
//       console.log("Black is in check!");
//     }

//     setBoardState(newBoardState);

//     socket.emit("move", {
//       fromPosition: fromPosition,
//       toPosition: position,
//       playerColor,
//       pieceColor: piece.color,
//       pieceName: piece.name,
//     });

//     setSelectedPiece(null);
//     setPossibleMoves([]);
//     setTurn(
//       piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE
//     );
//   };

//   const updatePiecePosition = (from: string, to: string, newPiece?: string) => {
//     let newBoardState = [...boardState];

//     newBoardState = newBoardState.filter((p) => p.position !== to);

//     newBoardState = newBoardState.map((p) => {
//       if (p.position === from) {
//         return {
//           ...p,
//           position: to,
//           name: newPiece || p.name,
//         };
//       }
//       return p;
//     });

//     const whiteIsInCheck = isKingInCheck(newBoardState, PieceColor.WHITE);
//     const blackIsInCheck = isKingInCheck(newBoardState, PieceColor.BLACK);

//     setWhiteInCheck(whiteIsInCheck);
//     setBlackInCheck(blackIsInCheck);

//     if (whiteIsInCheck && isCheckmate(newBoardState, PieceColor.WHITE)) {
//       setIsCheckmateState(true);
//       setWinningColor(PieceColor.BLACK);
//     } else if (blackIsInCheck && isCheckmate(newBoardState, PieceColor.BLACK)) {
//       setIsCheckmateState(true);
//       setWinningColor(PieceColor.WHITE);
//     }

//     setBoardState(newBoardState);

//     socket.emit("move", {
//       fromPosition: from,
//       toPosition: to,
//       playerColor,
//       newPiece,
//     });

//     setSelectedPiece(null);
//     setPossibleMoves([]);
//     setTurn((prev) =>
//       prev === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE
//     );
//     setPawnChange(null);
//   };

//   const isCheckmate = (board: PieceProps[], color: PieceColor): boolean => {
//     if (!isKingInCheck(board, color)) return false;

//     for (const piece of board) {
//       if (piece.color !== color) continue;

//       const row = rows.indexOf(Number(piece.position[1]));
//       const col = columns.indexOf(piece.position[0]);

//       if (row < 0 || col < 0) continue;

//       const moves = highlightMoves(row, col, color, piece.name, board);

//       for (const move of moves) {
//         const simulatedBoard = JSON.parse(JSON.stringify(board));
//         const targetPos = columns[move.col] + rows[move.row];
//         const fromPos = piece.position;

//         const boardAfterCapture = simulatedBoard.filter(
//           (p: PieceProps) => p.position !== targetPos
//         );

//         const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
//           if (p.position === fromPos) {
//             return { ...p, position: targetPos };
//           }
//           return p;
//         });

//         if (!isKingInCheck(updatedBoard, color)) {
//           return false;
//         }
//       }
//     }

//     return true;
//   };

//   const restartGame = () => {
//     router.push("/");
//   };

//   const findKings = (board: PieceProps[]) => {
//     let whiteKing = "";
//     let blackKing = "";

//     board.forEach((piece) => {
//       if (piece.name === "king") {
//         if (piece.color === PieceColor.WHITE) {
//           whiteKing = piece.position;
//         } else {
//           blackKing = piece.position;
//         }
//       }
//     });

//     return { whiteKing, blackKing };
//   };

//   const getLegalMovesInCheck = (
//     board: PieceProps[],
//     color: PieceColor
//   ): {
//     piece: PieceProps;
//     legalMoves: { row: number; col: number; isCapture?: boolean }[];
//   }[] => {
//     const legalPiecesWithMoves: {
//       piece: PieceProps;
//       legalMoves: { row: number; col: number; isCapture?: boolean }[];
//     }[] = [];

//     for (const piece of board) {
//       if (piece.color !== color) continue;

//       const row = rows.indexOf(Number(piece.position[1]));
//       const col = columns.indexOf(piece.position[0]);

//       if (row < 0 || col < 0) continue;

//       const possibleMoves = highlightMoves(row, col, color, piece.name, board);

//       const legalMoves = possibleMoves.filter((move) => {
//         const simulatedBoard = JSON.parse(JSON.stringify(board));
//         const targetPos = columns[move.col] + rows[move.row];

//         const boardAfterCapture = simulatedBoard.filter(
//           (p: PieceProps) => p.position !== targetPos
//         );

//         const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
//           if (p.position === piece.position) {
//             return { ...p, position: targetPos };
//           }
//           return p;
//         });

//         return !isKingInCheck(updatedBoard, color);
//       });

//       if (legalMoves.length > 0) {
//         legalPiecesWithMoves.push({
//           piece,
//           legalMoves: legalMoves.map((move) => ({
//             ...move,
//             isCapture: move.capture || false,
//           })),
//         });
//       }
//     }

//     return legalPiecesWithMoves;
//   };

//   const createBoard = () => {
//     const { whiteKing, blackKing } = findKings(boardState);

//     const boardRows =
//       playerColor === PieceColor.BLACK ? [...rows].reverse() : rows;
//     const boardCols =
//       playerColor === PieceColor.BLACK ? [...columns].reverse() : columns;

//     return boardRows.map((row, rowIndex) =>
//       boardCols.map((col, colIndex) => {
//         const position = col + row;
//         const piece = boardState.find((p) => p.position === position);

//         const logicalRowIndex =
//           playerColor === PieceColor.BLACK ? 7 - rowIndex : rowIndex;
//         const logicalColIndex =
//           playerColor === PieceColor.BLACK ? 7 - colIndex : colIndex;

//         const moveInfo = possibleMoves.find(
//           (m) => m.row === logicalRowIndex && m.col === logicalColIndex
//         );
//         const isCapture = moveInfo?.isCapture;

//         let squareColor =
//           (rowIndex + colIndex) % 2 === 0 ? "bg-gray-200" : "bg-gray-800";

//         if (moveInfo) {
//           squareColor = isCapture ? "bg-red-400" : "bg-green-400";
//         } else if (
//           (whiteInCheck && position === whiteKing) ||
//           (blackInCheck && position === blackKing)
//         ) {
//           squareColor = "bg-red-600";
//         }

//         return (
//           <div
//             key={position}
//             id={position}
//             className={`w-full h-full flex items-center justify-center border cursor-pointer ${squareColor} ${
//               (whiteInCheck && position === whiteKing) ||
//               (blackInCheck && position === blackKing)
//                 ? "animate-pulse"
//                 : ""
//             }`}
//             onClick={() =>
//               moveInfo
//                 ? movePiece(position)
//                 : handlePieceClick(
//                     logicalRowIndex,
//                     logicalColIndex,
//                     piece?.color || PieceColor.WHITE,
//                     piece?.name || ""
//                   )
//             }
//           >
//             {piece && (
//               <Piece
//                 name={piece.name}
//                 color={piece.color}
//                 position={piece.position}
//                 onClick={() =>
//                   handlePieceClick(
//                     logicalRowIndex,
//                     logicalColIndex,
//                     piece?.color,
//                     piece?.name || ""
//                   )
//                 }
//               />
//             )}
//           </div>
//         );
//       })
//     );
//   };

//   const isPlayerInCheck =
//     playerColor === PieceColor.WHITE ? whiteInCheck : blackInCheck;

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
//       <h2 className="text-xl font-semibold mt-4 text-center">
//         Player: {username || "Guest"} (
//         {playerColor === PieceColor.WHITE ? "White" : "Black"})
//       </h2>

//       {isPlayerInCheck && !isCheckmateState && (
//         <div className="mb-4 mt-2 text-lg font-bold text-red-600 animate-bounce">
//           YOUR KING IS IN CHECK!
//         </div>
//       )}

//       <h2 className="text-xl font-semibold mb-4 text-center">
//         {turn === PieceColor.WHITE ? "White" : "Black"}'s Turn
//       </h2>

//       <div className="relative">
//         <div
//           className="w-[512px] h-[512px] grid grid-cols-8 grid-rows-8 border-4 border-black rounded-md shadow-lg"
//           style={{
//             gridTemplateColumns: "repeat(8, 1fr)",
//             gridTemplateRows: "repeat(8, 1fr)",
//           }}
//         >
//           {createBoard()}
//         </div>

//         <div className="absolute bottom-[-25px] left-0 right-0 flex justify-around px-2">
//           {(playerColor === PieceColor.BLACK
//             ? [...columns].reverse()
//             : columns
//           ).map((col) => (
//             <div key={col} className="text-sm font-semibold">
//               {col}
//             </div>
//           ))}
//         </div>

//         <div className="absolute top-0 bottom-0 left-[-25px] flex flex-col justify-around">
//           {(playerColor === PieceColor.BLACK ? [...rows].reverse() : rows).map(
//             (row) => (
//               <div key={row} className="text-sm font-semibold">
//                 {row}
//               </div>
//             )
//           )}
//         </div>

//         {pawnChange && (
//           <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg shadow-xl p-6">
//               <h3 className="text-xl font-bold mb-4 text-center">
//                 Choose Promotion
//               </h3>
//               <div className="flex gap-4">
//                 {["queen", "rook", "bishop", "knight"].map((piece) => (
//                   <button
//                     key={piece}
//                     className="w-16 h-16 bg-gray-100 hover:bg-gray-300 border rounded-md flex items-center justify-center text-sm font-medium transition-colors duration-200"
//                     onClick={() =>
//                       updatePiecePosition(
//                         pawnChange.fromPosition,
//                         pawnChange.position,
//                         piece
//                       )
//                     }
//                   >
//                     {piece.charAt(0).toUpperCase() + piece.slice(1)}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {isCheckmateState && (
//           <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center">
//             <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center transform animate-fadeIn">
//               <h2 className="text-4xl font-bold mb-6 text-yellow-600">
//                 CHECKMATE!
//               </h2>
//               <p className="text-2xl font-semibold mb-8">
//                 {winningColor === PieceColor.WHITE ? "White" : "Black"} wins the
//                 game!
//               </p>
//               <button
//                 onClick={restartGame}
//                 className="px-8 py-3 bg-blue-600 text-white rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors duration-200 shadow-md"
//               >
//                 Play Again
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Page;
"use client";
import React, { useState, useEffect, Suspense } from "react";
import { PieceColor, initialBoard } from "@/constants/enums";
import Piece, { PieceProps } from "@/components/piece";
import { useSearchParams, useRouter } from "next/navigation";
import { highlightMoves } from "@/function/pieceLogic";
import socket from "@/socket/socket";

// Loading component to show while the main content is loading
const LoadingBoard = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
    <div className="text-xl font-semibold mb-4">Loading chess board...</div>
    <div className="w-[512px] h-[512px] grid grid-cols-8 grid-rows-8 border-4 border-black rounded-md shadow-lg bg-gray-200 animate-pulse"></div>
  </div>
);

// Main board component that uses search params
const ChessBoard = () => {
  const router = useRouter();
  const username = socket.io?.opts?.query?.playerName || "Guest";
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");
  const [turn, setTurn] = useState<PieceColor>(PieceColor.WHITE);
  const [pawnChange, setPawnChange] = useState<{
    position: string;
    color: PieceColor;
    fromPosition: string;
  } | null>(null);

  const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const rows = [8, 7, 6, 5, 4, 3, 2, 1];

  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [boardState, setBoardState] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<
    { row: number; col: number; isCapture: boolean }[]
  >([]);
  const [whiteInCheck, setWhiteInCheck] = useState(false);
  const [blackInCheck, setBlackInCheck] = useState(false);
  const [isCheckmateState, setIsCheckmateState] = useState(false);
  const [winningColor, setWinningColor] = useState<PieceColor | null>(null);

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

        const whiteIsInCheck = isKingInCheck(newState, PieceColor.WHITE);
        const blackIsInCheck = isKingInCheck(newState, PieceColor.BLACK);

        setWhiteInCheck(whiteIsInCheck);
        setBlackInCheck(blackIsInCheck);

        if (whiteIsInCheck && isCheckmate(newState, PieceColor.WHITE)) {
          setIsCheckmateState(true);
          setWinningColor(PieceColor.BLACK);
        } else if (blackIsInCheck && isCheckmate(newState, PieceColor.BLACK)) {
          setIsCheckmateState(true);
          setWinningColor(PieceColor.WHITE);
        }

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

    if (!kingPos) return false;

    const row = rows.indexOf(Number(kingPos[1]));
    const col = columns.indexOf(kingPos[0]);

    for (const piece of board) {
      if (piece.color === color) continue;

      const enemyRow = rows.indexOf(Number(piece.position[1]));
      const enemyCol = columns.indexOf(piece.position[0]);

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

    const allPossibleMoves = highlightMoves(row, col, color, name, boardState);

    const legalMoves = allPossibleMoves.filter((move) => {
      const simulatedBoard = JSON.parse(JSON.stringify(boardState));
      const targetPos = columns[move.col] + rows[move.row];
      const fromPos = columns[col] + rows[row];

      const boardAfterCapture = simulatedBoard.filter(
        (p: PieceProps) => p.position !== targetPos
      );

      const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
        if (p.position === fromPos) {
          return { ...p, position: targetPos };
        }
        return p;
      });

      return !isKingInCheck(updatedBoard, color);
    });

    const finalLegalMoves = legalMoves.filter((move) => {
      const targetPos = columns[move.col] + rows[move.row];
      const targetPiece = boardState.find((p) => p.position === targetPos);

      return !(targetPiece && targetPiece.name === "king");
    });

    if (kingInCheck) {
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
      setPossibleMoves(
        finalLegalMoves.map((move) => ({
          ...move,
          isCapture: move.capture || false,
        }))
      );
      setSelectedPiece({ row, col });
    }
  };

  const movePiece = (position: string) => {
    if (!selectedPiece || !playerColor) return;

    const fromPosition = columns[selectedPiece.col] + rows[selectedPiece.row];
    const piece = boardState.find((p) => p.position === fromPosition);

    if (!piece) return;

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

    const opponentColor =
      piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    const whiteIsInCheck = isKingInCheck(newBoardState, PieceColor.WHITE);
    const blackIsInCheck = isKingInCheck(newBoardState, PieceColor.BLACK);

    setWhiteInCheck(whiteIsInCheck);
    setBlackInCheck(blackIsInCheck);

    if (whiteIsInCheck && isCheckmate(newBoardState, PieceColor.WHITE)) {
      setIsCheckmateState(true);
      setWinningColor(PieceColor.BLACK);
      console.log("Checkmate! Black wins.");
    } else if (blackIsInCheck && isCheckmate(newBoardState, PieceColor.BLACK)) {
      setIsCheckmateState(true);
      setWinningColor(PieceColor.WHITE);
      console.log("Checkmate! White wins.");
    } else if (whiteIsInCheck) {
      console.log("White is in check!");
    } else if (blackIsInCheck) {
      console.log("Black is in check!");
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

    const whiteIsInCheck = isKingInCheck(newBoardState, PieceColor.WHITE);
    const blackIsInCheck = isKingInCheck(newBoardState, PieceColor.BLACK);

    setWhiteInCheck(whiteIsInCheck);
    setBlackInCheck(blackIsInCheck);

    if (whiteIsInCheck && isCheckmate(newBoardState, PieceColor.WHITE)) {
      setIsCheckmateState(true);
      setWinningColor(PieceColor.BLACK);
    } else if (blackIsInCheck && isCheckmate(newBoardState, PieceColor.BLACK)) {
      setIsCheckmateState(true);
      setWinningColor(PieceColor.WHITE);
    }

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
    if (!isKingInCheck(board, color)) return false;

    for (const piece of board) {
      if (piece.color !== color) continue;

      const row = rows.indexOf(Number(piece.position[1]));
      const col = columns.indexOf(piece.position[0]);

      if (row < 0 || col < 0) continue;

      const moves = highlightMoves(row, col, color, piece.name, board);

      for (const move of moves) {
        const simulatedBoard = JSON.parse(JSON.stringify(board));
        const targetPos = columns[move.col] + rows[move.row];
        const fromPos = piece.position;

        const boardAfterCapture = simulatedBoard.filter(
          (p: PieceProps) => p.position !== targetPos
        );

        const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
          if (p.position === fromPos) {
            return { ...p, position: targetPos };
          }
          return p;
        });

        if (!isKingInCheck(updatedBoard, color)) {
          return false;
        }
      }
    }

    return true;
  };

  const restartGame = () => {
    router.push("/");
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

    for (const piece of board) {
      if (piece.color !== color) continue;

      const row = rows.indexOf(Number(piece.position[1]));
      const col = columns.indexOf(piece.position[0]);

      if (row < 0 || col < 0) continue;

      const possibleMoves = highlightMoves(row, col, color, piece.name, board);

      const legalMoves = possibleMoves.filter((move) => {
        const simulatedBoard = JSON.parse(JSON.stringify(board));
        const targetPos = columns[move.col] + rows[move.row];

        const boardAfterCapture = simulatedBoard.filter(
          (p: PieceProps) => p.position !== targetPos
        );

        const updatedBoard = boardAfterCapture.map((p: PieceProps) => {
          if (p.position === piece.position) {
            return { ...p, position: targetPos };
          }
          return p;
        });

        return !isKingInCheck(updatedBoard, color);
      });

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
    const { whiteKing, blackKing } = findKings(boardState);

    const boardRows =
      playerColor === PieceColor.BLACK ? [...rows].reverse() : rows;
    const boardCols =
      playerColor === PieceColor.BLACK ? [...columns].reverse() : columns;

    return boardRows.map((row, rowIndex) =>
      boardCols.map((col, colIndex) => {
        const position = col + row;
        const piece = boardState.find((p) => p.position === position);

        const logicalRowIndex =
          playerColor === PieceColor.BLACK ? 7 - rowIndex : rowIndex;
        const logicalColIndex =
          playerColor === PieceColor.BLACK ? 7 - colIndex : colIndex;

        const moveInfo = possibleMoves.find(
          (m) => m.row === logicalRowIndex && m.col === logicalColIndex
        );
        const isCapture = moveInfo?.isCapture;

        let squareColor =
          (rowIndex + colIndex) % 2 === 0 ? "bg-gray-200" : "bg-gray-800";

        if (moveInfo) {
          squareColor = isCapture ? "bg-red-400" : "bg-green-400";
        } else if (
          (whiteInCheck && position === whiteKing) ||
          (blackInCheck && position === blackKing)
        ) {
          squareColor = "bg-red-600";
        }

        return (
          <div
            key={position}
            id={position}
            className={`w-full h-full flex items-center justify-center border cursor-pointer ${squareColor} ${
              (whiteInCheck && position === whiteKing) ||
              (blackInCheck && position === blackKing)
                ? "animate-pulse"
                : ""
            }`}
            onClick={() =>
              moveInfo
                ? movePiece(position)
                : handlePieceClick(
                    logicalRowIndex,
                    logicalColIndex,
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
                    logicalRowIndex,
                    logicalColIndex,
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

  const isPlayerInCheck =
    playerColor === PieceColor.WHITE ? whiteInCheck : blackInCheck;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-xl font-semibold mt-4 text-center">
        Player: {username || "Guest"} (
        {playerColor === PieceColor.WHITE ? "White" : "Black"})
      </h2>

      {isPlayerInCheck && !isCheckmateState && (
        <div className="mb-4 mt-2 text-lg font-bold text-red-600 animate-bounce">
          YOUR KING IS IN CHECK!
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4 text-center">
        {turn === PieceColor.WHITE ? "White" : "Black"}'s Turn
      </h2>

      <div className="relative">
        <div
          className="w-[512px] h-[512px] grid grid-cols-8 grid-rows-8 border-4 border-black rounded-md shadow-lg"
          style={{
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
          }}
        >
          {createBoard()}
        </div>

        <div className="absolute bottom-[-25px] left-0 right-0 flex justify-around px-2">
          {(playerColor === PieceColor.BLACK
            ? [...columns].reverse()
            : columns
          ).map((col) => (
            <div key={col} className="text-sm font-semibold">
              {col}
            </div>
          ))}
        </div>

        <div className="absolute top-0 bottom-0 left-[-25px] flex flex-col justify-around">
          {(playerColor === PieceColor.BLACK ? [...rows].reverse() : rows).map(
            (row) => (
              <div key={row} className="text-sm font-semibold">
                {row}
              </div>
            )
          )}
        </div>

        {pawnChange && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-center">
                Choose Promotion
              </h3>
              <div className="flex gap-4">
                {["queen", "rook", "bishop", "knight"].map((piece) => (
                  <button
                    key={piece}
                    className="w-16 h-16 bg-gray-100 hover:bg-gray-300 border rounded-md flex items-center justify-center text-sm font-medium transition-colors duration-200"
                    onClick={() =>
                      updatePiecePosition(
                        pawnChange.fromPosition,
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
          </div>
        )}

        {isCheckmateState && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center transform animate-fadeIn">
              <h2 className="text-4xl font-bold mb-6 text-yellow-600">
                CHECKMATE!
              </h2>
              <p className="text-2xl font-semibold mb-8">
                {winningColor === PieceColor.WHITE ? "White" : "Black"} wins the
                game!
              </p>
              <button
                onClick={restartGame}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors duration-200 shadow-md"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

 const Page = () => {
  return (
    <Suspense fallback={<LoadingBoard />}>
      <ChessBoard />
    </Suspense>
  );
};

export default Page;
