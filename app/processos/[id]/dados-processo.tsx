import CartaoColapsavel from "@/app/_ui/cartao-colapsavel";
import { LinhaChave } from "@/app/_ui/campo";

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "não informado";
}

function formatarMoeda(valor: number | null) {
  return valor != null ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "não informado";
}

export default function DadosProcesso({
  quantidadeContratada,
  numeroExecucoes,
  dataAssinatura,
  vigenciaInicio,
  vigenciaFim,
  formaEntrega,
  naturezaDespesa,
  valorGlobal,
}: {
  quantidadeContratada: string | null;
  numeroExecucoes: number;
  dataAssinatura: string | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  formaEntrega: string;
  naturezaDespesa: string | null;
  valorGlobal: number | null;
}) {
  return (
    <CartaoColapsavel titulo="Dados do Processo">
      <LinhaChave label="Quantidade total" valor={quantidadeContratada ?? "não informado"} />
      <LinhaChave label="Nº de execuções" valor={String(numeroExecucoes)} />
      <LinhaChave label="Assinatura do contrato" valor={formatarData(dataAssinatura)} />
      <LinhaChave label="Vigência" valor={`${formatarData(vigenciaInicio)} a ${formatarData(vigenciaFim)}`} />
      <LinhaChave label="Forma de entrega" valor={formaEntrega} />
      <LinhaChave label="Natureza de despesa" valor={naturezaDespesa ?? "não informado"} />
      <LinhaChave label="Valor global" valor={formatarMoeda(valorGlobal)} />
    </CartaoColapsavel>
  );
}
