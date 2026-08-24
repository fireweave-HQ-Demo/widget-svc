import { getFw } from "../../../fireweave/fw-harness";
import { pickMood } from "../domain/moods";

/** Flag-gated mood chip for the home surface. Off → null. */
export async function getMoodChip(): Promise<{ mood: string } | null> {
  const fw = getFw();
  // @fireweave-controlpoint mood-chip
  // @fireweave-flag mood-chip
  const enabled = await fw.controlPoints.getBooleanValue("mood-chip", false, {
    kind: "user",
    key: "anonymous",
  });
  if (!enabled) return null;
  return { mood: pickMood() };
}
