import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { GameGateway } from './game/game-gateway';
import { MockGameGateway } from './game/mock-game-gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Troque MockGameGateway pela implementação real ao ligar o backend.
    { provide: GameGateway, useClass: MockGameGateway },
  ],
};
