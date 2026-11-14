import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { GameStore } from '../game/game-store';
import {
  Color,
  EndReason,
  opposite,
  PieceType,
  PromotionPiece,
  reachesLastRank,
  Square,
} from '../game/game.models';
import { Board } from './board';
import { COLOR_NAMES, GLYPHS, PIECE_NAMES } from './pieces';

const REASONS: Record<EndReason, string> = {
  CHECKMATE: 'Xeque-mate',
  STALEMATE: 'Empate por afogamento',
  DRAW_AGREEMENT: 'Empate por acordo',
  INSUFFICIENT_MATERIAL: 'Empate por material insuficiente',
  THREEFOLD_REPETITION: 'Empate por repetição de posição',
  FIFTY_MOVES: 'Empate pela regra dos 50 lances',
  RESIGNATION: 'Desistência',
  OPPONENT_DISCONNECTED: 'Abandono por desconexão',
};

@Component({
  selector: 'app-game-screen',
  imports: [Board, NgTemplateOutlet],
  templateUrl: './game-screen.html',
  styleUrl: './game-screen.css',
})
export class GameScreen {
  protected readonly store = inject(GameStore);
  protected readonly promotionOptions: PromotionPiece[] = ['QUEEN', 'ROOK', 'BISHOP', 'KNIGHT'];
  protected readonly pendingPromotion = signal<{ from: Square; to: Square } | null>(null);
  protected readonly confirmingResign = signal(false);

  protected readonly myColor = computed<Color>(() => this.store.session()?.color ?? 'WHITE');
  protected readonly opponentColor = computed(() => opposite(this.myColor()));
  protected readonly lastMove = computed(() => this.store.state()?.moves.at(-1) ?? null);

  protected readonly moveRows = computed(() => {
    const moves = this.store.state()?.moves ?? [];
    const rows: { number: number; white: string; black: string }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      rows.push({
        number: i / 2 + 1,
        white: moves[i].notation,
        black: moves[i + 1]?.notation ?? '',
      });
    }
    return rows;
  });

  protected readonly turnText = computed(() => {
    const state = this.store.state();
    if (!state || state.status !== 'IN_PROGRESS') {
      return 'Partida encerrada';
    }
    if (this.store.connection() !== 'CONNECTED') {
      return 'Sem conexão';
    }
    if (this.store.busy()) {
      return 'Enviando…';
    }
    const inCheck = state.inCheck === state.turn;
    if (this.store.myTurn()) {
      return inCheck ? 'Xeque! Sua vez' : 'Sua vez';
    }
    return `${inCheck ? 'Xeque! ' : ''}Vez de ${state.players[state.turn] ?? 'adversário'}`;
  });

  protected readonly resultTitle = computed(() => {
    const result = this.store.state()?.result;
    if (!result) {
      return '';
    }
    if (result.winner === null) {
      return 'Empate';
    }
    return result.winner === this.myColor() ? 'Você venceu!' : 'Você perdeu';
  });

  protected readonly resultReason = computed(() => {
    const result = this.store.state()?.result;
    return result ? REASONS[result.reason] : '';
  });

  protected glyph(type: PieceType): string {
    return GLYPHS[type];
  }

  protected pieceName(type: PieceType): string {
    return PIECE_NAMES[type];
  }

  protected colorName(color: Color): string {
    return COLOR_NAMES[color];
  }

  protected playerName(color: Color): string {
    return this.store.state()?.players[color] ?? 'Aguardando…';
  }

  protected capturedBy(color: Color): PieceType[] {
    return this.store.state()?.captured[color] ?? [];
  }

  protected capturedLabel(types: PieceType[]): string {
    return types.length
      ? `Capturadas: ${types.map((type) => PIECE_NAMES[type]).join(', ')}`
      : 'Nenhuma peça capturada';
  }

  protected onMove(move: { from: Square; to: Square }): void {
    const piece = this.store.state()?.pieces[move.from];
    if (reachesLastRank(piece, move.to)) {
      this.pendingPromotion.set(move);
    } else {
      void this.store.sendMove(move);
    }
  }

  protected promote(promotion: PromotionPiece): void {
    const move = this.pendingPromotion();
    this.pendingPromotion.set(null);
    if (move) {
      void this.store.sendMove({ ...move, promotion });
    }
  }

  protected resign(): void {
    this.confirmingResign.set(false);
    void this.store.resign();
  }
}
