export function toLegacyProductNo(productId: string): number {
  const parsedId = Number(productId);

  if (!Number.isFinite(parsedId)) {
    throw new Error(`Invalid legacy product id: ${productId}`);
  }

  return parsedId;
}
