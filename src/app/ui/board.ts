import { Component, computed, input, output, signal } from '@angular/core';
import { Color, Move, Piece, Square } from '../game/game.models';
import { COLOR_NAMES, GLYPHS, PIECE_NAMES } from './pieces';

const FILES = [...'abcdefgh'];
const RANKS = [...'12345678'];

@Component({
  selector: 'app-board',
  template: `
    <div class="board" role="group" aria-label="Tabuleiro de xadrez">
      @for (square of squares(); track square; let i = $index) {
        @let piece = pieces()[square];
        <button
          type="button"
          class="square"
          [class.dark]="isDark(square)"
          [class.selected]="selected() === square"
          [class.last]="square === lastMove()?.from || square === lastMove()?.to"
          [class.check]="piece?.type === 'KING' && piece?.color === inCheck()"
          [class.movable]="canSelect(piece) || !!selected()"
          [disabled]="!interactive()"
          [attr.aria-label]="describe(square, piece)"
          [attr.aria-pressed]="selected() === square"
          (click)="onSquare(square, piece)"
        >
          @if (i % 8 === 0) {
            <span class="coord rank">{{ square[1] }}</span>
          }
          @if (i >= 56) {
            <span class="coord file">{{ square[0] }}</span>
          }
          @if (piece) {
            <span class="piece" [class.white]="piece.color === 'WHITE'" [class.black]="piece.color === 'BLACK'">
              {{ glyph(piece) }}
            </span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .board {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      width: 100%;
      aspect-ratio: 1;
      border: 6px solid var(--board-frame);
      border-radius: 6px;
      box-shadow: 0 18px 40px rgb(0 0 0 / 45%);
      container-type: inline-size;
    }
    .square {
      position: relative;
      display: grid;
      place-items: center;
      aspect-ratio: 1;
      min-width: 0;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: var(--square-light);
      color: var(--square-dark);
      cursor: default;
    }
    .square.dark { background: var(--square-dark); color: var(--square-light); }
    .square.last { background: #d9c766; }
    .square.dark.last { background: #a9a13f; }
    .square.selected, .square.dark.selected { background: var(--accent); }
    .square.check, .square.dark.check {
      background: radial-gradient(circle, #ff5a4d 25%, #b3261e 85%);
    }
    .square.movable:not(:disabled) { cursor: pointer; }
    .square:focus-visible { outline: 3px solid #fff; outline-offset: -3px; z-index: 1; }
    .square:disabled { opacity: 1; }
    .coord {
      position: absolute;
      font-size: clamp(9px, 2cqw, 13px);
      font-weight: 700;
      line-height: 1;
    }
    .rank { top: 4px; left: 4px; }
    .file { right: 4px; bottom: 4px; }
    .piece {
      font-family: 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif;
      font-size: 9cqw;
      line-height: 1;
      user-select: none;
    }
    .piece.white {
      color: #fffdf6;
      text-shadow: 1px 0 #222, -1px 0 #222, 0 1px #222, 0 -1px #222;
    }
    .piece.black {
      color: #1d1d1f;
      text-shadow: 1px 0 #f0e9d8, -1px 0 #f0e9d8, 0 1px #f0e9d8, 0 -1px #f0e9d8;
    }
  `,
})
export class Board {
  readonly pieces = input.required<Record<Square, Piece>>();
  readonly orientation = input<Color>('WHITE');
  readonly myColor = input.required<Color>();
  readonly interactive = input(false);
  readonly lastMove = input<Move | null>(null);
  readonly inCheck = input<Color | null>(null);
  readonly moveRequested = output<{ from: Square; to: Square }>();

  protected readonly selected = signal<Square | null>(null);

  protected readonly squares = computed(() => {
    const white = this.orientation() === 'WHITE';
    const ranks = white ? [...RANKS].reverse() : RANKS;
    const files = white ? FILES : [...FILES].reverse();
    return ranks.flatMap((rank) => files.map((file) => `${file}${rank}`));
  });

  protected isDark(square: Square): boolean {
    return (FILES.indexOf(square[0]) + RANKS.indexOf(square[1])) % 2 === 0;
  }

  protected canSelect(piece: Piece | undefined): boolean {
    return piece?.color === this.myColor();
  }

  protected glyph(piece: Piece): string {
    return GLYPHS[piece.type];
  }

  protected describe(square: Square, piece: Piece | undefined): string {
    if (!piece) {
      return `${square}, vazia`;
    }
    return `${square}, ${PIECE_NAMES[piece.type]} das ${COLOR_NAMES[piece.color]}`;
  }

  protected onSquare(square: Square, piece: Piece | undefined): void {
    const from = this.selected();
    if (from === square) {
      this.selected.set(null);
    } else if (this.canSelect(piece)) {
      this.selected.set(square);
    } else if (from) {
      this.selected.set(null);
      this.moveRequested.emit({ from, to: square });
    }
  }
}
