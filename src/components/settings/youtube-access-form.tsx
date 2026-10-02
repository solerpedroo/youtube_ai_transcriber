"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_COOKIES_BYTES, validateNetscapeCookies } from "@/lib/youtube/cookies-validate";
import { useYoutubeCookiesStore } from "@/stores/youtube-cookies-store";

export function YoutubeAccessForm() {
  const cookiesText = useYoutubeCookiesStore((state) => state.cookiesText);
  const fileName = useYoutubeCookiesStore((state) => state.fileName);
  const setCookies = useYoutubeCookiesStore((state) => state.setCookies);
  const clearCookies = useYoutubeCookiesStore((state) => state.clearCookies);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_COOKIES_BYTES) {
      setError("O arquivo de cookies excede o tamanho máximo permitido (1 MB).");
      return;
    }

    try {
      const text = await file.text();
      validateNetscapeCookies(text);
      setCookies(text, file.name || "cookies.txt");
      setError(null);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Não foi possível ler o arquivo de cookies.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Envie um <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">cookies.txt</code> no formato Netscape
        apenas para vídeos aos quais você tem acesso. O arquivo fica só nesta sessão do navegador — nunca no
        localStorage — e o servidor apaga a cópia temporária após cada job.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="sr-only"
          onChange={(event) => void handleFile(event)}
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <FileUp className="size-4" />
          {cookiesText ? "Trocar cookies.txt" : "Enviar cookies.txt"}
        </Button>
        {cookiesText && (
          <Button type="button" variant="ghost" onClick={() => { clearCookies(); setError(null); }}>
            <Trash2 className="size-4" />
            Remover da sessão
          </Button>
        )}
      </div>

      {cookiesText && fileName && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
          Cookies carregados nesta sessão: <span className="font-medium">{fileName}</span>
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
