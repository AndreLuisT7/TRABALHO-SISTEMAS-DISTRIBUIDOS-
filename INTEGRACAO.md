# Frontend do Xadrez em Rede

Interface em Angular. Por enquanto, ela roda com uma simulação, sem servidor. O backend em Java 21 é responsabilidade da equipe.

## Como rodar

```bash
npm install
npm start
```

Abra http://localhost:4200. Para testar:

- Use o painel **Modo simulação**, no canto da tela, para provocar lance recusado, xeque, queda de conexão e fim de partida.
- Abra `http://localhost:4200/?cor=pretas` para jogar de pretas.
- Use um endereço contendo `offline` para simular falha de conexão.

A simulação **não tem regras de xadrez**: aceita qualquer lance das suas peças, e o adversário apenas avança peões.

Para rodar os testes:

```bash
npm test -- --watch=false
```

## Como ligar ao backend

1. Crie uma classe que estenda `GameGateway` ([game-gateway.ts](src/app/game/game-gateway.ts)) e chame o servidor real.
2. Em [app.config.ts](src/app/app.config.ts), troque `MockGameGateway` por essa classe. O painel de simulação some sozinho.
3. Converta as respostas do servidor para os tipos de [game.models.ts](src/app/game/game.models.ts).

| Método do `GameGateway` | O que a interface espera |
|---|---|
| `connect(endereco, nome)` | Entra na partida e devolve o jogador e a cor dele |
| `sendMove(lance)` | Termina sem erro se o lance foi aceito; rejeita com `GatewayError` se foi recusado |
| `resign()` | Registra a desistência |
| `disconnect()` | Encerra a sessão |
| `state$` | Emite o estado completo da partida a cada mudança, com `version` crescente |
| `connection$` | Emite o estado da conexão, que controla os avisos na tela |

A interface não move peças por conta própria: o tabuleiro só muda quando chega um novo estado por `state$`. Estados com `version` menor ou igual à atual são descartados.

Os erros exibidos ao jogador vêm do campo `code` de `GatewayError`. Os valores possíveis estão em `GatewayErrorCode`.

## Navegador e protocolo

O navegador não consegue chamar Java RMI nem gRPC puro diretamente, e isso precisa entrar na decisão da equipe:

- **gRPC:** use gRPC-Web com um proxy, como o Envoy, entre o navegador e o servidor.
- **JSON-RPC:** é o caminho mais direto a partir do navegador, por HTTP ou WebSocket. A orientação aceita JSON-RPC como RPC.
- **Java RMI:** exige um processo Java intermediário que receba as chamadas do navegador e as repasse por RMI.

O envio de atualizações para `state$` também depende dessa escolha: pode ser por streaming do gRPC, WebSocket ou consultas periódicas (`obterEstadoDoJogo()`).
