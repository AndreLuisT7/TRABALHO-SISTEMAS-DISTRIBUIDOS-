import { Color, PieceType } from '../game/game.models';

// O sufixo ︎ força a versão em texto do símbolo, evitando o peão como emoji.
export const GLYPHS: Record<PieceType, string> = {
  KING: '♚︎',
  QUEEN: '♛︎',
  ROOK: '♜︎',
  BISHOP: '♝︎',
  KNIGHT: '♞︎',
  PAWN: '♟︎',
};

export const PIECE_NAMES: Record<PieceType, string> = {
  KING: 'rei',
  QUEEN: 'dama',
  ROOK: 'torre',
  BISHOP: 'bispo',
  KNIGHT: 'cavalo',
  PAWN: 'peão',
};

export const COLOR_NAMES: Record<Color, string> = {
  WHITE: 'brancas',
  BLACK: 'pretas',
};
