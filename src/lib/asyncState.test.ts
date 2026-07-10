import { describe, it, expect } from "vitest";
import { getErrorMessage, withTimeout, isAbortError } from "./asyncState";

describe("asyncState utilities", () => {
  describe("getErrorMessage", () => {
    it("extracts message from Error object", () => {
      expect(getErrorMessage(new Error("Test error"))).toBe("Test error");
    });

    it("returns the string if error is a string", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("extracts message property from generic objects", () => {
      expect(getErrorMessage({ message: "Object error" })).toBe("Object error");
    });

    it("returns fallback for unknown types", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
    });
  });

  describe("withTimeout", () => {
    it("resolves if promise completes before timeout", async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve("Success"), 10));
      const result = await withTimeout(promise, 50);
      expect(result).toBe("Success");
    });

    it("rejects if promise takes longer than timeout", async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve("Success"), 50));
      await expect(withTimeout(promise, 10, "Custom timeout")).rejects.toThrow("Custom timeout");
    });

    it("uses default error message if none provided", async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve("Success"), 50));
      await expect(withTimeout(promise, 10)).rejects.toThrow("Request timeout");
    });
  });

  describe("isAbortError", () => {
    it("identifies AbortError", () => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      expect(isAbortError(err)).toBe(true);
    });

    it("returns false for other errors", () => {
      const err = new Error("Something else");
      expect(isAbortError(err)).toBe(false);
    });
  });
});
