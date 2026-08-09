import type { AccessibilityReport } from "@/types";

/**
 * Seeded demo data for MockAccessibilityReportRepository — used whenever
 * EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE isn't "live" (the default). This is
 * the file to edit for a demo: add/remove entries here and the mock
 * repository (and therefore routing + the map) picks them up automatically,
 * no code changes needed. Swap to live Firestore data by setting
 * EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE=live — see services/repositories/index.ts.
 *
 * Deliberately spans all three confidence tiers plus an expired report, so
 * the demo shows the full lifecycle (see services/accessibility/reportConfidence.ts):
 *  - seed-lau-elevator: recently reconfirmed by several people -> 🔴 critical.
 *  - seed-healy-ramp: reported, one confirmation, below the critical
 *    threshold -> 🟡 community.
 *  - seed-i9-entrance: nobody has reconfirmed it in weeks, well past its
 *    (severity-based) expiration -> treated as expired, hidden from routing
 *    and the UI, exactly the "elevator broken 6 months ago" problem this
 *    feature exists to prevent.
 *  - seed-leos-resolved: enough "Fixed" votes came in recently -> 🟢
 *    recently verified.
 */
export const SEEDED_ACCESSIBILITY_REPORTS: AccessibilityReport[] = [
  {
    id: "seed-lau-elevator",
    placeId: "lauinger-library",
    issueType: "elevator-out",
    description:
      "Elevator near the main circulation desk is out of service. Use the ramp at the 37th & Prospect entrance instead.",
    severity: "high",
    reportedAt: "2026-08-05T14:30:00.000Z",
    lastConfirmedAt: "2026-08-08T09:00:00.000Z",
    expiresAt: "2026-08-22T09:00:00.000Z",
    status: "active",
    confirmCount: 4,
    fixedCount: 0,
  },
  {
    id: "seed-healy-ramp",
    placeId: "healy-tower",
    issueType: "ramp-blocked",
    description: "Construction fencing is temporarily blocking the accessible ramp on the north side of Healy.",
    severity: "medium",
    reportedAt: "2026-08-06T09:15:00.000Z",
    lastConfirmedAt: "2026-08-07T10:00:00.000Z",
    expiresAt: "2026-08-14T10:00:00.000Z",
    status: "active",
    confirmCount: 2,
    fixedCount: 0,
  },
  {
    id: "seed-i9-entrance",
    placeId: "i9-office",
    issueType: "entrance-inaccessible",
    description:
      "Entrance by the koi pond has a single step with no ramp. No accessible entrance is currently known for this office.",
    severity: "high",
    reportedAt: "2026-07-10T11:00:00.000Z",
    lastConfirmedAt: "2026-07-10T11:00:00.000Z",
    expiresAt: "2026-07-24T11:00:00.000Z",
    status: "active",
    confirmCount: 1,
    fixedCount: 0,
  },
  {
    id: "seed-leos-resolved",
    placeId: "leos-dining-hall",
    issueType: "path-obstruction",
    description: "Delivery pallets were blocking the walkway to the accessible entrance.",
    severity: "low",
    reportedAt: "2026-07-20T08:00:00.000Z",
    lastConfirmedAt: "2026-08-08T12:00:00.000Z",
    expiresAt: "2026-08-11T12:00:00.000Z",
    status: "resolved",
    resolvedAt: "2026-08-08T12:00:00.000Z",
    confirmCount: 3,
    fixedCount: 2,
  },
];
