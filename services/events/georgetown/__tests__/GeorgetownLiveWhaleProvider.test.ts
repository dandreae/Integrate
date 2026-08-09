import { afterEach, describe, expect, it, vi } from "vitest";
import { EventProviderError } from "../../EventProvider";
import { GeorgetownLiveWhaleProvider } from "../GeorgetownLiveWhaleProvider";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

const CAMPUS_ID = "georgetown-university";

describe("GeorgetownLiveWhaleProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes a LiveWhale response into CampusEvent", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 40663,
            title: "GWA Conflict Management Workshops",
            url: "https://events.georgetown.edu/event/40663",
            date_iso: "2026-08-11T12:00:00-04:00",
            location: "Arrupe Hall Multipurpose Room",
            summary: "Workshop summary.",
            event_types: ["Workshop"],
          },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeorgetownLiveWhaleProvider();

    const events = await provider.getEvents(CAMPUS_ID);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "georgetown-40663-2026-08-11",
      campusId: CAMPUS_ID,
      title: "GWA Conflict Management Workshops",
      startAt: "2026-08-11T16:00:00.000Z",
      date: "2026-08-11",
      locationLabel: "Arrupe Hall Multipurpose Room",
      sourceUrl: "https://events.georgetown.edu/event/40663",
      source: "georgetown-livewhale",
      category: "academic",
    });
    expect(events[0].coordinate).toBeUndefined();
  });

  it("disambiguates recurring events (same source id, different dates) with distinct ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          { id: 1, title: "Recurring Info Session", date_iso: "2026-08-09T00:00:00-04:00" },
          { id: 1, title: "Recurring Info Session", date_iso: "2026-08-16T00:00:00-04:00" },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeorgetownLiveWhaleProvider();

    const events = await provider.getEvents(CAMPUS_ID);

    expect(events.map((e) => e.id)).toEqual(["georgetown-1-2026-08-09", "georgetown-1-2026-08-16"]);
  });

  it("uses direct coordinates from the source when present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 2,
            title: "Event With Known Location",
            date_iso: "2026-08-09T12:00:00-04:00",
            location_latitude: 38.909,
            location_longitude: -77.071,
          },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeorgetownLiveWhaleProvider();

    const events = await provider.getEvents(CAMPUS_ID);
    expect(events[0].coordinate).toEqual({ latitude: 38.909, longitude: -77.071 });
  });

  it("skips canceled events and events with no parseable date", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          { id: 3, title: "Canceled Event", date_iso: "2026-08-09T00:00:00-04:00", is_canceled: 1 },
          { id: 4, title: "No Date Event" },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = new GeorgetownLiveWhaleProvider();

    const events = await provider.getEvents(CAMPUS_ID);
    expect(events).toHaveLength(0);
  });

  it("throws missing-config for a campus it doesn't know how to fetch", async () => {
    const provider = new GeorgetownLiveWhaleProvider();
    await expect(provider.getEvents("some-other-campus")).rejects.toMatchObject({ reason: "missing-config" });
  });

  it("throws a network EventProviderError when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const provider = new GeorgetownLiveWhaleProvider();

    await expect(provider.getEvents(CAMPUS_ID)).rejects.toBeInstanceOf(EventProviderError);
  });

  it("throws invalid-response when the payload has no data array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ meta: {} })));
    const provider = new GeorgetownLiveWhaleProvider();

    await expect(provider.getEvents(CAMPUS_ID)).rejects.toMatchObject({ reason: "invalid-response" });
  });
});
