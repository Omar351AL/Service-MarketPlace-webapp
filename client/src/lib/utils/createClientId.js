export const createClientId = (prefix = 'id') => {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return `${prefix}_${randomUuid}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};
