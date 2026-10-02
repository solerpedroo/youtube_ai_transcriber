import { describe, expect, it } from "vitest";
import { runProcess } from "./process";

describe("runProcess", () => {
  it("captures output from an application-defined command", async () => {
    await expect(runProcess(process.execPath, ["-e", "process.stdout.write('ok')"])).resolves.toMatchObject({ stdout: "ok", stderr: "", exitCode: 0 });
  });

  it("returns a controlled unavailable-process error", async () => {
    await expect(runProcess("missing-command-for-youtube-ai", [])).rejects.toMatchObject({ code: "PROCESS_UNAVAILABLE" });
  });
});
