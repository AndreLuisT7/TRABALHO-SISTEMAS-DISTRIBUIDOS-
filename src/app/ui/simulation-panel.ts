import { Component, inject, input } from '@angular/core';
import { GameGateway } from '../game/game-gateway';
import { MockGameGateway } from '../game/mock-game-gateway';

/** Provoca as situações que o servidor real causaria, para testar as telas. */
@Component({
  selector: 'app-simulation-panel',
  template: `
    <details class="panel">
      <summary>Modo simulação (sem servidor)</summary>
      @if (active()) {
        <div class="actions">
          <button type="button" (click)="mock.simulateRejectedMove()">Recusar próximo lance</button>
          <button type="button" (click)="mock.simulateCheck()">Xeque</button>
          <button type="button" (click)="mock.simulateTemporaryOutage()">Queda temporária</button>
          <button type="button" (click)="mock.simulateConnectionLost()">Perda de conexão</button>
          <button type="button" (click)="mock.simulateEnd('ME', 'CHECKMATE')">Vitória por xeque-mate</button>
          <button type="button" (click)="mock.simulateEnd('OPPONENT', 'CHECKMATE')">Derrota por xeque-mate</button>
          <button type="button" (click)="mock.simulateEnd(null, 'STALEMATE')">Empate</button>
          <button type="button" (click)="mock.simulateEnd('ME', 'OPPONENT_DISCONNECTED')">Adversário caiu</button>
        </div>
      } @else {
        <p>Os testes ficam disponíveis depois de entrar em uma partida.</p>
      }
    </details>
  `,
  styles: `
    .panel {
      position: fixed;
      right: 12px;
      bottom: 12px;
      z-index: 10;
      max-width: min(340px, calc(100vw - 24px));
      padding: 8px 12px;
      border: 1px dashed var(--accent);
      border-radius: 8px;
      background: var(--panel);
      font-size: 13px;
    }
    summary { cursor: pointer; color: var(--accent); font-weight: 600; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
    button { padding: 6px; font-size: 12px; }
    p { margin: 8px 0 0; color: var(--muted); }
  `,
})
export class SimulationPanel {
  readonly active = input(false);
  protected readonly mock = inject(GameGateway) as MockGameGateway;
}
