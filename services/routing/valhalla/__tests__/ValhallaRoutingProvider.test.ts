import { afterEach, describe, expect, it, vi } from "vitest";
import { RoutingProviderError } from "../../RoutingProvider";
import { ValhallaRoutingProvider } from "../ValhallaRoutingProvider";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

// A trimmed but structurally real Valhalla /route response shape (based on
// a live call to valhalla1.openstreetmap.de for Healy Tower -> Vital Vittles).
const SAMPLE_RESPONSE = {
  trip: {
    status: 0,
    summary: { time: 430.632, length: 0.596 },
    legs: [
      {
        // encodes 3 points; real value, verified against the decoder round-trip test.
        shape: "cbveiA~oc_rCeAT{@X",
        maneuvers: [{ instruction: "Walk northeast." }, { instruction: "Turn right onto the walkway." }],
      },
    ],
  },
  alternates: [
    {
      trip: {
        status: 0,
        summary: { time: 500, length: 0.65 },
        legs: [
          {
            shape: "cbveiA~oc_rCeAT{@X",
            maneuvers: [{ instruction: "Take the steps down to the plaza." }],
          },
        ],
      },
    },
  ],
};

describe("ValhallaRoutingProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a provider response into candidates with decoded geometry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new ValhallaRoutingProvider();
    const candidates = await provider.getWalkingRoute({
      origin: { latitude: 38.90716, longitude: -77.07273 },
      destination: { latitude: 38.91014, longitude: -77.07417 },
    });

    expect(candidates).toHaveLength(2);
    expect(candidates[0].distanceMeters).toBeCloseTo(596, 0);
    expect(candidates[0].durationSeconds).toBeCloseTo(430.632, 1);
    expect(candidates[0].coordinates.length).toBeGreaterThan(2);
    candidates[0].coordinates.forEach((c) => {
      expect(Number.isNaN(c.latitude)).toBe(false);
      expect(Number.isNaN(c.longitude)).toBe(false);
    });
    // First candidate's instructions don't mention steps; the alternate does.
    expect(candidates[0].hasDetectedSteps).toBe(false);
    expect(candidates[1].hasDetectedSteps).toBe(true);
    expect(candidates[0].hasDetectedSteepGrade).toBe(false);
  });

  it("detects a steep grade from turn-by-turn instructions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        trip: {
          status: 0,
          summary: { time: 200, length: 0.3 },
          legs: [
            {
              shape: "cbveiA~oc_rCeAT{@X",
              maneuvers: [{ instruction: "Continue up the steep hill." }],
            },
          ],
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new ValhallaRoutingProvider();

    const candidates = await provider.getWalkingRoute({
      origin: { latitude: 38.90716, longitude: -77.07273 },
      destination: { latitude: 38.91014, longitude: -77.07417 },
    });

    expect(candidates[0].hasDetectedSteepGrade).toBe(true);
  });

  it("biases pedestrian costing options based on accessibilityPreferences", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new ValhallaRoutingProvider();

    await provider.getWalkingRoute({
      origin: { latitude: 38.90716, longitude: -77.07273 },
      destination: { latitude: 38.91014, longitude: -77.07417 },
      accessibilityPreferences: {
        avoidStairs: false,
        avoidSteepSlopes: false,
        requireElevator: false,
        requireStepFreeEntrance: true,
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    // requireStepFreeEntrance should bias step avoidance harder than a plain "avoid".
    expect(body.costing_options.pedestrian.step_penalty).toBe(1800);
  });

  it("rejects invalid coordinates before making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = new ValhallaRoutingProvider();

    await expect(
      provider.getWalkingRoute({
        origin: { latitude: Number.NaN, longitude: -77 },
        destination: { latitude: 38.9, longitude: -77 },
      })
    ).rejects.toMatchObject({ reason: "invalid-coordinates" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a network RoutingProviderError when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );
    const provider = new ValhallaRoutingProvider();

    await expect(
      provider.getWalkingRoute({
        origin: { latitude: 38.9, longitude: -77.07 },
        destination: { latitude: 38.91, longitude: -77.08 },
      })
    ).rejects.toBeInstanceOf(RoutingProviderError);
  });

  it("throws a no-route error when the provider found nothing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ trip: { status: 442, status_message: "No path could be found for input" } })
      )
    );
    const provider = new ValhallaRoutingProvider();

    await expect(
      provider.getWalkingRoute({
        origin: { latitude: 38.9, longitude: -77.07 },
        destination: { latitude: 0, longitude: 0 },
      })
    ).rejects.toMatchObject({ reason: "no-route" });
  });
});
