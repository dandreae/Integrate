import type { CampusEvent } from "@/types";

export class EventProviderError extends Error {
  constructor(
    message: string,
    public readonly reason:
      | "network"
      | "timeout"
      | "invalid-response"
      | "missing-config"
      | "unexpected"
  ) {
    super(message);
    this.name = "EventProviderError";
  }
}

export interface EventProvider {
  readonly name: string;
  /** True for providers backed by a real external event source; false for the offline seeded fallback. */
  readonly isReal: boolean;
  /**
   * Returns upcoming events for a campus, normalized into CampusEvent.
   * Throws EventProviderError on failure — callers must not silently
   * swallow a failure into an empty list (mirrors RoutingProvider's
   * contract in services/routing/RoutingProvider.ts). Coordinates are
   * best-effort only at this layer — see services/events/eventLocationResolver.ts
   * for the step that guarantees every event gets a plottable location.
   */
  getEvents(campusId: string): Promise<CampusEvent[]>;
}
