type Andamento = { id: string; texto: string };

export default function Ocorrencias({ andamentos }: { andamentos: Andamento[] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <strong>Ocorrências</strong>
      {andamentos.length === 0 ? (
        <p style={{ color: "#7D7979", marginTop: 4 }}>Nenhum andamento marcado para inclusão.</p>
      ) : (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {andamentos.map((a) => (
            <p key={a.id} style={{ textAlign: "justify", margin: 0 }}>
              {a.texto}
            </p>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: "#7D7979", marginTop: 4 }}>
        Marcado/editável no painel do processo, seção "Andamentos".
      </p>
    </div>
  );
}
