import type { ConstructionSeverity, LatLng } from "./construction";

export type ProposalType = "rename" | "construction-zone";
export type ProposalStatus = "pending" | "approved" | "rejected";

export interface RenameProposalPayload {
  placeId: string;
  currentOfficialName: string;
  currentLocalName?: string;
  proposedOfficialName?: string;
  proposedLocalName?: string;
}

export interface ConstructionZoneProposalPayload {
  campusId: string;
  title: string;
  description: string;
  coordinates: LatLng[];
  severity: ConstructionSeverity;
  startDate: string;
  endDate: string;
  affectedAccessibility: boolean;
}

export interface Proposal {
  id: string;
  type: ProposalType;
  status: ProposalStatus;
  submittedBy: string;
  createdAt: number;
  confirmCount: number;
  payload: RenameProposalPayload | ConstructionZoneProposalPayload;
}

export interface PlaceOverride {
  placeId: string;
  proposedOfficialName?: string;
  proposedLocalName?: string;
  approvedAt: number;
  sourceProposalId: string;
}
