import type { Route, RouteRequest } from "@/types";

export interface RouteRepository {
  getRoute(request: RouteRequest): Promise<Route>;
}
