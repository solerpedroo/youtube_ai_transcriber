import { describe, expect, it } from "vitest";
import { mapProviderHttpError } from "./http";

describe("mapProviderHttpError", () => {
  it("maps missing Groq models to a readable message", () => {
    const error = mapProviderHttpError(
      404,
      JSON.stringify({
        error: {
          message: "The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.",
        },
      }),
    );
    expect(error.code).toBe("INVALID_PROVIDER");
    expect(error.message).toBe("O modelo de chat não existe ou não está disponível na sua conta.");
    expect(error.details).toContain("llama-3.3-70b-versatile");
  });

  it("falls back to a generic message when the provider body is opaque", () => {
    const error = mapProviderHttpError(502, "bad gateway");
    expect(error.code).toBe("CHAT_FAILED");
    expect(error.message).toBe("Não foi possível obter resposta do provedor de chat.");
  });
});
