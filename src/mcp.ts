// Servidor MCP mínimo (JSON-RPC sobre HTTP), sem dependências.
import { agendarHorario, consultarHorarios, listarServicos } from "./salao.ts";

const tools = [
  {
    name: "listar_servicos",
    description: "Lista os serviços do Salão de Beleza com preço (R$) e duração (min). Filtros opcionais.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: { type: "string", enum: ["cabelo", "unhas", "estetica"] },
        precoMax: { type: "number", description: "Preço máximo em R$" },
      },
    },
  },
  {
    // Nome em inglês para o Core da GTA City reconhecer como vitrine (busca sem argumento obrigatório).
    name: "search_services",
    description: "Search the beauty salon services (hair, nails, aesthetics) with price (R$), duration and haircut examples. All filters optional.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: { type: "string", enum: ["cabelo", "unhas", "estetica"] },
        precoMax: { type: "number", description: "Preço máximo em R$" },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "consultar_horarios",
    description: "Retorna os horários livres de um serviço em uma data.",
    inputSchema: {
      type: "object",
      properties: {
        data: { type: "string", description: "AAAA-MM-DD" },
        servicoId: { type: "string", description: "id vindo de listar_servicos" },
      },
      required: ["data", "servicoId"],
    },
  },
  {
    name: "agendar_horario",
    description: "Agenda um serviço para um cliente em um horário livre.",
    inputSchema: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Nome do cliente" },
        servicoId: { type: "string" },
        data: { type: "string", description: "AAAA-MM-DD" },
        hora: { type: "string", description: "HH:MM, vindo de consultar_horarios" },
        telefone: { type: "string" },
      },
      required: ["cliente", "servicoId", "data", "hora"],
    },
  },
];

function chamar(nome: string, a: Record<string, any>): object {
  switch (nome) {
    case "listar_servicos":
    case "search_services": return listarServicos(a.categoria, a.precoMax);
    case "consultar_horarios": return consultarHorarios(a.data, a.servicoId);
    case "agendar_horario": return agendarHorario(a.cliente, a.servicoId, a.data, a.hora, a.telefone);
    default: throw new Error(`Tool desconhecida: ${nome}`);
  }
}

type Req = { jsonrpc: "2.0"; id?: number | string; method: string; params?: any };

/** Retorna a resposta JSON-RPC, ou null para notificações. */
export function handleMcp(req: Req): object | null {
  if (req.id === undefined) return null;
  const ok = (result: object) => ({ jsonrpc: "2.0", id: req.id, result });
  switch (req.method) {
    case "initialize":
      return ok({
        protocolVersion: req.params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "salao-de-beleza", version: "0.1.0" },
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools });
    case "tools/call":
      try {
        const r = chamar(req.params?.name, req.params?.arguments ?? {});
        return ok({ content: [{ type: "text", text: JSON.stringify(r) }], structuredContent: r });
      } catch (e) {
        return ok({ content: [{ type: "text", text: (e as Error).message }], isError: true });
      }
    default:
      return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: `Método não suportado: ${req.method}` } };
  }
}
