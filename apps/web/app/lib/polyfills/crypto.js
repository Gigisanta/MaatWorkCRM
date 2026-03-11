export const randomBytes = (size) => {
  const arr = new Uint8Array(size);
  for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
  return arr;
};

export const createHash = (algo) => ({
  update: () => createHash(algo),
  digest: () => new Uint8Array(0),
});

export const createHmac = (algo, key) => createHash(algo);

export const timingSafeEqual = (a, b) => a.every((x, i) => x === b[i]);

export const scrypt = Promise.resolve();
export const randomFill = Promise.resolve();
export const createCipher = () => ({ update: () => Buffer.alloc(0), final: () => Buffer.alloc(0) });
export const createDecipher = () => createCipher();
export const createCipheriv = () => createCipher();
export const createDecipheriv = () => createCipher();

export default {
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual,
  scrypt,
  randomFill,
  createCipher,
  createDecipher,
  createCipheriv,
  createDecipheriv,
};
