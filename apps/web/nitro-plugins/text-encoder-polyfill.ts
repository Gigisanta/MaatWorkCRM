export default function textEncoderPolyfill() {
  return {
    name: "text-encoder-polyfill",
    async setup(nitro: any) {
      nitro.hooks.hook("rollup:before", (nitro: any, config: any) => {
        if (!config.output) config.output = {};
        const originalBanner = config.output.banner || "";
        config.output.banner = `${originalBanner}
// TextEncoder/TextDecoder Polyfill for React DOM Server
import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
`;
      });
    },
  };
}
