// Hook de warm-up: "acorda" os microsserviços do Render assim que o frontend
// é carregado. No plano gratuito, os serviços hibernam após ~15 min de
// inatividade e a primeira chamada demora ~50s. Este hook dispara pings em
// paralelo nos bastidores para que, quando o usuário tentar fazer login ou
// navegar, o backend já esteja acordado.
import { useEffect } from "react";

// URLs de health de cada microsserviço.
// Se você renomear os serviços no Render, atualize aqui.
const HEALTH_URLS = [
  "https://biblioflix-gateway.onrender.com/health",
  "https://biblioflix-auth.onrender.com/health",
  "https://biblioflix-catalog.onrender.com/health",
  "https://biblioflix-loan.onrender.com/health",
  "https://biblioflix-fine.onrender.com/health",
  "https://biblioflix-recommendation.onrender.com/health",
];

export function useWarmup() {
  useEffect(() => {
    // Dispara todos os pings uma única vez, sem bloquear a UI.
    // Erros são silenciosos — o objetivo é só acordar o container.
    HEALTH_URLS.forEach((url) => {
      fetch(url, { signal: AbortSignal.timeout(60_000) }).catch(() => {});
    });
  }, []); // [] = executa só na montagem inicial da página
}
