"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cor, raio } from "@/lib/theme";
import FundoLogin from "./_fundo";

// Tela de login — referência visual aprovada pelo Caio (mockup): fundo azul
// perolado com esferas 3D, janela de vidro translúcida assimétrica (desktop:
// identidade à esquerda, formulário à direita; mobile: formulário centralizado).
// Authentication Blueprint (documentado em app/login/CONHECIMENTO.md):
// o painel de vidro reaproveita a classe de produção já aprovada
// `.crm-cartao-vidro-claro` (app/globals.css, com fallback de
// prefers-reduced-transparency já embutido) — não inventa um novo material,
// e não usa o sistema experimental de app/design-lab/_glass (laboratório,
// não é produto). Toda a lógica de autenticação abaixo (handleSubmit,
// entrarComGoogle, estados de erro/carregando) é EXATAMENTE a mesma de
// antes — só a camada visual mudou.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(
    searchParams.get("erro") === "google" ? "Não deu pra entrar com o Google. Tente de novo." : null,
  );
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const reduzido = useReducedMotion();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function entrarComGoogle() {
    setErro(null);
    setCarregandoGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setCarregandoGoogle(false);
      setErro("Não deu pra iniciar o login com Google.");
    }
    // em caso de sucesso o navegador é redirecionado pro Google — não sobra
    // nada pra fazer aqui.
  }

  const campoEstilo: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: raio.campo,
    border: `1px solid ${cor.borda}`,
    background: "rgba(255,255,255,.7)",
    fontSize: 13.5,
    color: cor.texto,
    boxSizing: "border-box",
  };

  return (
    <main style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflow: "hidden" }}>
      <FundoLogin />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1040,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
          flexWrap: "wrap",
        }}
      >
        {/* Identidade — some no mobile (formulário centralizado, pedido do Caio) */}
        <motion.div
          initial={reduzido ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="crm-login-identidade"
          style={{ flex: "1 1 320px", maxWidth: 420 }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: cor.destaque, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>COFISC</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1B2A52", lineHeight: 1.15 }}>Gestão inteligente.</h1>
          <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "#4A5A82" }}>Seus contratos em um único ambiente.</p>
        </motion.div>

        {/* Janela de vidro — reaproveita .crm-cartao-vidro-claro (produção) */}
        <motion.div
          initial={reduzido ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: reduzido ? 0 : 0.08 }}
          className="crm-cartao-vidro-claro"
          style={{ flex: "0 1 380px", width: "100%", maxWidth: "min(380px, 100%)", borderRadius: raio.painel, padding: "32px 28px" }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(160deg, #3A6FDB, #2347A8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              marginBottom: 14,
              boxShadow: "0 6px 16px rgba(47,95,219,.35)",
            }}
          >
            <BarChart3 size={22} />
          </div>

          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: cor.texto }}>CRM-COFISC</h2>
          <p style={{ margin: "2px 0 20px", fontSize: 13, color: cor.textoTerciario }}>Bem-vindo de volta</p>

          <button
            type="button"
            onClick={entrarComGoogle}
            disabled={carregandoGoogle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 14px",
              border: `1px solid ${cor.borda}`,
              borderRadius: raio.pilula,
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              color: cor.texto,
              cursor: carregandoGoogle ? "default" : "pointer",
              opacity: carregandoGoogle ? 0.7 : 1,
              boxSizing: "border-box",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4C41.8 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"
              />
            </svg>
            {carregandoGoogle ? "Redirecionando..." : "Continuar com Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, color: cor.textoTerciario, fontSize: 11.5, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: cor.borda }} />
            ou
            <div style={{ flex: 1, height: 1, background: cor.borda }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="login-email" style={{ display: "block", fontSize: 12, fontWeight: 600, color: cor.textoSecundario, marginBottom: 5 }}>
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={campoEstilo}
              />
            </div>

            <div>
              <label htmlFor="login-senha" style={{ display: "block", fontSize: 12, fontWeight: 600, color: cor.textoSecundario, marginBottom: 5 }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...campoEstilo, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  style={{
                    position: "absolute",
                    right: 2,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 40,
                    height: 40,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: cor.textoTerciario,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {erro && (
              <motion.p
                initial={reduzido ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: cor.urgente, fontSize: 12.5, margin: 0 }}
              >
                {erro}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={carregando}
              whileTap={reduzido ? undefined : { scale: 0.98 }}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: raio.pilula,
                border: "none",
                background: "linear-gradient(135deg, #3A6FDB, #2347A8)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: carregando ? "default" : "pointer",
                opacity: carregando ? 0.8 : 1,
                boxShadow: "0 10px 24px rgba(47,95,219,.35)",
                boxSizing: "border-box",
              }}
            >
              {carregando ? "Entrando..." : "Acessar sistema"}
            </motion.button>
          </form>

          <p style={{ textAlign: "center", fontSize: 11, color: cor.textoTerciario, margin: "18px 0 0" }}>Ambiente de acesso restrito</p>
        </motion.div>
      </div>
    </main>
  );
}
