import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNearbyNamedFeatures, type MapBounds } from "../nearbyFeaturesCache";

const BOUNDS: MapBounds = { south: 38.903, west: -77.0764, north: 38.9122, east: -77.0682 };

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

const SAMPLE_ELEMENT_RESPONSE = {
  elements: [
    { lat: 38.9065, lon: -77.0723, tags: { name: "Healy Hall" } },
    // Duplicate name — should be deduped.
    { lat: 38.9066, lon: -77.0724, tags: { name: "Healy Hall" } },
    // Missing a name/coordinate — should be skipped, not thrown on.
    { lat: 38.9, lon: -77.07 },
  ],
};

describe("fetchNearbyNamedFeatures", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed, deduped results from the primary Overpass instance without touching the fallback", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse(SAMPLE_ELEMENT_RESPONSE));

    const results = await fetchNearbyNamedFeatures(BOUNDS);

    expect(results).toEqual([{ name: "Healy Hall", latitude: 38.9065, longitude: -77.0723 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://overpass-api.de/api/interpreter", expect.anything());
  });

  it("falls back to the mirror when the primary instance errors", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 504)).mockResolvedValueOnce(jsonResponse(SAMPLE_ELEMENT_RESPONSE));

    const results = await fetchNearbyNamedFeatures({ south: 1, west: 2, north: 3, east: 4 });

    expect(results).toEqual([{ name: "Healy Hall", latitude: 38.9065, longitude: -77.0723 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://overpass.kumi.systems/api/interpreter", expect.anything());
  });

  it("falls back on a thrown network error too, not just a non-ok response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce(jsonResponse(SAMPLE_ELEMENT_RESPONSE));

    const results = await fetchNearbyNamedFeatures({ south: 5, west: 6, north: 7, east: 8 });

    expect(results).toEqual([{ name: "Healy Hall", latitude: 38.9065, longitude: -77.0723 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns an empty array (never throws) when every mirror fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(jsonResponse({}, false, 504));

    const results = await fetchNearbyNamedFeatures({ south: 9, west: 10, north: 11, east: 12 });

    expect(results).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caches by bounds — a repeat call with the same bounds doesn't refetch", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse(SAMPLE_ELEMENT_RESPONSE));
    const bounds = { south: 13, west: 14, north: 15, east: 16 };

    const first = await fetchNearbyNamedFeatures(bounds);
    const second = await fetchNearbyNamedFeatures(bounds);

    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
