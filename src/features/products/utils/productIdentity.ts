/**
 * @deprecated Legacy adapter for mapping UUIDs back to integers.
 * Should not be used in the new identity model.
 */
export function toLegacyProductNo(productId: string): number {
  console.warn("toLegacyProductNo is deprecated and should not be used in Round 6+.");
  const parsedId = Number(productId);

  if (!Number.isFinite(parsedId)) {
    throw new Error(`Invalid legacy product id: ${productId}`);
  }

  return parsedId;
}
