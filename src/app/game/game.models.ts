export type Color = 'WHITE' | 'BLACK';
export type PieceType = 'KING' | 'QUEEN' | 'ROOK' | 'BISHOP' | 'KNIGHT' | 'PAWN';
export type PromotionPiece = 'QUEEN' | 'ROOK' | 'BISHOP' | 'KNIGHT';

/** Casa em notação algébrica, de "a1" a "h8". */
export type Square = string;

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
}

export interface PlayedMove extends Move {
  color: Color;
  /** Texto exibido no histórico, definido pelo servidor. */
  notation: string;
}

export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';

export type EndReason =
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'DRAW_AGREEMENT'
  | 'INSUFFICIENT_MATERIAL'
  | 'THREEFOLD_REPETITION'
  | 'FIFTY_MOVES'
  | 'RESIGNATION'
  | 'OPPONENT_DISCONNECTED';

export interface GameResult {
  /** null indica empate. */
  winner: Color | null;
  reason: EndReason;
}

/** Retrato completo da partida. O servidor é a única fonte de verdade. */
export interface GameState {
  status: GameStatus;
  /** Cresce a cada alteração; o cliente descarta estados mais antigos. */
  version: number;
  pieces: Record<Square, Piece>;
  turn: Color;
  inCheck: Color | null;
  players: Record<Color, string | null>;
  /** Peças capturadas por cada cor. */
  captured: Record<Color, PieceType[]>;
  moves: PlayedMove[];
  result: GameResult | null;
}

export interface Session {
  playerId: string;
  name: string;
  color: Color;
}

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export type GatewayErrorCode =
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'ILLEGAL_MOVE'
  | 'NOT_YOUR_TURN'
  | 'NAME_TAKEN'
  | 'GAME_FULL'
  | 'SERVER_ERROR';

export class GatewayError extends Error {
  constructor(
    readonly code: GatewayErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'GatewayError';
  }
}

export function opposite(color: Color): Color {
  return color === 'WHITE' ? 'BLACK' : 'WHITE';
}

/** Só decide se a tela de promoção deve abrir; a validação do lance é do servidor. */
export function reachesLastRank(piece: Piece | undefined, to: Square): boolean {
  if (piece?.type !== 'PAWN') {
    return false;
  }
  return to[1] === (piece.color === 'WHITE' ? '8' : '1');
}
