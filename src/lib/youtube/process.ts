import { spawn } from "node:child_process";
import { AppError, type ApiErrorCode } from "@/lib/utils/errors";

export type ProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type RunProcessOptions = {
  timeoutMs?: number;
  maxOutputBytes?: number;
  cwd?: string;
  unavailableCode?: "YTDLP_UNAVAILABLE" | "PROCESS_UNAVAILABLE" | "FFMPEG_UNAVAILABLE";
  failureCode?: ApiErrorCode;
  failureMessage?: string;
};

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

function unavailableMessage(code: NonNullable<RunProcessOptions["unavailableCode"]>): string {
  if (code === "YTDLP_UNAVAILABLE") return "yt-dlp não está instalado no servidor.";
  if (code === "FFMPEG_UNAVAILABLE") return "ffmpeg não está instalado no servidor.";
  return "Não foi possível executar o processamento.";
}

/** Runs only application-defined commands. Never pass unvalidated input as an argument. */
export function runProcess(
  command: string,
  args: readonly string[],
  options: RunProcessOptions = {},
): Promise<ProcessResult> {
  const failureCode = options.failureCode ?? "METADATA_EXTRACTION_FAILED";
  const failureMessage = options.failureMessage ?? "Não foi possível obter os dados do vídeo.";

  if (!command || args.some((arg) => arg.includes("\0"))) {
    return Promise.reject(new AppError(failureCode, "Comando inválido."));
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let settled = false;

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    const append = (target: "stdout" | "stderr", chunk: Buffer) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > maxOutputBytes) {
        child.kill();
        settle(() => reject(new AppError(failureCode, "A saída do processo excedeu o limite permitido.")));
        return;
      }
      if (target === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };
    const timer = setTimeout(() => {
      child.kill();
      settle(() => reject(new AppError("PROCESS_TIMEOUT", "O processamento demorou mais do que o esperado.")));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));
    child.on("error", (error: NodeJS.ErrnoException) => settle(() => {
      const code = error.code === "ENOENT" ? (options.unavailableCode ?? "PROCESS_UNAVAILABLE") : failureCode;
      reject(new AppError(code, error.code === "ENOENT" ? unavailableMessage(code as NonNullable<RunProcessOptions["unavailableCode"]>) : failureMessage));
    }));
    child.on("close", (exitCode) => settle(() => {
      if (exitCode === 0) resolve({ stdout, stderr, exitCode });
      else reject(new AppError(failureCode, failureMessage, stderr.slice(0, 2_000)));
    }));
  });
}
