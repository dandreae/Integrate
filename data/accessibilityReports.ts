import type { AccessibilityReport } from "@/types";

/**
 * Seeded demo data for MockAccessibilityReportRepository — used whenever
 * EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE isn't "live" (the default). This is
 * the file to edit for a demo: add/remove entries here and the mock
 * repository (and therefore routing + the map) picks them up automatically,
 * no code changes needed. Swap to live Firestore data by setting
 * EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE=live — see services/repositories/index.ts.
 */
export const SEEDED_ACCESSIBILITY_REPORTS: AccessibilityReport[] = [
  {
    id: "seed-lau-elevator",
    placeId: "lauinger-library",
    issueType: "elevator-out",
    description:
      "Elevator near the main circulation desk is out of service. Use the ramp at the 37th & Prospect entrance instead.",
    reportedAt: "2026-08-01T14:30:00.000Z",
    status: "active",
    confirmCount: 4,
  },
  {
    id: "seed-healy-ramp",
    placeId: "healy-tower",
    issueType: "ramp-blocked",
    description: "Construction fencing is temporarily blocking the accessible ramp on the north side of Healy.",
    reportedAt: "2026-08-03T09:15:00.000Z",
    status: "active",
    confirmCount: 2,
  },
  {
    id: "seed-i9-entrance",
    placeId: "i9-office",
    issueType: "entrance-inaccessible",
    description:
      "Entrance by the koi pond has a single step with no ramp. No accessible entrance is currently known for this office.",
    reportedAt: "2026-07-28T11:00:00.000Z",
    status: "active",
    confirmCount: 1,
  },
  {
    id: "seed-leos-resolved",
    placeId: "leos-dining-hall",
    issueType: "path-obstruction",
    description: "Delivery pallets were blocking the walkway to the accessible entrance.",
    reportedAt: "2026-07-20T08:00:00.000Z",
    status: "resolved",
    confirmCount: 3,
  },
];
