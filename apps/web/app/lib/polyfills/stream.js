export class Readable {
  constructor(opts) {}
}

export class Writable {
  constructor(opts) {}
}

export class Transform {
  constructor(opts) {}
}

export class Duplex {
  constructor(opts) {}
}

export class PassThrough {
  constructor(opts) {}
}

export function pipeline(...args) {
  const callback = args.pop();
  if (callback) callback(null);
}

export const finished = Promise.resolve();

export default {
  Readable,
  Writable,
  Transform,
  Duplex,
  PassThrough,
  pipeline,
  finished,
};
