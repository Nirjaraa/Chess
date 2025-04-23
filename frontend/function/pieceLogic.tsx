import { PieceColor } from "@/constants/enums";
import { PieceProps } from "@/components/piece";

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rows = [8, 7, 6, 5, 4, 3, 2, 1];

function isSquareEmpty(boardState: PieceProps[], row: number, col: number) {
  return !boardState.some(
    (piece: PieceProps) => piece.position === columns[col] + rows[row]
  );
}

function isInBounds(row: number, col: number) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isOpponentPiece(
  boardState: PieceProps[],
  row: number,
  col: number,
  Color: PieceColor
): boolean {
  const piece = boardState.find(
    (piece) => piece.position === columns[col] + rows[row]
  );
  return piece !== undefined && piece.color !== Color;
}

export const highlightMoves = (
  row: number,
  col: number,
  color: PieceColor,
  name: string,
  boardState: PieceProps[]
) => {
  console.log("Generating moves for piece:", name);

  const moves: { row: number; col: number; capture: boolean }[] = [];
  const direction = color === PieceColor.WHITE ? -1 : 1;
  const initialRow = color === PieceColor.WHITE ? 6 : 1;

  const addMove = (r: number, c: number) => {
    if (!isInBounds(r, c)) return;

    if (isSquareEmpty(boardState, r, c)) {
      moves.push({ row: r, col: c, capture: false });
    } else if (isOpponentPiece(boardState, r, c, color)) {
      moves.push({ row: r, col: c, capture: true });
      return true;
    } else {
      return true;
    }
    return false;
  };

  switch (name) {
    case "pawn":
      if (
        isInBounds(row + direction, col) &&
        isSquareEmpty(boardState, row + direction, col)
      ) {
        moves.push({ row: row + direction, col, capture: false });

        if (
          row === initialRow &&
          isSquareEmpty(boardState, row + 2 * direction, col)
        ) {
          moves.push({ row: row + 2 * direction, col, capture: false });
        }
      }

      for (let offset of [-1, 1]) {
        const targetRow = row + direction;
        const targetCol = col + offset;
        if (
          isInBounds(targetRow, targetCol) &&
          isOpponentPiece(boardState, targetRow, targetCol, color)
        ) {
          moves.push({ row: targetRow, col: targetCol, capture: true });
        }
      }
      break;

    case "rook":
      for (let i = 1; i < 8; i++) {
        if (addMove(row + i, col)) break;
      }
      for (let i = 1; i < 8; i++) {
        if (addMove(row - i, col)) break;
      }
      for (let i = 1; i < 8; i++) {
        if (addMove(row, col + i)) break;
      }
      for (let i = 1; i < 8; i++) {
        if (addMove(row, col - i)) break;
      }
      break;

    case "bishop":
      for (let i = 1; i < 8; i++) {
        if (addMove(row + i, col + i)) break;
      }
      for (let i = 1; i < 8; i++) {
        if (addMove(row + i, col - i)) break;
      }
      for (let i = 1; i < 8; i++) {
        if (addMove(row - i, col + i)) break;
      }
      for (let i = 1; i < 8; i++) {
        if (addMove(row - i, col - i)) break;
      }
      break;

    case "queen":
      highlightMoves(row, col, color, "rook", boardState).forEach((move) =>
        moves.push(move)
      );
      highlightMoves(row, col, color, "bishop", boardState).forEach((move) =>
        moves.push(move)
      );
      break;

    case "king":
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr;
          const c = col + dc;
          if (!isInBounds(r, c)) continue;

          if (isSquareEmpty(boardState, r, c)) {
            moves.push({ row: r, col: c, capture: false });
          } else if (isOpponentPiece(boardState, r, c, color)) {
            moves.push({ row: r, col: c, capture: true });
          }
        }
      }
      break;

    case "knight":
      const knightMoves = [
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
      ];
      knightMoves.forEach(([dr, dc]) => {
        const r = row + dr;
        const c = col + dc;
        if (!isInBounds(r, c)) return;

        if (isSquareEmpty(boardState, r, c)) {
          moves.push({ row: r, col: c, capture: false });
        } else if (isOpponentPiece(boardState, r, c, color)) {
          moves.push({ row: r, col: c, capture: true });
        }
      });
      break;
  }

  return moves;
};


