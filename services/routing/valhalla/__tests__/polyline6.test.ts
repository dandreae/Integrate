import { describe, expect, it } from "vitest";
import { decodePolyline6 } from "../polyline6";

// Mirrors the standard Google/Valhalla precision-6 polyline encoder, used
// only here to build a known-good round-trip fixture for the decoder.
function encodePolyline6(points: { latitude: number; longitude: number }[]): string {
  let output = "";
  let prevLat = 0;
  let prevLng = 0;

  for (const { latitude, longitude } of points) {
    const lat = Math.round(latitude * 1e6);
    const lng = Math.round(longitude * 1e6);
    output += encodeValue(lat - prevLat) + encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return output;
}

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let output = "";
  while (v >= 0x20) {
    output += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  output += String.fromCharCode(v + 63);
  return output;
}

describe("decodePolyline6", () => {
  it("round-trips a known coordinate list", () => {
    const points = [
      { latitude: 38.9076, longitude: -77.0723 },
      { latitude: 38.90716, longitude: -77.07273 },
      { latitude: 38.906436, longitude: -77.074887 },
    ];
    const encoded = encodePolyline6(points);
    const decoded = decodePolyline6(encoded);

    expect(decoded).toHaveLength(points.length);
    decoded.forEach((point, i) => {
      expect(point.latitude).toBeCloseTo(points[i].latitude, 5);
      expect(point.longitude).toBeCloseTo(points[i].longitude, 5);
    });
  });

  it("decodes an empty string to an empty path", () => {
    expect(decodePolyline6("")).toEqual([]);
  });
});
