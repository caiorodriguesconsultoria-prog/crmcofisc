"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PainelAltoModal({
  maxWidth = 900,
  viewTransitionName,
  topo,
  children,
}: {
  maxWidth?: number;
  viewTransitionName?: string;
  topo: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [router]);

  return (
    <div className="crm-modal-fundo" onClick={() => router.back()}>
      <div
        className="crm-modal-painel"
        style={{
          maxWidth,
          ...(viewTransitionName ? ({ viewTransitionName } as React.CSSProperties) : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crm-modal-topo">
          <div style={{ flex: 1, minWidth: 0 }}>{topo}</div>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(32,31,29,.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flex: "none",
              border: "none",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
        <div className="crm-modal-corpo">{children}</div>
      </div>
    </div>
  );
}
