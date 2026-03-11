// Util shim that provides TextEncoder/TextDecoder for React DOM Server
// This module re-exports all of node:util and ensures TextEncoder is available
export * from "node:util";
export { default } from "node:util";
