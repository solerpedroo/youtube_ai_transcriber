import { describe, expect, it } from "vitest";
import { validateOutboundHttpsBaseUrl } from "./outbound-url";

describe("validateOutboundHttpsBaseUrl", () => {
  it("accepts public https origins", () => {
    expect(validateOutboundHttpsBaseUrl("https://api.example.com/v1")).toBe("https://api.example.com/v1");
  });

  it("blocks localhost and metadata hosts", () => {
    expect(() => validateOutboundHttpsBaseUrl("https://127.0.0.1/v1")).toThrow(/não permitido/);
    expect(() => validateOutboundHttpsBaseUrl("https://metadata.google.internal")).toThrow(/não permitido/);
  });

  it("blocks non-https urls", () => {
    expect(() => validateOutboundHttpsBaseUrl("http://api.example.com")).toThrow(/HTTPS/);
  });

  it("blocks decimal hostnames", () => {
    expect(() => validateOutboundHttpsBaseUrl("https://2130706433/v1")).toThrow(/não permitido/);
  });
});
