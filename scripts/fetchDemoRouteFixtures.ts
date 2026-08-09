/**
 * Fetches REAL pedestrian routes from the live Valhalla provider for a
 * handful of demo-day origin/destination pairs and prints a TS array
 * literal to paste into services/routing/fixtures/demoRouteFixtures.ts.
 *
 * Run with: npx tsx scripts/fetchDemoRouteFixtures.ts
 *
 * Re-run and re-paste whenever the demo route list changes. Never
 * hand-edit the resulting coordinates — they must be exactly what the
 * provider returned, so the fixtures stay honest stand-ins for a live route.
 */
import { decodePolyline6 } from "../services/routing/valhalla/polyline6";
import { ROUTING_CONFIG } from "../constants/routing";

interface DemoPair {
  id: string;
  label: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}

const DEMO_PAIRS: DemoPair[] = [
  {
    id: "lau-to-leos",
    label: "Lauinger Library → Leo's Dining Hall",
    origin: { latitude: 38.90646, longitude: -77.07226 },
    destination: { latitude: 38.90644, longitude: -77.07517 },
  },
  {
    id: "healy-to-vittles",
    label: "Healy Tower → Vital Vittles",
    origin: { latitude: 38.90716, longitude: -77.07273 },
    destination: { latitude: 38.91014, longitude: -77.07417 },
  },
  {
    id: "carroll-to-i9",
    label: "John Carroll statue → I9 Office",
    origin: { latitude: 38.9076, longitude: -77.07227 },
    destination: { latitude: 38.90893, longitude: -77.07202 },
  },
  {
    id: "guts-to-epis",
    label: "GUTS Bus Loop → Epicurean and Company",
    origin: { latitude: 38.90703, longitude: -77.07734 },
    destination: { latitude: 38.91132, longitude: -77.07382 },
  },
];

async function fetchTrip(origin: DemoPair["origin"], destination: DemoPair["destination"], preferAccessible: boolean) {
  const body = {
    locations: [
      { lat: origin.latitude, lon: origin.longitude },
      { lat: destination.latitude, lon: destination.longitude },
    ],
    costing: "pedestrian",
    costing_options: {
      pedestrian: preferAccessible ? { step_penalty: 720, use_hills: 0.1 } : {},
    },
  };
  const res = await fetch(`${ROUTING_CONFIG.provider.baseUrl}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.trip?.status !== 0) throw new Error(data.trip?.status_message ?? "no route");

  const coordinates = data.trip.legs.flatMap((leg: { shape: string }) => decodePolyline6(leg.shape));
  const stepPattern = /\bstep(s)?\b|\bstair(s)?\b/i;
  const steepPattern = /\bsteep\b/i;
  const hasDetectedSteps = data.trip.legs.some((leg: { maneuvers?: { instruction?: string }[] }) =>
    (leg.maneuvers ?? []).some((m) => stepPattern.test(m.instruction ?? ""))
  );
  const hasDetectedSteepGrade = data.trip.legs.some((leg: { maneuvers?: { instruction?: string }[] }) =>
    (leg.maneuvers ?? []).some((m) => steepPattern.test(m.instruction ?? ""))
  );

  return {
    coordinates,
    distanceMeters: data.trip.summary.length * 1000,
    durationSeconds: data.trip.summary.time,
    hasDetectedSteps,
    hasDetectedSteepGrade,
  };
}

async function main() {
  const fixtures = [];
  for (const pair of DEMO_PAIRS) {
    for (const preferAccessible of [false, true]) {
      const candidate = await fetchTrip(pair.origin, pair.destination, preferAccessible);
      fixtures.push({
        id: `${pair.id}${preferAccessible ? "-accessible" : ""}`,
        label: pair.label,
        origin: pair.origin,
        destination: pair.destination,
        preferAccessible,
        candidate,
        capturedAt: new Date().toISOString(),
      });
      // eslint-disable-next-line no-console
      console.error(`fetched ${pair.id} (accessible=${preferAccessible}): ${candidate.coordinates.length} points`);
    }
  }
  console.log(JSON.stringify(fixtures, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
