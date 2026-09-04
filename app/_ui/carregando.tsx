import { cor } from "@/lib/theme";

export default function Carregando() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes crm-girar { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `3px solid ${cor.borda}`,
          borderTopColor: cor.destaque,
          animation: "crm-girar .7s linear infinite",
        }}
      />
    </div>
  );
}
