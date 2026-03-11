import { defineNitroPlugin } from "nitropack/runtime";

export default defineNitroPlugin(async (nitroApp) => {
  try {
    const nodeUtil = await import("node:util");
    if (!nodeUtil.TextEncoder) {
      const { TextEncoder, TextDecoder } = await import("util");
      Object.defineProperty(nodeUtil, "TextEncoder", {
        value: TextEncoder,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(nodeUtil, "TextDecoder", {
        value: TextDecoder,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  } catch (e) {
    console.error("Failed to patch util.TextEncoder:", e);
  }

  if (typeof globalThis.TextEncoder === "undefined") {
    const { TextEncoder, TextDecoder } = await import("node:util");
    globalThis.TextEncoder = TextEncoder;
    globalThis.TextDecoder = TextDecoder;
  }
});
