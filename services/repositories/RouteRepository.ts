import type { RouteOption, RouteRequest } from "@/types";

export interface RouteRepository {
  /** Fetches Fastest, Accessible, and Most Accessible options for a single origin/destination pair. */
  getRouteOptions(request: RouteRequest): Promise<RouteOption[]>;
}
