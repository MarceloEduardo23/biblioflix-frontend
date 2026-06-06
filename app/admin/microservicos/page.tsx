"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Gauge,
} from "lucide-react";
import { useLibrary } from "@/contexts/library-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Formato retornado pelo gateway em GET /health/services (relatório §6.5 / PB18).
type ServiceHealth = {
  key: string;
  name: string;
  port: number;
  status: "up" | "down";
  latencyMs: number;
  healthEndpoint: string;
  checkedAt: string;
  error: string | null;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AdminMicroservicosPage() {
  const { currentUser, loading } = useLibrary();
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [gatewayUp, setGatewayUp] = useState<boolean | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin =
    currentUser?.role === "admin";

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("biblioflix_token")
          : null;
      const res = await fetch(`${BASE}/health/services`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Gateway respondeu HTTP ${res.status}`);
      const data = await res.json();
      setGatewayUp(true);
      setServices(data.services ?? []);
      setLastCheck(new Date().toISOString());
    } catch (err) {
      // Se nem o gateway respondeu, ele próprio está fora do ar.
      setGatewayUp(false);
      setServices([]);
      setError(
        err instanceof Error
          ? `Não foi possível contatar o API Gateway em ${BASE}. Ele está rodando? (${err.message})`
          : "Falha ao consultar o gateway."
      );
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  // Auto-atualização a cada 10s (pode ser desligada).
  useEffect(() => {
    if (!isAdmin) return;
    if (autoRefresh) {
      timer.current = setInterval(load, 10000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isAdmin, autoRefresh, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 md:px-12 py-8">
          <p className="text-muted-foreground">Carregando…</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 md:px-12 py-8">
          <div className="max-w-md mx-auto text-center mt-12">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h1 className="text-xl font-semibold">Acesso restrito</h1>
            <p className="text-muted-foreground mt-1">
              Esta área é exclusiva de administradores.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const upCount = services.filter((s) => s.status === "up").length;
  const totalServices = services.length + 1; // + gateway
  const totalUp = upCount + (gatewayUp ? 1 : 0);

  function StatusBadge({ status }: { status: "up" | "down" }) {
    return status === "up" ? (
      <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/30">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        up
      </Badge>
    ) : (
      <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/15 border-red-500/30">
        <XCircle className="h-3.5 w-3.5 mr-1" />
        down
      </Badge>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 md:px-12 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Server className="h-7 w-7" />
                Microsserviços
              </h1>
              <p className="text-muted-foreground mt-1">
                Estado dos serviços em execução
                {lastCheck && (
                  <>
                    {" · "}última verificação{" "}
                    {new Date(lastCheck).toLocaleTimeString("pt-BR")}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh((v) => !v)}
              >
                <Activity className="h-4 w-4 mr-2" />
                Auto {autoRefresh ? "ligado" : "desligado"}
              </Button>
              <Button variant="outline" onClick={load} disabled={fetching}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${fetching ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Gauge className="h-7 w-7 mx-auto mb-2 text-indigo-500" />
                <p className="text-2xl font-bold">
                  {totalUp}/{totalServices}
                </p>
                <p className="text-xs text-muted-foreground">Serviços no ar</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Server className="h-7 w-7 mx-auto mb-2 text-sky-500" />
                <p className="text-2xl font-bold">
                  {gatewayUp === null ? "—" : gatewayUp ? "up" : "down"}
                </p>
                <p className="text-xs text-muted-foreground">API Gateway (8000)</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="pt-6 text-center">
                <Activity className="h-7 w-7 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold">{autoRefresh ? "10s" : "—"}</p>
                <p className="text-xs text-muted-foreground">Intervalo de checagem</p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tabela de serviços (campos sugeridos na §6.5) */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Porta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latência</TableHead>
                    <TableHead>Healthcheck</TableHead>
                    <TableHead>Última verificação</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* O próprio gateway */}
                  <TableRow>
                    <TableCell className="font-medium">API Gateway</TableCell>
                    <TableCell>8000</TableCell>
                    <TableCell>
                      {gatewayUp === null ? (
                        "—"
                      ) : (
                        <StatusBadge status={gatewayUp ? "up" : "down"} />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">/health</TableCell>
                    <TableCell className="text-muted-foreground">
                      {lastCheck
                        ? new Date(lastCheck).toLocaleTimeString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {gatewayUp ? "—" : "Sem resposta do gateway"}
                    </TableCell>
                  </TableRow>

                  {services.map((s) => (
                    <TableRow key={s.key}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.port}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.status === "up" ? `${s.latencyMs} ms` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">/health</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(s.checkedAt).toLocaleTimeString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-red-600 text-sm">
                        {s.error ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {services.length === 0 && gatewayUp && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum serviço retornado pelo gateway.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Dados obtidos de <code>GET {BASE}/health/services</code>, que agrega o{" "}
            <code>/health</code> de cada microsserviço.
          </p>
        </div>
      </main>
    </div>
  );
}
