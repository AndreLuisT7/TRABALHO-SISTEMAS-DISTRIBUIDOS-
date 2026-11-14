import { Component, inject } from '@angular/core';
import { GameStore } from '../game/game-store';
import { COLOR_NAMES } from './pieces';

@Component({
  selector: 'app-lobby-screen',
  template: `
    <main class="center">
      <section class="card stack lobby" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <h1>Aguardando adversário</h1>
        @if (store.session(); as session) {
          <p class="muted">
            {{ session.name }}, você jogará de <strong>{{ colorName(session.color) }}</strong>.
            A partida começa quando outro jogador entrar.
          </p>
        }
        <button type="button" (click)="store.leave()">Cancelar</button>
      </section>
    </main>
  `,
  styles: `
    .lobby { width: min(420px, 100%); text-align: center; align-items: center; }
    h1, p { margin: 0; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--line);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 4s; } }
  `,
})
export class LobbyScreen {
  protected readonly store = inject(GameStore);
  protected readonly colorName = (color: 'WHITE' | 'BLACK') => COLOR_NAMES[color];
}
