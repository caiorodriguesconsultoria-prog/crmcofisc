type Execucao = {
  id: string;
  numero: number;
  quantidade: number;
  unidade: string | null;
  data_prevista: string | null;
  data_entrega: string | null;
};

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
}

function calcularAtraso(dataPrevista: string | null, dataEntrega: string | null) {
  if (!dataPrevista || !dataEntrega) return null;
  const diffMs = new Date(`${dataEntrega}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias);
}

export default function CronogramaRelatorio({ execucoes }: { execucoes: Execucao[] }) {
  const total = execucoes.reduce((soma, e) => soma + Number(e.quantidade), 0);

  return (
    <div style={{ marginTop: 16 }}>
      <strong>Cronograma de entrega</strong>
      <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 6 }}>Parcela</th>
            <th style={{ padding: 6 }}>Quantitativo</th>
            <th style={{ padding: 6 }}>Prazo máximo (até)</th>
            <th style={{ padding: 6 }}>Data de entrega</th>
            <th style={{ padding: 6 }}>Atraso (dias)</th>
          </tr>
        </thead>
        <tbody>
          {execucoes.map((e) => {
            const atraso = calcularAtraso(e.data_prevista, e.data_entrega);
            return (
              <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 6 }}>{e.numero}</td>
                <td style={{ padding: 6 }}>
                  {e.quantidade} {e.unidade ?? ""}
                </td>
                <td style={{ padding: 6 }}>{formatarData(e.data_prevista)}</td>
                <td style={{ padding: 6 }}>{formatarData(e.data_entrega)}</td>
                <td style={{ padding: 6 }}>{atraso ?? "—"}</td>
              </tr>
            );
          })}
          {execucoes.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 6, color: "#7D7979" }}>
                Nenhuma parcela cadastrada.
              </td>
            </tr>
          )}
          {execucoes.length > 0 && (
            <tr style={{ fontWeight: "bold", borderTop: "1px solid #ddd" }}>
              <td style={{ padding: 6 }}>TOTAL</td>
              <td style={{ padding: 6 }}>{total}</td>
              <td style={{ padding: 6 }}></td>
              <td style={{ padding: 6 }}></td>
              <td style={{ padding: 6 }}></td>
            </tr>
          )}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: "#7D7979", marginTop: 4 }}>
        Editável no painel do processo, seção "Cronograma de entregas".
      </p>
    </div>
  );
}
