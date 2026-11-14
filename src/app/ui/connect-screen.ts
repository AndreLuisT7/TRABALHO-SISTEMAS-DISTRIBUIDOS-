import { Component, inject, signal } from '@angular/core';
import { GameStore } from '../game/game-store';

@Component({
  selector: 'app-connect-screen',
  template: `
    <main class="center">
      <form class="card stack" (submit)="submit($event)">
        <div>
          <span class="brand-mark" aria-hidden="true">♞&#xFE0E;</span>
          <h1>Xadrez em Rede</h1>
          <p class="muted">Conecte-se ao servidor para entrar em uma partida.</p>
        </div>

        <label class="field">
          Seu nome
          <input
            autofocus
            maxlength="20"
            autocomplete="nickname"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
          />
        </label>

        <label class="field">
          Endereço do servidor
          <input
            spellcheck="false"
            [value]="address()"
            (input)="address.set($any($event.target).value)"
          />
        </label>

        @if (store.error(); as error) {
          <p class="alert" role="alert">{{ error }}</p>
        }

        <button class="primary" type="submit" [disabled]="!canSubmit()">
          {{ store.busy() ? 'Conectando…' : 'Entrar na partida' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    .brand-mark { font-size: 44px; line-height: 1; color: var(--accent); }
    h1 { margin: 4px 0; }
    p { margin: 0; }
    .card { width: min(420px, 100%); }
  `,
})
export class ConnectScreen {
  protected readonly store = inject(GameStore);
  protected readonly name = signal('');
  protected readonly address = signal('localhost:50051');

  protected canSubmit(): boolean {
    return !this.store.busy() && !!this.name().trim() && !!this.address().trim();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.canSubmit()) {
      void this.store.connect(this.address().trim(), this.name().trim());
    }
  }
}
