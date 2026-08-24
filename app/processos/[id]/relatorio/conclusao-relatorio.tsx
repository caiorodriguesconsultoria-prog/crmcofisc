type Conclusao = {
  tipo: "Regular" | "Irregular" | null;
  checks: string[] | null;
  texto: string | null;
  penalidade: string | null;
};

export default function ConclusaoRelatorio({ conclusao }: { conclusao: Conclusao }) {
  return (
    <div style={{ marginTop: 16 }}>
      <strong>Conclusões</strong>
      {!conclusao.tipo ? (
        <p style={{ color: "#7D7979", marginTop: 4 }}>Ainda não definida.</p>
      ) : (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13 }}>Diante do exposto, considerando:</p>
          <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
            {(conclusao.checks ?? []).map((c, i) => (
              <li key={i} style={{ fontSize: 13 }}>
                {c}
              </li>
            ))}
          </ul>
          <p style={{ textAlign: "justify", margin: 0, fontSize: 13 }}>{conclusao.texto}</p>
          <p style={{ textAlign: "justify", margin: "14px 0 0", fontSize: 13 }}>
            É importante ressaltar que a responsabilidade da empresa fornecedora extrapola a
            simples execução do objeto contratado. Mesmo depois de encerrado o prazo de vigência e
            cumpridas as obrigações estipuladas em Contrato, a Contratada responde por qualquer
            desconformidade na qualidade dos produtos fornecidos e pelos compromissos assumidos ao
            longo do Contrato.
          </p>
          {conclusao.penalidade && (
            <p style={{ margin: "8px 0 0", fontSize: 13 }}>
              <strong>Sugestão de penalidade:</strong> {conclusao.penalidade}
            </p>
          )}
        </div>
      )}
      <p style={{ fontSize: 11, color: "#7D7979", marginTop: 4 }}>
        Editável no painel do processo, seção "Conclusões".
      </p>
    </div>
  );
}
