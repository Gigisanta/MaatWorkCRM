export const randomBytes = (size) => {
  const arr = new Uint8Array(size);
  for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
  return Buffer.from(arr);
};

export const createHash = (algo) => ({
  update: () => createHash(algo),
  digest: () => Buffer.alloc(0),
});

export const createHmac = (algo, key) => createHash(algo);

export const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
};

export const scrypt = Promise.resolve();
export const randomFill = Promise.resolve();
export const createCipher = () => ({ update: () => Buffer.alloc(0), final: () => Buffer.alloc(0) });
export const createDecipher = () => createCipher();
export const createCipheriv = () => createCipher();
export const createDecipheriv = () => createCipher();
export const createSign = () => ({ update: () => createSign(), sign: () => Buffer.alloc(0) });
export const createVerify = () => createSign();

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
  createSign,
  createVerify,
};
