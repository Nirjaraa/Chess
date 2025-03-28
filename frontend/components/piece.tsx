import React from "react";
import { PieceColor } from "@/constants/enums";

export interface PieceProps {
  name: string;
  color: PieceColor;
  position: string;
  onClick?: () => void;
}

const symbols: Record<string, Record<PieceColor, string>> = {
  rook: { WHITE: "♖", BLACK: "♜" },
  knight: { WHITE: "♘", BLACK: "♞" },
  bishop: { WHITE: "♗", BLACK: "♝" },
  queen: { WHITE: "♕", BLACK: "♛" },
  king: { WHITE: "♔", BLACK: "♚" },
  pawn: { WHITE: "♙", BLACK: "♟" },
};

const Piece: React.FC<PieceProps> = ({ name, color, onClick }) => (
  <span style={{ fontSize: "2rem", color: color === PieceColor.WHITE ? "white" : "black", cursor: "pointer" }} onClick={onClick}>
    {symbols[name]?.[color] || "?"}
  </span>
);

export default Piece;
