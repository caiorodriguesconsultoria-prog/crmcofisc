type Execucao = {
  id: string;
  numero: number;
  quantidade: number;
  unidade: string | null;
  data_prevista: string | null;
};

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
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
          </tr>
        </thead>
        <tbody>
          {execucoes.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 6 }}>{e.numero}</td>
              <td style={{ padding: 6 }}>
                {e.quantidade} {e.unidade ?? ""}
              </td>
              <td style={{ padding: 6 }}>{formatarData(e.data_prevista)}</td>
            </tr>
          ))}
          {execucoes.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 6, color: "#7D7979" }}>
                Nenhuma parcela cadastrada.
              </td>
            </tr>
          )}
          {execucoes.length > 0 && (
            <tr style={{ fontWeight: "bold", borderTop: "1px solid #ddd" }}>
              <td style={{ padding: 6 }}>TOTAL</td>
              <td style={{ padding: 6 }}>{total}</td>
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
