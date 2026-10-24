// Teste rápido das tools via MCP. Não grava no JSON (usa data futura e restaura o arquivo).
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { handleMcp } from "./mcp.ts";

const original = readFileSync("data/salao.json", "utf8");
const call = (name: string, args: object) =>
  (handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) as any).result;

try {
  const lista = (handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }) as any).result.tools;
  assert.equal(lista.length, 4);
  assert.equal(call("search_services", {}).structuredContent.servicos.length, 8);

  const unhas = call("listar_servicos", { categoria: "unhas" }).structuredContent.servicos;
  assert.equal(unhas.length, 2);

  // Terça 27/10: Ana e Bruno ocupados às 10:00, então corte feminino não cabe às 10:00.
  const h = call("consultar_horarios", { data: "2026-10-27", servicoId: "corte-fem" }).structuredContent;
  assert.ok(h.aberto && !h.horarios.includes("10:00") && h.horarios.includes("09:00"));

  const fechado = call("consultar_horarios", { data: "2026-10-25", servicoId: "corte-fem" }).structuredContent;
  assert.equal(fechado.aberto, false);

  const ag = call("agendar_horario", { cliente: "Teste", servicoId: "escova", data: "2026-10-28", hora: "15:00" });
  assert.equal(ag.structuredContent.agendamento.status, "agendado");
  assert.ok(call("agendar_horario", { cliente: "X", servicoId: "escova", data: "2026-10-25", hora: "15:00" }).isError);

  console.log("OK: todos os testes passaram");
} finally {
  writeFileSync("data/salao.json", original);
}
