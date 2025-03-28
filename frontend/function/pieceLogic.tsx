import { PieceColor } from "@/constants/enums";
import { PieceProps } from "@/components/piece";

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rows = [8, 7, 6, 5, 4, 3, 2, 1];

function isSquareEmpty(boardState: PieceProps[], row: number, col: number) {
  return !boardState.some((piece: PieceProps) => piece.position === columns[col] + rows[row]);
}

export const highlightMoves = (row: number, col: number, color: PieceColor, name: string, boardState: PieceProps[]) => {
  console.log("Generating moves for piece:", name);

  const moves = [];
  const direction = color === PieceColor.WHITE ? -1 : 1;
  const initialRow = color === PieceColor.WHITE ? 6 : 1;

  switch (name) {
    case "pawn":
      if (isSquareEmpty(boardState, row + direction, col)) {
        moves.push({ row: row + direction, col });
        if (row === initialRow && isSquareEmpty(boardState, row + 2 * direction, col)) {
          moves.push({ row: row + 2 * direction, col });
        }
      }
      break;

    case "rook":
      for (let i = 1; i <= 7; i++) {
        if (isSquareEmpty(boardState, row + i, col)) moves.push({ row: row + i, col });
        else break;
      }
      for (let i = 1; i <= 7; i++) {
        if (isSquareEmpty(boardState, row - i, col)) moves.push({ row: row - i, col });
        else break;
      }
      for (let j = 1; j <= 7; j++) {
        if (isSquareEmpty(boardState, row, col + j)) moves.push({ row, col: col + j });
        else break;
      }
      for (let j = 1; j <= 7; j++) {
        if (isSquareEmpty(boardState, row, col - j)) moves.push({ row, col: col - j });
        else break;
      }
      break;

    case "bishop":
      for (let i = 1; i <= 7; i++) {
        if (isSquareEmpty(boardState, row + i, col + i)) moves.push({ row: row + i, col: col + i });
        else break;
      }
      for (let i = 1; i <= 7; i++) {
        if (isSquareEmpty(boardState, row + i, col - i)) moves.push({ row: row + i, col: col - i });
        else break;
      }
      for (let i = 1; i <= 7; i++) {
        if (isSquareEmpty(boardState, row - i, col + i)) moves.push({ row: row - i, col: col + i });
        else break;
      }
      for (let i = 1; i <= 7; i++) {
        if (isSquareEmpty(boardState, row - i, col - i)) moves.push({ row: row - i, col: col - i });
        else break;
      }
      break;

    case "queen":
      highlightMoves(row, col, color, "rook", boardState).forEach((move) => moves.push(move));
      highlightMoves(row, col, color, "bishop", boardState).forEach((move) => moves.push(move));
      break;

    case "king":
      if (isSquareEmpty(boardState, row + direction, col)) moves.push({ row: row + direction, col });
      if (isSquareEmpty(boardState, row - direction, col)) moves.push({ row: row - direction, col });
      if (isSquareEmpty(boardState, row - direction, col + direction)) moves.push({ row: row - direction, col: col + direction });
      if (isSquareEmpty(boardState, row - direction, col - direction)) moves.push({ row: row - direction, col: col - direction });
      if (isSquareEmpty(boardState, row, col - direction)) moves.push({ row, col: col - direction });
      if (isSquareEmpty(boardState, row, col + direction)) moves.push({ row, col: col + direction });
      if (isSquareEmpty(boardState, row + direction, col + direction)) moves.push({ row: row + direction, col: col + direction });
      if (isSquareEmpty(boardState, row + direction, col - direction)) moves.push({ row: row + direction, col: col - direction });
      break;

    case "knight":
      if (isSquareEmpty(boardState, row + 1, col + 2)) moves.push({ row: row + 1, col: col + 2 });
      if (isSquareEmpty(boardState, row + 1, col - 2)) moves.push({ row: row + 1, col: col - 2 });
      if (isSquareEmpty(boardState, row - 1, col + 2)) moves.push({ row: row - 1, col: col + 2 });
      if (isSquareEmpty(boardState, row - 1, col - 2)) moves.push({ row: row - 1, col: col - 2 });
      if (isSquareEmpty(boardState, row + 2, col + 1)) moves.push({ row: row + 2, col: col + 1 });
      if (isSquareEmpty(boardState, row + 2, col - 1)) moves.push({ row: row + 2, col: col - 1 });
      if (isSquareEmpty(boardState, row - 2, col + 1)) moves.push({ row: row - 2, col: col + 1 });
      if (isSquareEmpty(boardState, row - 2, col - 1)) moves.push({ row: row - 2, col: col - 1 });
      break;
  }
  return moves;
};
