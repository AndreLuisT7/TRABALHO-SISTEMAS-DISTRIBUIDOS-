import { computed, inject, Injectable, signal } from '@angular/core';
import { GameGateway } from './game-gateway';
import { ConnectionStatus, GameState, GatewayError, Move, Session } from './game.models';

const ERROR_MESSAGES: Record<string, string> = {
  CONNECTION_FAILED: 'Não foi possível conectar. Confira o endereço e se o servidor está no ar.',
  CONNECTION_LOST: 'A conexão com o servidor caiu. Tente de novo quando ela voltar.',
  ILLEGAL_MOVE: 'O servidor recusou esse lance. Escolha outro.',
  NOT_YOUR_TURN: 'Ainda não é a sua vez.',
  NAME_TAKEN: 'Já existe um jogador com esse nome. Escolha outro.',
  GAME_FULL: 'A partida já tem dois jogadores.',
};
const FALLBACK_ERROR = 'O servidor encontrou um erro. Tente novamente.';

/** Guarda o que a tela exibe. Nunca altera o tabuleiro por conta própria. */
@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly gateway = inject(GameGateway);

  readonly session = signal<Session | null>(null);
  readonly state = signal<GameState | null>(null);
  readonly connection = signal<ConnectionStatus>('DISCONNECTED');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  readonly screen = computed(() => {
    if (!this.session()) {
      return 'connect';
    }
    return (this.state()?.status ?? 'WAITING') === 'WAITING' ? 'lobby' : 'game';
  });

  readonly myTurn = computed(() => {
    const state = this.state();
    return state?.status === 'IN_PROGRESS' && state.turn === this.session()?.color;
  });

  readonly canPlay = computed(
    () => this.myTurn() && this.connection() === 'CONNECTED' && !this.busy(),
  );

  constructor() {
    this.gateway.connection$.subscribe((status) => this.connection.set(status));
    this.gateway.state$.subscribe((next) => {
      const current = this.state();
      if (!current || next.version > current.version) {
        this.state.set(next);
      }
    });
  }

  connect(serverAddress: string, playerName: string): Promise<void> {
    return this.run(async () => {
      this.session.set(await this.gateway.connect(serverAddress, playerName));
    });
  }

  sendMove(move: Move): Promise<void> {
    return this.run(() => this.gateway.sendMove(move));
  }

  resign(): Promise<void> {
    return this.run(() => this.gateway.resign());
  }

  /** Encerra a sessão local e volta para a tela inicial, mesmo sem conexão. */
  async leave(): Promise<void> {
    try {
      await this.gateway.disconnect();
    } catch {
      // A sessão local é descartada de qualquer forma.
    }
    this.session.set(null);
    this.state.set(null);
    this.error.set(null);
    this.busy.set(false);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      const code = error instanceof GatewayError ? error.code : '';
      this.error.set(ERROR_MESSAGES[code] ?? FALLBACK_ERROR);
    } finally {
      this.busy.set(false);
    }
  }
}
