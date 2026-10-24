import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Exemplo = { nome: string; descricao: string; imagem: string; credito: string; fonte: string };
export type Servico = {
  id: string; nome: string; categoria: string; duracaoMin: number; preco: number; comissaoPct: number; exemplos?: Exemplo[];
};
export type Profissional = { id: string; nome: string; categorias: string[] };
export type Cliente = { id: string; nome: string; telefone?: string };
export type Agendamento = {
  id: string; clienteId: string; servicoId: string; profissionalId: string;
  data: string; hora: string; status: "agendado" | "concluido" | "cancelado";
};
export type Movimento = { id: string; data: string; tipo: "entrada" | "saida"; valor: number; descricao: string; agendamentoId?: string };
export type Dados = {
  horario: { abre: string; fecha: string; diasSemana: number[] };
  servicos: Servico[]; profissionais: Profissional[]; clientes: Cliente[];
  agendamentos: Agendamento[]; caixa: Movimento[];
};

const ARQUIVO = join(process.cwd(), "data", "salao.json");
let dados: Dados | null = null;

export function carregar(): Dados {
  if (!dados) dados = JSON.parse(readFileSync(ARQUIVO, "utf8")) as Dados;
  return dados;
}

// Na Vercel o disco é somente leitura: a alteração fica só em memória.
function salvar(): boolean {
  try {
    writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}

const paraMin = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
const paraHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function listarServicos(categoria?: string, precoMax?: number) {
  const servicos = carregar().servicos.filter(
    (s) => (!categoria || s.categoria === categoria) && (precoMax === undefined || s.preco <= precoMax),
  );
  return { servicos: servicos.map(({ comissaoPct, ...s }) => s) };
}

function livre(profissionalId: string, data: string, inicio: number, fim: number): boolean {
  const d = carregar();
  return !d.agendamentos.some((a) => {
    if (a.profissionalId !== profissionalId || a.data !== data || a.status === "cancelado") return false;
    const s = d.servicos.find((x) => x.id === a.servicoId);
    const ai = paraMin(a.hora);
    return inicio < ai + (s?.duracaoMin ?? 30) && ai < fim;
  });
}

export function consultarHorarios(data: string, servicoId: string) {
  const d = carregar();
  const servico = d.servicos.find((s) => s.id === servicoId);
  if (!servico) throw new Error(`Serviço não encontrado: ${servicoId}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error("Data deve estar no formato AAAA-MM-DD");
  const diaSemana = new Date(`${data}T12:00:00Z`).getUTCDay();
  if (!d.horario.diasSemana.includes(diaSemana)) return { data, servicoId, aberto: false, horarios: [] as string[] };

  const profs = d.profissionais.filter((p) => p.categorias.includes(servico.categoria));
  const horarios: string[] = [];
  for (let m = paraMin(d.horario.abre); m + servico.duracaoMin <= paraMin(d.horario.fecha); m += 30) {
    if (profs.some((p) => livre(p.id, data, m, m + servico.duracaoMin))) horarios.push(paraHora(m));
  }
  return { data, servicoId, aberto: true, horarios };
}

export function agendarHorario(cliente: string, servicoId: string, data: string, hora: string, telefone?: string) {
  const d = carregar();
  const servico = d.servicos.find((s) => s.id === servicoId);
  if (!servico) throw new Error(`Serviço não encontrado: ${servicoId}`);
  if (!consultarHorarios(data, servicoId).horarios.includes(hora)) throw new Error(`Horário indisponível: ${data} ${hora}`);

  const inicio = paraMin(hora);
  const prof = d.profissionais.find(
    (p) => p.categorias.includes(servico.categoria) && livre(p.id, data, inicio, inicio + servico.duracaoMin),
  )!;
  let c = d.clientes.find((x) => x.nome.toLowerCase() === cliente.trim().toLowerCase());
  if (!c) {
    c = { id: `c${d.clientes.length + 1}`, nome: cliente.trim(), telefone };
    d.clientes.push(c);
  }
  const ag: Agendamento = {
    id: `a${d.agendamentos.length + 1}`, clienteId: c.id, servicoId, profissionalId: prof.id, data, hora, status: "agendado",
  };
  d.agendamentos.push(ag);
  return {
    agendamento: { ...ag, cliente: c.nome, servico: servico.nome, profissional: prof.nome, preco: servico.preco },
    persistido: salvar(),
  };
}
