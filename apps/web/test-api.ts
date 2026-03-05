import { createServerFn } from "@tanstack/react-start";

const fn = createServerFn();
console.log("createServerFn() returns:", typeof fn);
console.log("Methods:", Object.keys(fn));
if ((fn as any).validator) {
  console.log("Validator exists!");
} else {
  console.log("Validator MISSING!");
}
