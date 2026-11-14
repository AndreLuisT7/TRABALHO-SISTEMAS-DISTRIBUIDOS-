import { Component, inject } from '@angular/core';
import { GameGateway } from './game/game-gateway';
import { GameStore } from './game/game-store';
import { MockGameGateway } from './game/mock-game-gateway';
import { ConnectScreen } from './ui/connect-screen';
import { GameScreen } from './ui/game-screen';
import { LobbyScreen } from './ui/lobby-screen';
import { SimulationPanel } from './ui/simulation-panel';

@Component({
  selector: 'app-root',
  imports: [ConnectScreen, GameScreen, LobbyScreen, SimulationPanel],
  template: `
    @if (store.session()) {
      @switch (store.connection()) {
        @case ('RECONNECTING') {
          <div class="banner warning" role="status">Conexão instável. Tentando reconectar…</div>
        }
        @case ('DISCONNECTED') {
          <div class="banner danger" role="alert">
            A conexão com o servidor foi perdida.
            <button type="button" (click)="store.leave()">Voltar ao início</button>
          </div>
        }
      }
    }

    @switch (store.screen()) {
      @case ('connect') {
        <app-connect-screen />
      }
      @case ('lobby') {
        <app-lobby-screen />
      }
      @case ('game') {
        <app-game-screen />
      }
    }

    @if (simulated) {
      <app-simulation-panel [active]="store.state()?.status === 'IN_PROGRESS'" />
    }
  `,
  styles: `
    .banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 16px;
      font-weight: 600;
      text-align: center;
    }
    .warning { background: #8a6d1a; color: #fff; }
    .danger { background: #8f2a22; color: #fff; }
  `,
})
export class App {
  protected readonly store = inject(GameStore);
  protected readonly simulated = inject(GameGateway) instanceof MockGameGateway;
}
