import { useEffect, useState } from "react";
import type { AccessibilityReport } from "@/types";
import { accessibilityReportRepository } from "@/services/repositories";

/** All accessibility reports (active + resolved) — mock seed data or live Firestore, per EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE. */
export function useAccessibilityReports(): AccessibilityReport[] {
  const [reports, setReports] = useState<AccessibilityReport[]>([]);

  useEffect(() => accessibilityReportRepository.subscribe(setReports), []);

  return reports;
}
