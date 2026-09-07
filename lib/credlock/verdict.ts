/** Machine-checkable CredLock verdict. Mirrors CredLockGate.Verdict on-chain. */
export enum Verdict {
  NONE = 0,
  ALLOW = 1,
  BLOCK = 2,
}

export function verdictLabel(v: Verdict): "NONE" | "ALLOW" | "BLOCK" {
  if (v === Verdict.ALLOW) return "ALLOW";
  if (v === Verdict.BLOCK) return "BLOCK";
  return "NONE";
}

/** Minimal public result for one financing decision. */
export interface GateResult {
  assetId: string;
  sourceChain: string;
  verdict: "ALLOW" | "BLOCK";
  reason: "CLEAR" | "ENCUMBERED";
  /** Inspectable Attestcoin proof reference (source tx hash + proof metadata). */
  attestationRef: string;
  verificationStatus: "VERIFIED";
}
