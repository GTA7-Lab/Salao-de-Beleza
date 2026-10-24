// Servidor local: serve public/ e /api/mcp (mesmo handler da Vercel).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GET, POST } from "../api/mcp.ts";

const porta = Number(process.env.PORT ?? 3000);
const tipos: Record<string, string> = { ".html": "text/html; charset=utf-8", ".json": "application/json" };

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${porta}`);
  if (url.pathname === "/api/mcp") {
    let corpo = "";
    for await (const parte of req) corpo += parte;
    const r = req.method === "POST" ? await POST(new Request(url, { method: "POST", body: corpo })) : GET();
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(await r.text());
    return;
  }
  const arquivo = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  try {
    const conteudo = await readFile(join(process.cwd(), "public", arquivo));
    res.writeHead(200, { "Content-Type": tipos[arquivo.slice(arquivo.lastIndexOf("."))] ?? "text/plain" });
    res.end(conteudo);
  } catch {
    res.writeHead(404).end("Não encontrado");
  }
}).listen(porta, () => console.log(`Salão de Beleza em http://localhost:${porta}`));
