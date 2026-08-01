import type { LatLng } from "@/types";
import { haversineDistanceMeters } from "@/features/routing/geo";
import type { ProviderRouteCandidate } from "../RoutingProvider";

/**
 * Pre-captured REAL pedestrian routes (real geometry previously returned by
 * the Valhalla provider — never hand-drawn) used as a demo-day safety net
 * when Wi-Fi or the routing API is unavailable. See scripts/fetchDemoRouteFixtures.ts
 * for how these were captured; re-run it if the demo route list changes.
 */
export interface DemoRouteFixture {
  id: string;
  label: string;
  origin: LatLng;
  destination: LatLng;
  preferAccessible: boolean;
  candidate: ProviderRouteCandidate;
  capturedAt: string;
}

export const DEMO_ROUTE_FIXTURES: DemoRouteFixture[] = [
  {
    "id": "lau-to-leos",
    "label": "Lauinger Library → Leo's Dining Hall",
    "origin": {
      "latitude": 38.90646,
      "longitude": -77.07226
    },
    "destination": {
      "latitude": 38.90644,
      "longitude": -77.07517
    },
    "preferAccessible": false,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.906593,
          "longitude": -77.072016
        },
        {
          "latitude": 38.906596,
          "longitude": -77.071812
        },
        {
          "latitude": 38.906668,
          "longitude": -77.071813
        },
        {
          "latitude": 38.906692,
          "longitude": -77.071814
        },
        {
          "latitude": 38.906713,
          "longitude": -77.071814
        },
        {
          "latitude": 38.906711,
          "longitude": -77.07191
        },
        {
          "latitude": 38.906757,
          "longitude": -77.071912
        },
        {
          "latitude": 38.906756,
          "longitude": -77.072085
        },
        {
          "latitude": 38.906811,
          "longitude": -77.072195
        },
        {
          "latitude": 38.906812,
          "longitude": -77.072259
        },
        {
          "latitude": 38.906792,
          "longitude": -77.072524
        },
        {
          "latitude": 38.906783,
          "longitude": -77.072562
        },
        {
          "latitude": 38.906755,
          "longitude": -77.072663
        },
        {
          "latitude": 38.906736,
          "longitude": -77.072738
        },
        {
          "latitude": 38.906722,
          "longitude": -77.072795
        },
        {
          "latitude": 38.906718,
          "longitude": -77.07281
        },
        {
          "latitude": 38.906716,
          "longitude": -77.072827
        },
        {
          "latitude": 38.906702,
          "longitude": -77.072929
        },
        {
          "latitude": 38.906692,
          "longitude": -77.072995
        },
        {
          "latitude": 38.906691,
          "longitude": -77.0731
        },
        {
          "latitude": 38.906689,
          "longitude": -77.073179
        },
        {
          "latitude": 38.906686,
          "longitude": -77.073268
        },
        {
          "latitude": 38.906683,
          "longitude": -77.073313
        },
        {
          "latitude": 38.906679,
          "longitude": -77.073407
        },
        {
          "latitude": 38.906677,
          "longitude": -77.07345
        },
        {
          "latitude": 38.906672,
          "longitude": -77.073575
        },
        {
          "latitude": 38.906666,
          "longitude": -77.073751
        },
        {
          "latitude": 38.906663,
          "longitude": -77.073934
        },
        {
          "latitude": 38.906656,
          "longitude": -77.074335
        },
        {
          "latitude": 38.906654,
          "longitude": -77.074725
        },
        {
          "latitude": 38.906596,
          "longitude": -77.074727
        },
        {
          "latitude": 38.9066,
          "longitude": -77.074826
        },
        {
          "latitude": 38.9066,
          "longitude": -77.074883
        },
        {
          "latitude": 38.906436,
          "longitude": -77.074887
        }
      ],
      "distanceMeters": 330,
      "durationSeconds": 237.197,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:03.790Z"
  },
  {
    "id": "lau-to-leos-accessible",
    "label": "Lauinger Library → Leo's Dining Hall",
    "origin": {
      "latitude": 38.90646,
      "longitude": -77.07226
    },
    "destination": {
      "latitude": 38.90644,
      "longitude": -77.07517
    },
    "preferAccessible": true,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.906593,
          "longitude": -77.072016
        },
        {
          "latitude": 38.906596,
          "longitude": -77.071812
        },
        {
          "latitude": 38.906668,
          "longitude": -77.071813
        },
        {
          "latitude": 38.906692,
          "longitude": -77.071814
        },
        {
          "latitude": 38.906713,
          "longitude": -77.071814
        },
        {
          "latitude": 38.906711,
          "longitude": -77.07191
        },
        {
          "latitude": 38.906757,
          "longitude": -77.071912
        },
        {
          "latitude": 38.906756,
          "longitude": -77.072085
        },
        {
          "latitude": 38.906811,
          "longitude": -77.072195
        },
        {
          "latitude": 38.906812,
          "longitude": -77.072259
        },
        {
          "latitude": 38.906792,
          "longitude": -77.072524
        },
        {
          "latitude": 38.906783,
          "longitude": -77.072562
        },
        {
          "latitude": 38.906755,
          "longitude": -77.072663
        },
        {
          "latitude": 38.906736,
          "longitude": -77.072738
        },
        {
          "latitude": 38.906722,
          "longitude": -77.072795
        },
        {
          "latitude": 38.906718,
          "longitude": -77.07281
        },
        {
          "latitude": 38.906716,
          "longitude": -77.072827
        },
        {
          "latitude": 38.906702,
          "longitude": -77.072929
        },
        {
          "latitude": 38.906692,
          "longitude": -77.072995
        },
        {
          "latitude": 38.906691,
          "longitude": -77.0731
        },
        {
          "latitude": 38.906689,
          "longitude": -77.073179
        },
        {
          "latitude": 38.906686,
          "longitude": -77.073268
        },
        {
          "latitude": 38.906683,
          "longitude": -77.073313
        },
        {
          "latitude": 38.906679,
          "longitude": -77.073407
        },
        {
          "latitude": 38.906677,
          "longitude": -77.07345
        },
        {
          "latitude": 38.906672,
          "longitude": -77.073575
        },
        {
          "latitude": 38.906666,
          "longitude": -77.073751
        },
        {
          "latitude": 38.906663,
          "longitude": -77.073934
        },
        {
          "latitude": 38.906656,
          "longitude": -77.074335
        },
        {
          "latitude": 38.906654,
          "longitude": -77.074725
        },
        {
          "latitude": 38.906596,
          "longitude": -77.074727
        },
        {
          "latitude": 38.9066,
          "longitude": -77.074826
        },
        {
          "latitude": 38.9066,
          "longitude": -77.074883
        },
        {
          "latitude": 38.906436,
          "longitude": -77.074887
        }
      ],
      "distanceMeters": 330,
      "durationSeconds": 237.197,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:04.242Z"
  },
  {
    "id": "healy-to-vittles",
    "label": "Healy Tower → Vital Vittles",
    "origin": {
      "latitude": 38.90716,
      "longitude": -77.07273
    },
    "destination": {
      "latitude": 38.91014,
      "longitude": -77.07417
    },
    "preferAccessible": false,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.907288,
          "longitude": -77.072825
        },
        {
          "latitude": 38.907289,
          "longitude": -77.07294
        },
        {
          "latitude": 38.907289,
          "longitude": -77.073023
        },
        {
          "latitude": 38.907303,
          "longitude": -77.073023
        },
        {
          "latitude": 38.907315,
          "longitude": -77.073033
        },
        {
          "latitude": 38.907326,
          "longitude": -77.073053
        },
        {
          "latitude": 38.907388,
          "longitude": -77.073052
        },
        {
          "latitude": 38.907389,
          "longitude": -77.073107
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073106
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073194
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073288
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073374
        },
        {
          "latitude": 38.90744,
          "longitude": -77.073374
        },
        {
          "latitude": 38.907439,
          "longitude": -77.073438
        },
        {
          "latitude": 38.907439,
          "longitude": -77.073474
        },
        {
          "latitude": 38.907459,
          "longitude": -77.073552
        },
        {
          "latitude": 38.907459,
          "longitude": -77.073583
        },
        {
          "latitude": 38.907458,
          "longitude": -77.07387
        },
        {
          "latitude": 38.907458,
          "longitude": -77.073896
        },
        {
          "latitude": 38.907467,
          "longitude": -77.073897
        },
        {
          "latitude": 38.907637,
          "longitude": -77.073893
        },
        {
          "latitude": 38.907655,
          "longitude": -77.073889
        },
        {
          "latitude": 38.907671,
          "longitude": -77.073868
        },
        {
          "latitude": 38.907691,
          "longitude": -77.073843
        },
        {
          "latitude": 38.907708,
          "longitude": -77.073804
        },
        {
          "latitude": 38.907718,
          "longitude": -77.073747
        },
        {
          "latitude": 38.907722,
          "longitude": -77.073695
        },
        {
          "latitude": 38.90773,
          "longitude": -77.073489
        },
        {
          "latitude": 38.90773,
          "longitude": -77.073449
        },
        {
          "latitude": 38.907729,
          "longitude": -77.073311
        },
        {
          "latitude": 38.907728,
          "longitude": -77.07327
        },
        {
          "latitude": 38.907729,
          "longitude": -77.073214
        },
        {
          "latitude": 38.907729,
          "longitude": -77.073137
        },
        {
          "latitude": 38.907729,
          "longitude": -77.07313
        },
        {
          "latitude": 38.907732,
          "longitude": -77.073092
        },
        {
          "latitude": 38.907734,
          "longitude": -77.073061
        },
        {
          "latitude": 38.907739,
          "longitude": -77.073024
        },
        {
          "latitude": 38.907747,
          "longitude": -77.073007
        },
        {
          "latitude": 38.90775,
          "longitude": -77.072998
        },
        {
          "latitude": 38.907777,
          "longitude": -77.072959
        },
        {
          "latitude": 38.907776,
          "longitude": -77.072798
        },
        {
          "latitude": 38.907774,
          "longitude": -77.072463
        },
        {
          "latitude": 38.907821,
          "longitude": -77.072466
        },
        {
          "latitude": 38.907981,
          "longitude": -77.072474
        },
        {
          "latitude": 38.908212,
          "longitude": -77.072486
        },
        {
          "latitude": 38.908521,
          "longitude": -77.072502
        },
        {
          "latitude": 38.908549,
          "longitude": -77.072512
        },
        {
          "latitude": 38.908593,
          "longitude": -77.072604
        },
        {
          "latitude": 38.908609,
          "longitude": -77.072638
        },
        {
          "latitude": 38.908684,
          "longitude": -77.072717
        },
        {
          "latitude": 38.908829,
          "longitude": -77.072884
        },
        {
          "latitude": 38.908954,
          "longitude": -77.072911
        },
        {
          "latitude": 38.909139,
          "longitude": -77.072915
        },
        {
          "latitude": 38.909135,
          "longitude": -77.073203
        },
        {
          "latitude": 38.909137,
          "longitude": -77.073341
        },
        {
          "latitude": 38.909145,
          "longitude": -77.073382
        },
        {
          "latitude": 38.909158,
          "longitude": -77.073415
        },
        {
          "latitude": 38.909198,
          "longitude": -77.073472
        },
        {
          "latitude": 38.909254,
          "longitude": -77.073552
        },
        {
          "latitude": 38.909318,
          "longitude": -77.073642
        },
        {
          "latitude": 38.909397,
          "longitude": -77.073733
        },
        {
          "latitude": 38.909399,
          "longitude": -77.073736
        },
        {
          "latitude": 38.909445,
          "longitude": -77.073771
        },
        {
          "latitude": 38.909544,
          "longitude": -77.073843
        },
        {
          "latitude": 38.909558,
          "longitude": -77.073848
        },
        {
          "latitude": 38.909647,
          "longitude": -77.073877
        },
        {
          "latitude": 38.909716,
          "longitude": -77.0739
        },
        {
          "latitude": 38.909724,
          "longitude": -77.073947
        },
        {
          "latitude": 38.909789,
          "longitude": -77.073944
        },
        {
          "latitude": 38.909888,
          "longitude": -77.073927
        },
        {
          "latitude": 38.910076,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910081,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910136,
          "longitude": -77.07391
        }
      ],
      "distanceMeters": 596,
      "durationSeconds": 430.632,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:04.394Z"
  },
  {
    "id": "healy-to-vittles-accessible",
    "label": "Healy Tower → Vital Vittles",
    "origin": {
      "latitude": 38.90716,
      "longitude": -77.07273
    },
    "destination": {
      "latitude": 38.91014,
      "longitude": -77.07417
    },
    "preferAccessible": true,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.907288,
          "longitude": -77.072825
        },
        {
          "latitude": 38.907289,
          "longitude": -77.07294
        },
        {
          "latitude": 38.907289,
          "longitude": -77.073023
        },
        {
          "latitude": 38.907303,
          "longitude": -77.073023
        },
        {
          "latitude": 38.907315,
          "longitude": -77.073033
        },
        {
          "latitude": 38.907326,
          "longitude": -77.073053
        },
        {
          "latitude": 38.907388,
          "longitude": -77.073052
        },
        {
          "latitude": 38.907389,
          "longitude": -77.073107
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073106
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073194
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073288
        },
        {
          "latitude": 38.907413,
          "longitude": -77.073374
        },
        {
          "latitude": 38.90744,
          "longitude": -77.073374
        },
        {
          "latitude": 38.907439,
          "longitude": -77.073438
        },
        {
          "latitude": 38.907439,
          "longitude": -77.073474
        },
        {
          "latitude": 38.907459,
          "longitude": -77.073552
        },
        {
          "latitude": 38.907459,
          "longitude": -77.073583
        },
        {
          "latitude": 38.907458,
          "longitude": -77.07387
        },
        {
          "latitude": 38.907458,
          "longitude": -77.073896
        },
        {
          "latitude": 38.907467,
          "longitude": -77.073897
        },
        {
          "latitude": 38.907637,
          "longitude": -77.073893
        },
        {
          "latitude": 38.907655,
          "longitude": -77.073889
        },
        {
          "latitude": 38.907671,
          "longitude": -77.073868
        },
        {
          "latitude": 38.907691,
          "longitude": -77.073843
        },
        {
          "latitude": 38.907708,
          "longitude": -77.073804
        },
        {
          "latitude": 38.907718,
          "longitude": -77.073747
        },
        {
          "latitude": 38.907722,
          "longitude": -77.073695
        },
        {
          "latitude": 38.90773,
          "longitude": -77.073489
        },
        {
          "latitude": 38.90773,
          "longitude": -77.073449
        },
        {
          "latitude": 38.907729,
          "longitude": -77.073311
        },
        {
          "latitude": 38.907728,
          "longitude": -77.07327
        },
        {
          "latitude": 38.907729,
          "longitude": -77.073214
        },
        {
          "latitude": 38.907729,
          "longitude": -77.073137
        },
        {
          "latitude": 38.907729,
          "longitude": -77.07313
        },
        {
          "latitude": 38.907732,
          "longitude": -77.073092
        },
        {
          "latitude": 38.907734,
          "longitude": -77.073061
        },
        {
          "latitude": 38.907739,
          "longitude": -77.073024
        },
        {
          "latitude": 38.907747,
          "longitude": -77.073007
        },
        {
          "latitude": 38.90775,
          "longitude": -77.072998
        },
        {
          "latitude": 38.907777,
          "longitude": -77.072959
        },
        {
          "latitude": 38.907776,
          "longitude": -77.072798
        },
        {
          "latitude": 38.907774,
          "longitude": -77.072463
        },
        {
          "latitude": 38.907821,
          "longitude": -77.072466
        },
        {
          "latitude": 38.907981,
          "longitude": -77.072474
        },
        {
          "latitude": 38.908212,
          "longitude": -77.072486
        },
        {
          "latitude": 38.908521,
          "longitude": -77.072502
        },
        {
          "latitude": 38.908549,
          "longitude": -77.072512
        },
        {
          "latitude": 38.908593,
          "longitude": -77.072604
        },
        {
          "latitude": 38.908609,
          "longitude": -77.072638
        },
        {
          "latitude": 38.908684,
          "longitude": -77.072717
        },
        {
          "latitude": 38.908829,
          "longitude": -77.072884
        },
        {
          "latitude": 38.908954,
          "longitude": -77.072911
        },
        {
          "latitude": 38.909139,
          "longitude": -77.072915
        },
        {
          "latitude": 38.909135,
          "longitude": -77.073203
        },
        {
          "latitude": 38.909137,
          "longitude": -77.073341
        },
        {
          "latitude": 38.909145,
          "longitude": -77.073382
        },
        {
          "latitude": 38.909158,
          "longitude": -77.073415
        },
        {
          "latitude": 38.909198,
          "longitude": -77.073472
        },
        {
          "latitude": 38.909254,
          "longitude": -77.073552
        },
        {
          "latitude": 38.909318,
          "longitude": -77.073642
        },
        {
          "latitude": 38.909397,
          "longitude": -77.073733
        },
        {
          "latitude": 38.909399,
          "longitude": -77.073736
        },
        {
          "latitude": 38.909445,
          "longitude": -77.073771
        },
        {
          "latitude": 38.909544,
          "longitude": -77.073843
        },
        {
          "latitude": 38.909558,
          "longitude": -77.073848
        },
        {
          "latitude": 38.909647,
          "longitude": -77.073877
        },
        {
          "latitude": 38.909716,
          "longitude": -77.0739
        },
        {
          "latitude": 38.909724,
          "longitude": -77.073947
        },
        {
          "latitude": 38.909789,
          "longitude": -77.073944
        },
        {
          "latitude": 38.909888,
          "longitude": -77.073927
        },
        {
          "latitude": 38.910076,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910081,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910136,
          "longitude": -77.07391
        }
      ],
      "distanceMeters": 596,
      "durationSeconds": 430.632,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:04.549Z"
  },
  {
    "id": "carroll-to-i9",
    "label": "John Carroll statue → I9 Office",
    "origin": {
      "latitude": 38.9076,
      "longitude": -77.07227
    },
    "destination": {
      "latitude": 38.90893,
      "longitude": -77.07202
    },
    "preferAccessible": false,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.90757,
          "longitude": -77.072383
        },
        {
          "latitude": 38.907587,
          "longitude": -77.072391
        },
        {
          "latitude": 38.907623,
          "longitude": -77.07239
        },
        {
          "latitude": 38.907657,
          "longitude": -77.072374
        },
        {
          "latitude": 38.907685,
          "longitude": -77.072346
        },
        {
          "latitude": 38.907774,
          "longitude": -77.072463
        },
        {
          "latitude": 38.907821,
          "longitude": -77.072466
        },
        {
          "latitude": 38.907981,
          "longitude": -77.072474
        },
        {
          "latitude": 38.908212,
          "longitude": -77.072486
        },
        {
          "latitude": 38.908521,
          "longitude": -77.072502
        },
        {
          "latitude": 38.908549,
          "longitude": -77.072512
        },
        {
          "latitude": 38.908593,
          "longitude": -77.072604
        },
        {
          "latitude": 38.908609,
          "longitude": -77.072638
        },
        {
          "latitude": 38.908684,
          "longitude": -77.072717
        },
        {
          "latitude": 38.908685,
          "longitude": -77.072639
        },
        {
          "latitude": 38.908685,
          "longitude": -77.072587
        },
        {
          "latitude": 38.908687,
          "longitude": -77.072452
        },
        {
          "latitude": 38.90869,
          "longitude": -77.072281
        },
        {
          "latitude": 38.908695,
          "longitude": -77.072013
        },
        {
          "latitude": 38.908695,
          "longitude": -77.071988
        },
        {
          "latitude": 38.908708,
          "longitude": -77.071964
        },
        {
          "latitude": 38.908723,
          "longitude": -77.071946
        },
        {
          "latitude": 38.908736,
          "longitude": -77.071932
        },
        {
          "latitude": 38.908788,
          "longitude": -77.071881
        },
        {
          "latitude": 38.908926,
          "longitude": -77.071886
        },
        {
          "latitude": 38.908926,
          "longitude": -77.071922
        },
        {
          "latitude": 38.909025,
          "longitude": -77.071928
        },
        {
          "latitude": 38.909025,
          "longitude": -77.07195
        },
        {
          "latitude": 38.908937,
          "longitude": -77.071946
        },
        {
          "latitude": 38.908939,
          "longitude": -77.071954
        }
      ],
      "distanceMeters": 258,
      "durationSeconds": 180.002,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:04.699Z"
  },
  {
    "id": "carroll-to-i9-accessible",
    "label": "John Carroll statue → I9 Office",
    "origin": {
      "latitude": 38.9076,
      "longitude": -77.07227
    },
    "destination": {
      "latitude": 38.90893,
      "longitude": -77.07202
    },
    "preferAccessible": true,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.90757,
          "longitude": -77.072383
        },
        {
          "latitude": 38.907587,
          "longitude": -77.072391
        },
        {
          "latitude": 38.907623,
          "longitude": -77.07239
        },
        {
          "latitude": 38.907657,
          "longitude": -77.072374
        },
        {
          "latitude": 38.907685,
          "longitude": -77.072346
        },
        {
          "latitude": 38.907774,
          "longitude": -77.072463
        },
        {
          "latitude": 38.907821,
          "longitude": -77.072466
        },
        {
          "latitude": 38.907981,
          "longitude": -77.072474
        },
        {
          "latitude": 38.908212,
          "longitude": -77.072486
        },
        {
          "latitude": 38.908521,
          "longitude": -77.072502
        },
        {
          "latitude": 38.908549,
          "longitude": -77.072512
        },
        {
          "latitude": 38.908593,
          "longitude": -77.072604
        },
        {
          "latitude": 38.908609,
          "longitude": -77.072638
        },
        {
          "latitude": 38.908684,
          "longitude": -77.072717
        },
        {
          "latitude": 38.908685,
          "longitude": -77.072639
        },
        {
          "latitude": 38.908685,
          "longitude": -77.072587
        },
        {
          "latitude": 38.908687,
          "longitude": -77.072452
        },
        {
          "latitude": 38.90869,
          "longitude": -77.072281
        },
        {
          "latitude": 38.908695,
          "longitude": -77.072013
        },
        {
          "latitude": 38.908695,
          "longitude": -77.071988
        },
        {
          "latitude": 38.908708,
          "longitude": -77.071964
        },
        {
          "latitude": 38.908723,
          "longitude": -77.071946
        },
        {
          "latitude": 38.908736,
          "longitude": -77.071932
        },
        {
          "latitude": 38.908788,
          "longitude": -77.071881
        },
        {
          "latitude": 38.908926,
          "longitude": -77.071886
        },
        {
          "latitude": 38.908926,
          "longitude": -77.071922
        },
        {
          "latitude": 38.909025,
          "longitude": -77.071928
        },
        {
          "latitude": 38.909025,
          "longitude": -77.07195
        },
        {
          "latitude": 38.908937,
          "longitude": -77.071946
        },
        {
          "latitude": 38.908939,
          "longitude": -77.071954
        }
      ],
      "distanceMeters": 258,
      "durationSeconds": 180.002,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:04.851Z"
  },
  {
    "id": "guts-to-epis",
    "label": "GUTS Bus Loop → Epicurean and Company",
    "origin": {
      "latitude": 38.90703,
      "longitude": -77.07734
    },
    "destination": {
      "latitude": 38.91132,
      "longitude": -77.07382
    },
    "preferAccessible": false,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.907048,
          "longitude": -77.077301
        },
        {
          "latitude": 38.906985,
          "longitude": -77.077253
        },
        {
          "latitude": 38.906792,
          "longitude": -77.077103
        },
        {
          "latitude": 38.90679,
          "longitude": -77.077004
        },
        {
          "latitude": 38.906789,
          "longitude": -77.076946
        },
        {
          "latitude": 38.906781,
          "longitude": -77.076469
        },
        {
          "latitude": 38.906782,
          "longitude": -77.076421
        },
        {
          "latitude": 38.906793,
          "longitude": -77.076375
        },
        {
          "latitude": 38.906816,
          "longitude": -77.076334
        },
        {
          "latitude": 38.906842,
          "longitude": -77.076303
        },
        {
          "latitude": 38.906874,
          "longitude": -77.076282
        },
        {
          "latitude": 38.906904,
          "longitude": -77.076273
        },
        {
          "latitude": 38.907289,
          "longitude": -77.076268
        },
        {
          "latitude": 38.907307,
          "longitude": -77.076268
        },
        {
          "latitude": 38.907306,
          "longitude": -77.076203
        },
        {
          "latitude": 38.907305,
          "longitude": -77.076143
        },
        {
          "latitude": 38.907327,
          "longitude": -77.076129
        },
        {
          "latitude": 38.907342,
          "longitude": -77.076117
        },
        {
          "latitude": 38.907356,
          "longitude": -77.076093
        },
        {
          "latitude": 38.907363,
          "longitude": -77.07606
        },
        {
          "latitude": 38.907364,
          "longitude": -77.076002
        },
        {
          "latitude": 38.907402,
          "longitude": -77.076002
        },
        {
          "latitude": 38.907454,
          "longitude": -77.076001
        },
        {
          "latitude": 38.907451,
          "longitude": -77.075928
        },
        {
          "latitude": 38.907444,
          "longitude": -77.075805
        },
        {
          "latitude": 38.907442,
          "longitude": -77.07573
        },
        {
          "latitude": 38.907441,
          "longitude": -77.075678
        },
        {
          "latitude": 38.907436,
          "longitude": -77.075221
        },
        {
          "latitude": 38.907434,
          "longitude": -77.07497
        },
        {
          "latitude": 38.907434,
          "longitude": -77.074916
        },
        {
          "latitude": 38.907438,
          "longitude": -77.074892
        },
        {
          "latitude": 38.907548,
          "longitude": -77.074818
        },
        {
          "latitude": 38.908107,
          "longitude": -77.074801
        },
        {
          "latitude": 38.908148,
          "longitude": -77.074788
        },
        {
          "latitude": 38.908173,
          "longitude": -77.074739
        },
        {
          "latitude": 38.908278,
          "longitude": -77.074594
        },
        {
          "latitude": 38.908396,
          "longitude": -77.074508
        },
        {
          "latitude": 38.908442,
          "longitude": -77.074488
        },
        {
          "latitude": 38.908467,
          "longitude": -77.074482
        },
        {
          "latitude": 38.908742,
          "longitude": -77.074375
        },
        {
          "latitude": 38.908795,
          "longitude": -77.074162
        },
        {
          "latitude": 38.908835,
          "longitude": -77.074074
        },
        {
          "latitude": 38.909207,
          "longitude": -77.074092
        },
        {
          "latitude": 38.909249,
          "longitude": -77.074084
        },
        {
          "latitude": 38.909434,
          "longitude": -77.073995
        },
        {
          "latitude": 38.909464,
          "longitude": -77.074002
        },
        {
          "latitude": 38.909498,
          "longitude": -77.07401
        },
        {
          "latitude": 38.909536,
          "longitude": -77.074011
        },
        {
          "latitude": 38.909544,
          "longitude": -77.074011
        },
        {
          "latitude": 38.909563,
          "longitude": -77.074011
        },
        {
          "latitude": 38.909637,
          "longitude": -77.074012
        },
        {
          "latitude": 38.909642,
          "longitude": -77.073946
        },
        {
          "latitude": 38.909676,
          "longitude": -77.073949
        },
        {
          "latitude": 38.909724,
          "longitude": -77.073947
        },
        {
          "latitude": 38.909789,
          "longitude": -77.073944
        },
        {
          "latitude": 38.909888,
          "longitude": -77.073927
        },
        {
          "latitude": 38.910076,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910081,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910419,
          "longitude": -77.073902
        },
        {
          "latitude": 38.91074,
          "longitude": -77.073887
        },
        {
          "latitude": 38.910856,
          "longitude": -77.073922
        },
        {
          "latitude": 38.910957,
          "longitude": -77.073919
        },
        {
          "latitude": 38.911584,
          "longitude": -77.073898
        },
        {
          "latitude": 38.911583,
          "longitude": -77.073834
        },
        {
          "latitude": 38.911536,
          "longitude": -77.073867
        },
        {
          "latitude": 38.911322,
          "longitude": -77.073877
        }
      ],
      "distanceMeters": 825,
      "durationSeconds": 612.343,
      "hasDetectedSteps": true
    },
    "capturedAt": "2026-08-01T16:26:05.006Z"
  },
  {
    "id": "guts-to-epis-accessible",
    "label": "GUTS Bus Loop → Epicurean and Company",
    "origin": {
      "latitude": 38.90703,
      "longitude": -77.07734
    },
    "destination": {
      "latitude": 38.91132,
      "longitude": -77.07382
    },
    "preferAccessible": true,
    "candidate": {
      "coordinates": [
        {
          "latitude": 38.907048,
          "longitude": -77.077301
        },
        {
          "latitude": 38.906985,
          "longitude": -77.077253
        },
        {
          "latitude": 38.906792,
          "longitude": -77.077103
        },
        {
          "latitude": 38.90679,
          "longitude": -77.077004
        },
        {
          "latitude": 38.906789,
          "longitude": -77.076946
        },
        {
          "latitude": 38.906781,
          "longitude": -77.076469
        },
        {
          "latitude": 38.906782,
          "longitude": -77.076421
        },
        {
          "latitude": 38.906793,
          "longitude": -77.076375
        },
        {
          "latitude": 38.906816,
          "longitude": -77.076334
        },
        {
          "latitude": 38.906842,
          "longitude": -77.076303
        },
        {
          "latitude": 38.906874,
          "longitude": -77.076282
        },
        {
          "latitude": 38.906904,
          "longitude": -77.076273
        },
        {
          "latitude": 38.907289,
          "longitude": -77.076268
        },
        {
          "latitude": 38.907307,
          "longitude": -77.076268
        },
        {
          "latitude": 38.907306,
          "longitude": -77.076203
        },
        {
          "latitude": 38.907305,
          "longitude": -77.076143
        },
        {
          "latitude": 38.907327,
          "longitude": -77.076129
        },
        {
          "latitude": 38.907342,
          "longitude": -77.076117
        },
        {
          "latitude": 38.907356,
          "longitude": -77.076093
        },
        {
          "latitude": 38.907363,
          "longitude": -77.07606
        },
        {
          "latitude": 38.907364,
          "longitude": -77.076002
        },
        {
          "latitude": 38.907402,
          "longitude": -77.076002
        },
        {
          "latitude": 38.907454,
          "longitude": -77.076001
        },
        {
          "latitude": 38.907451,
          "longitude": -77.075928
        },
        {
          "latitude": 38.907444,
          "longitude": -77.075805
        },
        {
          "latitude": 38.907442,
          "longitude": -77.07573
        },
        {
          "latitude": 38.907441,
          "longitude": -77.075678
        },
        {
          "latitude": 38.907436,
          "longitude": -77.075221
        },
        {
          "latitude": 38.907434,
          "longitude": -77.07497
        },
        {
          "latitude": 38.907434,
          "longitude": -77.074916
        },
        {
          "latitude": 38.907438,
          "longitude": -77.074892
        },
        {
          "latitude": 38.907548,
          "longitude": -77.074818
        },
        {
          "latitude": 38.908107,
          "longitude": -77.074801
        },
        {
          "latitude": 38.908148,
          "longitude": -77.074788
        },
        {
          "latitude": 38.908173,
          "longitude": -77.074739
        },
        {
          "latitude": 38.908278,
          "longitude": -77.074594
        },
        {
          "latitude": 38.908368,
          "longitude": -77.074399
        },
        {
          "latitude": 38.908449,
          "longitude": -77.074197
        },
        {
          "latitude": 38.908501,
          "longitude": -77.074078
        },
        {
          "latitude": 38.908594,
          "longitude": -77.074065
        },
        {
          "latitude": 38.908586,
          "longitude": -77.074013
        },
        {
          "latitude": 38.908748,
          "longitude": -77.074015
        },
        {
          "latitude": 38.90918,
          "longitude": -77.074025
        },
        {
          "latitude": 38.909238,
          "longitude": -77.074013
        },
        {
          "latitude": 38.909313,
          "longitude": -77.073988
        },
        {
          "latitude": 38.909411,
          "longitude": -77.073946
        },
        {
          "latitude": 38.909514,
          "longitude": -77.07393
        },
        {
          "latitude": 38.9096,
          "longitude": -77.073942
        },
        {
          "latitude": 38.909642,
          "longitude": -77.073946
        },
        {
          "latitude": 38.909676,
          "longitude": -77.073949
        },
        {
          "latitude": 38.909724,
          "longitude": -77.073947
        },
        {
          "latitude": 38.909789,
          "longitude": -77.073944
        },
        {
          "latitude": 38.909888,
          "longitude": -77.073927
        },
        {
          "latitude": 38.910076,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910081,
          "longitude": -77.073911
        },
        {
          "latitude": 38.910419,
          "longitude": -77.073902
        },
        {
          "latitude": 38.91074,
          "longitude": -77.073887
        },
        {
          "latitude": 38.910856,
          "longitude": -77.073922
        },
        {
          "latitude": 38.910957,
          "longitude": -77.073919
        },
        {
          "latitude": 38.911584,
          "longitude": -77.073898
        },
        {
          "latitude": 38.911583,
          "longitude": -77.073834
        },
        {
          "latitude": 38.911536,
          "longitude": -77.073867
        },
        {
          "latitude": 38.911322,
          "longitude": -77.073877
        }
      ],
      "distanceMeters": 832,
      "durationSeconds": 642.209,
      "hasDetectedSteps": false
    },
    "capturedAt": "2026-08-01T16:26:05.782Z"
  }
];

const MATCH_TOLERANCE_METERS = 80;

/**
 * Finds a captured fixture whose origin/destination are close enough to the
 * requested ones to stand in for a live route. Used only as a fallback when
 * the real provider is unavailable (see RealRouteRepository).
 */
export function findMatchingFixture(
  origin: LatLng,
  destination: LatLng,
  preferAccessible: boolean
): DemoRouteFixture | null {
  return (
    DEMO_ROUTE_FIXTURES.find(
      (fixture) =>
        fixture.preferAccessible === preferAccessible &&
        haversineDistanceMeters(origin, fixture.origin) <= MATCH_TOLERANCE_METERS &&
        haversineDistanceMeters(destination, fixture.destination) <= MATCH_TOLERANCE_METERS
    ) ?? null
  );
}
