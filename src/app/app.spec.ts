import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';
import { GameGateway } from './game/game-gateway';
import { GameStore } from './game/game-store';
import { reachesLastRank } from './game/game.models';
import { MockGameGateway } from './game/mock-game-gateway';

describe('Xadrez em Rede', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [App], providers: appConfig.providers });
  });

  it('abre na tela de conexão', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Xadrez em Rede');
  });

  it('mostra erro quando o servidor não responde', async () => {
    const store = TestBed.inject(GameStore);
    await store.connect('offline:50051', 'Ana');
    expect(store.session()).toBeNull();
    expect(store.error()).toContain('Não foi possível conectar');
  });

  it('mantém o tabuleiro e mostra erro quando o lance é recusado', async () => {
    const store = TestBed.inject(GameStore);
    const mock = TestBed.inject(GameGateway) as MockGameGateway;
    await store.connect('localhost:50051', 'Ana');
    const before = store.state();

    mock.simulateRejectedMove();
    await store.sendMove({ from: 'e2', to: 'e4' });

    expect(store.state()).toBe(before);
    expect(store.error()).toContain('recusou');
    await store.leave();
  });

  it('descarta estado mais antigo do que o atual', async () => {
    const store = TestBed.inject(GameStore);
    const mock = TestBed.inject(GameGateway) as MockGameGateway;
    await store.connect('localhost:50051', 'Ana');
    const current = store.state()!;

    mock.state$.next({ ...current, version: current.version - 1, turn: 'BLACK' });

    expect(store.state()).toBe(current);
    await store.leave();
  });

  it('só pede promoção para peão na última fileira', () => {
    expect(reachesLastRank({ type: 'PAWN', color: 'WHITE' }, 'e8')).toBe(true);
    expect(reachesLastRank({ type: 'PAWN', color: 'BLACK' }, 'e1')).toBe(true);
    expect(reachesLastRank({ type: 'PAWN', color: 'WHITE' }, 'e7')).toBe(false);
    expect(reachesLastRank({ type: 'QUEEN', color: 'WHITE' }, 'e8')).toBe(false);
  });
});
