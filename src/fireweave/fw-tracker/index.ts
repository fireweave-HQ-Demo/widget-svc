/**
 * fw-tracker — change stamps for deploy attestation.
 * Append stamps from `.fireweave/rollout-ready/<feature>.json` as you ship.
 * Do not delete stamps without `/fireweave:cleanup`.
 */
export const FW_STAMPS: readonly { readonly stampId: string }[] = [
  { stampId: 'stmp_19F6AC07D88DD21B9841287A36' },
  { stampId: 'stmp_01KXNECNWQ2KJS1N7K5RQW0ZP3' },
];
