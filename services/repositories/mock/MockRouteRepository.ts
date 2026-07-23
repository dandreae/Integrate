import type { Route, RouteRequest } from "@/types";
import { CONSTRUCTION_ZONES } from "@/data";
import { generateMockRoute } from "@/features/routing/mockRoutingEngine";
import type { RouteRepository } from "../RouteRepository";

export class MockRouteRepository implements RouteRepository {
  async getRoute(request: RouteRequest): Promise<Route> {
    return generateMockRoute(request, CONSTRUCTION_ZONES);
  }
}
