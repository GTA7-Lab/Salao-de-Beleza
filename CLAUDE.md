# Salão de Beleza (GTA7 Lab)

Entidade da cidade GTA7 Lab: atendimento e gestão de um salão (serviços estéticos). Expõe MCP ao Core Orchestrator.

## JSON (`data/salao.json`)
- `horario`: abre, fecha, diasSemana (0=dom; 2-6 = ter-sáb)
- `servicos`: id, nome, categoria (cabelo|unhas|estetica), duracaoMin, preco, comissaoPct
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
- Sem dependências: Node ≥22.18 roda .ts direto (type stripping); MCP implementado à mão (Streamable HTTP, só respostas JSON, sem SSE).
- Na Vercel o disco é somente leitura: agendamentos ficam em memória (`persistido: false`).

## Status / próxima tarefa
- Código escrito. Próximo: instalar Node e Git, rodar `npm test` e `npm run dev`, depois GitHub e Vercel.
