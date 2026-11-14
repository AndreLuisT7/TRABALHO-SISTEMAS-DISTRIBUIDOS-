import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { GameGateway } from './game-gateway';
import {
  Color,
  ConnectionStatus,
  EndReason,
  GameState,
  GatewayError,
  Move,
  opposite,
  Piece,
  PieceType,
  Session,
  Square,
} from './game.models';

const FILES = 'abcdefgh';
const BACK_RANK: PieceType[] = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK'];

function initialPieces(): Record<Square, Piece> {
  const pieces: Record<Square, Piece> = {};
  [...FILES].forEach((file, i) => {
    pieces[`${file}1`] = { type: BACK_RANK[i], color: 'WHITE' };
    pieces[`${file}2`] = { type: 'PAWN', color: 'WHITE' };
    pieces[`${file}7`] = { type: 'PAWN', color: 'BLACK' };
    pieces[`${file}8`] = { type: BACK_RANK[i], color: 'BLACK' };
  });
  return pieces;
}

/**
 * Simulação usada apenas para testar as telas sem servidor.
 * NÃO contém regras de xadrez: aceita qualquer lance das próprias peças e o
 * adversário faz lances sem validação. As regras pertencem ao backend.
 *
 * Atalhos de teste: abrir a página com ?cor=pretas para jogar de pretas, e usar
 * um endereço contendo "offline" para simular falha de conexão.
 */
@Injectable()
export class MockGameGateway extends GameGateway {
  readonly state$ = new Subject<GameState>();
  readonly connection$ = new BehaviorSubject<ConnectionStatus>('DISCONNECTED');

  private state: GameState | null = null;
  private session: Session | null = null;
  private rejectNextMove = false;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  async connect(serverAddress: string, playerName: string): Promise<Session> {
    this.connection$.next('CONNECTING');
    await this.wait(500);
    if (serverAddress.includes('offline')) {
      this.connection$.next('DISCONNECTED');
      throw new GatewayError('CONNECTION_FAILED');
    }

    const asksBlack = new URLSearchParams(window.location.search).get('cor') === 'pretas';
    const color: Color = asksBlack ? 'BLACK' : 'WHITE';
    this.session = { playerId: 'simulado', name: playerName, color };
    this.state = {
      status: 'WAITING',
      version: 1,
      pieces: initialPieces(),
      turn: 'WHITE',
      inCheck: null,
      players: {
        WHITE: color === 'WHITE' ? playerName : null,
        BLACK: color === 'BLACK' ? playerName : null,
      },
      captured: { WHITE: [], BLACK: [] },
      moves: [],
      result: null,
    };
    this.connection$.next('CONNECTED');
    this.publish();
    this.later(() => this.opponentJoins(), 2500);
    return this.session;
  }

  async sendMove(move: Move): Promise<void> {
    await this.wait(250);
    const { state, session } = this.requireGame();
    if (this.rejectNextMove) {
      this.rejectNextMove = false;
      throw new GatewayError('ILLEGAL_MOVE');
    }
    if (state.turn !== session.color) {
      throw new GatewayError('NOT_YOUR_TURN');
    }
    this.apply(move);
    this.later(() => this.opponentMoves(), 900);
  }

  async resign(): Promise<void> {
    await this.wait(200);
    const { session } = this.requireGame();
    this.finish(opposite(session.color), 'RESIGNATION');
  }

  async disconnect(): Promise<void> {
    this.clearTimers();
    this.state = null;
    this.session = null;
    this.rejectNextMove = false;
    this.connection$.next('DISCONNECTED');
  }

  // Comandos do painel de simulação

  simulateRejectedMove(): void {
    this.rejectNextMove = true;
  }

  simulateTemporaryOutage(): void {
    this.connection$.next('RECONNECTING');
    this.later(() => this.connection$.next('CONNECTED'), 4000);
  }

  simulateConnectionLost(): void {
    this.clearTimers();
    this.connection$.next('DISCONNECTED');
  }

  simulateCheck(): void {
    if (this.state?.status === 'IN_PROGRESS') {
      this.state = { ...this.state, inCheck: this.state.turn };
      this.publish();
    }
  }

  simulateEnd(winner: 'ME' | 'OPPONENT' | null, reason: EndReason): void {
    if (!this.session || this.state?.status !== 'IN_PROGRESS') {
      return;
    }
    const mine = this.session.color;
    this.finish(winner === null ? null : winner === 'ME' ? mine : opposite(mine), reason);
  }

  // Internos

  private opponentJoins(): void {
    if (!this.state || !this.session) {
      return;
    }
    const opponent = opposite(this.session.color);
    this.state = {
      ...this.state,
      status: 'IN_PROGRESS',
      players: { ...this.state.players, [opponent]: 'Adversário simulado' },
    };
    this.publish();
    if (opponent === 'WHITE') {
      this.later(() => this.opponentMoves(), 900);
    }
  }

  private opponentMoves(): void {
    if (!this.state || !this.session || this.state.status !== 'IN_PROGRESS') {
      return;
    }
    const color = opposite(this.session.color);
    const candidates = this.opponentCandidates(color);
    if (candidates.length === 0) {
      this.state = { ...this.state, turn: this.session.color };
      this.publish();
      return;
    }
    this.apply(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  /** Empurra um peão para a casa livre à frente; não é uma regra de jogo completa. */
  private opponentCandidates(color: Color): Move[] {
    const pieces = this.state!.pieces;
    const step = color === 'WHITE' ? 1 : -1;
    const moves: Move[] = [];
    for (const [from, piece] of Object.entries(pieces)) {
      const rank = Number(from[1]) + step;
      if (piece.color === color && piece.type === 'PAWN' && rank > 1 && rank < 8) {
        const to = `${from[0]}${rank}`;
        if (!pieces[to]) {
          moves.push({ from, to });
        }
      }
    }
    return moves;
  }

  private apply(move: Move): void {
    const state = this.state!;
    const piece = state.pieces[move.from];
    if (!piece) {
      throw new GatewayError('ILLEGAL_MOVE');
    }
    const target = state.pieces[move.to];
    const pieces = { ...state.pieces };
    delete pieces[move.from];
    pieces[move.to] = move.promotion ? { type: move.promotion, color: piece.color } : piece;

    const captured = { ...state.captured };
    if (target) {
      captured[piece.color] = [...captured[piece.color], target.type];
    }

    this.state = {
      ...state,
      pieces,
      captured,
      turn: opposite(state.turn),
      inCheck: null,
      moves: [
        ...state.moves,
        { ...move, color: piece.color, notation: `${move.from}${target ? 'x' : '-'}${move.to}` },
      ],
    };
    this.publish();
  }

  private finish(winner: Color | null, reason: EndReason): void {
    this.clearTimers();
    this.state = { ...this.state!, status: 'FINISHED', result: { winner, reason } };
    this.publish();
  }

  private requireGame(): { state: GameState; session: Session } {
    if (!this.state || !this.session || this.connection$.value !== 'CONNECTED') {
      throw new GatewayError('CONNECTION_LOST');
    }
    return { state: this.state, session: this.session };
  }

  private publish(): void {
    this.state = { ...this.state!, version: this.state!.version + 1 };
    this.state$.next(this.state);
  }

  private later(action: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.timers.delete(id);
      action();
    }, ms);
    this.timers.add(id);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }
}
