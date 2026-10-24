import { handleMcp } from "../src/mcp.ts";

// Função da Vercel: POST /api/mcp recebe JSON-RPC do MCP.
export async function POST(request: Request): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }, { status: 400 });
  }
  const resposta = handleMcp(body);
  return resposta ? Response.json(resposta) : new Response(null, { status: 202 });
}

// Sem streaming SSE nesta versão.
export function GET(): Response {
  return new Response("Use POST com JSON-RPC (MCP).", { status: 405, headers: { Allow: "POST" } });
}
