import { useEffect, useState } from "react";
import type { Proposal } from "@/types";
import { subscribeToPendingProposals } from "@/services/repositories/firestore/proposalsRepository";

/** Live list of not-yet-approved community edits, for rendering pending markers on the map. */
export function usePendingProposals(): Proposal[] {
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    return subscribeToPendingProposals(setProposals);
  }, []);

  return proposals;
}
