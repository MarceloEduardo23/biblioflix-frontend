"use client";

import Image from "next/image";
import { Clock, BookOpen, Maximize2, X } from "lucide-react";
import type { Book, LoanWithDetails } from "@/lib/types";
import { useLibrary } from "@/contexts/library-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReservationCountdown } from "@/components/reservation-countdown";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BookModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
}

export function BookModal({ book, open, onClose }: BookModalProps) {
  const { currentUser, createLoan, loans, suspendedUntil } = useLibrary();
  const [loanCreated, setLoanCreated] = useState<LoanWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  // Sempre que o modal fechar (ou trocar de livro), garante que o zoom volta ao estado inicial.
  useEffect(() => {
    if (!open) setZoomed(false);
  }, [open]);

  useEffect(() => {
    setZoomed(false);
  }, [book?.id]);

  if (!book) return null;

  const handleLoan = async () => {
    setLoading(true);
    const loan = await createLoan(book.id);
    setLoading(false);
    if (loan) {
      setLoanCreated(loan);
    }
  };

  const handleClose = () => {
    setLoanCreated(null);
    setZoomed(false);
    onClose();
  };

  const myActiveLoans = loans.filter(
    (l) => l.userId === currentUser?.id && l.status !== "returned"
  );
  const alreadyHas = myActiveLoans.some((l) => l.bookId === book.id);
  const reachedLimit = myActiveLoans.length >= 3;
  const isSuspended = !!suspendedUntil;
  const canBorrow =
    !!currentUser && book.availableCopies > 0 && !alreadyHas && !reachedLimit && !isSuspended;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="sr-only">{book.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do livro {book.title} de {book.author}
          </DialogDescription>
        </DialogHeader>

        {loanCreated ? (
          <LoanConfirmation loan={loanCreated} onClose={handleClose} />
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Capa: object-contain para mostrar a capa inteira (sem cortes),
                fundo neutro para diagramar imagens fora da proporção 2:3,
                e clique para ampliar. */}
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label={`Ampliar capa de ${book.title}`}
              className="group relative w-36 mx-auto md:mx-0 md:w-48 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden bg-muted ring-1 ring-border cursor-zoom-in"
            >
              <Image
                src={book.cover}
                alt={`Capa de ${book.title}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 144px, 192px"
                quality={90}
              />
              {/* Indicador de "ampliar" no hover */}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <span className="rounded-full bg-black/60 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-5 w-5" />
                </span>
              </span>
            </button>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{book.title}</h2>
                <p className="text-muted-foreground">{book.author}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">{book.publishedYear}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{book.genre}</span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {book.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ISBN: {book.isbn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">14 dias de empréstimo</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    book.availableCopies > 0
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {book.availableCopies} de {book.totalCopies} disponíveis
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                {!currentUser ? (
                  <p className="text-sm text-muted-foreground">
                    Faça login para realizar empréstimos
                  </p>
                ) : (
                  <Button
                    onClick={handleLoan}
                    disabled={!canBorrow || loading}
                    className="flex-1"
                  >
                    {loading
                      ? "Processando..."
                      : alreadyHas
                      ? "Você já está com este livro"
                      : isSuspended
                      ? `Suspenso até ${suspendedUntil!.toLocaleDateString("pt-BR")}`
                      : reachedLimit
                      ? "Limite de 3 livros atingido"
                      : book.availableCopies > 0
                      ? "Realizar Empréstimo"
                      : "Indisponível"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Visualização ampliada da capa (lightbox). Renderizada via portal no
          document.body para escapar do transform do DialogContent — caso
          contrário um position:fixed ficaria posicionado errado. */}
      <CoverLightbox
        open={zoomed}
        src={book.cover}
        alt={`Capa de ${book.title}`}
        onClose={() => setZoomed(false)}
      />
    </Dialog>
  );
}

function CoverLightbox({
  open,
  src,
  alt,
  onClose,
}: {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}) {
  // Fecha com a tecla Esc — em fase de captura, para fechar apenas o lightbox
  // sem disparar o fechamento do Dialog que está por baixo.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar visualização"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="relative h-full w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="90vw"
          quality={100}
          priority
        />
      </div>
    </div>,
    document.body
  );
}

function LoanConfirmation({
  loan,
  onClose,
}: {
  loan: LoanWithDetails;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6">
      <div className="bg-emerald-500/20 p-4 rounded-full">
        <BookOpen className="h-12 w-12 text-emerald-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Livro reservado!</h2>
        <p className="text-muted-foreground mt-1">
          Você tem 30 minutos para retirar na biblioteca. O atendente vai
          escanear o livro para confirmar a retirada.
        </p>
      </div>

      <div className="bg-secondary/50 rounded-xl px-8 py-5">
        <p className="text-xs text-muted-foreground mb-1">Tempo para retirada</p>
        <ReservationCountdown
          expiresAt={loan.reservationExpiresAt}
          className="text-4xl font-bold tabular-nums text-foreground"
        />
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-foreground">
          <strong>Livro:</strong> {loan.book.title}
        </p>
        <p className="text-foreground">
          <strong>Leitor:</strong> {loan.user.name}
        </p>
      </div>

      <Button onClick={onClose} className="mt-4">
        Fechar
      </Button>
    </div>
  );
}
