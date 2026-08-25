import { PALETA_EVENTOS } from "./theme";

// Escolhe uma cor estável da paleta a partir do id da tag — a mesma tag de
// evento sempre cai na mesma cor em qualquer tela (Kanban, barra lateral,
// Painel do processo), sem precisar guardar cor no banco.
export function corEvento(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETA_EVENTOS[hash % PALETA_EVENTOS.length];
}
