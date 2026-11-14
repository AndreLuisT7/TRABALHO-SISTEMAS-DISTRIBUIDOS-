import { Observable } from 'rxjs';
import { ConnectionStatus, GameState, Move, Session } from './game.models';

/**
 * Único ponto de contato entre a interface e o servidor.
 * Para ligar ao backend real, crie outra implementação desta classe e troque o
 * provider em app.config.ts. Veja frontend/INTEGRACAO.md.
 *
 * Em caso de falha, os métodos rejeitam a Promise com GatewayError.
 */
export abstract class GameGateway {
  /** Emite o estado completo sempre que a partida muda. */
  abstract readonly state$: Observable<GameState>;
  abstract readonly connection$: Observable<ConnectionStatus>;

  abstract connect(serverAddress: string, playerName: string): Promise<Session>;
  abstract sendMove(move: Move): Promise<void>;
  abstract resign(): Promise<void>;
  abstract disconnect(): Promise<void>;
}
