/** fw-tracker — active rollout change stamps for the ts-server surface.

`/fireweave:initialise` scaffolds this empty. Per the dev loop, each feature
change appends its `stmp_<ULID>` id here (the same id written to the manifest
`change.stampId`) so `reconcile` and the dev-checklist gates can see the stamp
in the committed tree.
*/
export const FW_STAMPS: readonly string[] = [
  "stmp_01M0M9ANF4D0J6YHRM969NSEQH",
];
