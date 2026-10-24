# Salão de Beleza (GTA7 Lab)

Entidade da cidade GTA7 Lab: atendimento e gestão de um salão (serviços estéticos). Expõe MCP ao Core Orchestrator.

## JSON (`data/salao.json`)
- `horario`: abre, fecha, diasSemana (0=dom; 2-6 = ter-sáb)
- `servicos`: id, nome, categoria (cabelo|unhas|estetica), duracaoMin, preco, comissaoPct, exemplos? (nome, descricao, imagem, credito, fonte)
- Fotos dos exemplos em `public/img/`, de licença livre (Wikimedia Commons), com crédito no JSON.
- `profissionais`: id, nome, categorias
- `clientes`: id, nome, telefone
- `agendamentos`: id, clienteId, servicoId, profissionalId, data (AAAA-MM-DD), hora (HH:MM), status (agendado|concluido|cancelado)
- `caixa`: id, data, tipo (entrada|saida), valor, descricao, agendamentoId?
- Comissão = preco × comissaoPct dos agendamentos concluídos (ainda não exposta).

## MCP tools (`POST /api/mcp`)
- `listar_servicos(categoria?, precoMax?)`
- `consultar_horarios(data, servicoId)` → horários livres (passo de 30 min)
- `agendar_horario(cliente, servicoId, data, hora, telefone?)`

## Arquivos
- `src/salao.ts` dados e regras · `src/mcp.ts` JSON-RPC/tools · `api/mcp.ts` função Vercel
- `src/server.ts` servidor local · `src/test.ts` testes · `public/` página e `manifest.json`

## Decisões
- Sem dependências de runtime: Node ≥22.18 roda .ts direto (type stripping); MCP implementado à mão (Streamable HTTP, só respostas JSON, sem SSE).
- Imports com `.ts`; `rewriteRelativeImportExtensions` (TypeScript 5.9 em devDependencies) os troca por `.js` no build da Vercel.
- Na Vercel o disco é somente leitura: agendamentos ficam em memória (`persistido: false`).

## Status / próxima tarefa
- Funciona localmente (`npm test`, `npm run dev`) e em https://gta-7-lab.vercel.app (push no `main` republica).
- GitHub: https://github.com/Xaxim80/GTA-7-Lab
- Próximo: registrar `public/manifest.json` no Core Orchestrator.
