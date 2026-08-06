import type { DiscoverPost } from "@/types";

/**
 * Seeded demo data for MockDiscoverPostRepository — used whenever
 * EXPO_PUBLIC_DISCOVER_MODE isn't "live" (the default). Edit this file to
 * change what shows up in a demo; swap to live Firestore data by setting
 * EXPO_PUBLIC_DISCOVER_MODE=live — see services/repositories/index.ts.
 *
 * These are illustrative/mock posts for demo purposes, not real verified
 * promotions — the app labels the Discover feed accordingly. Every post
 * links a real placeId; none use a free-text-only location.
 */
export const SEEDED_DISCOVER_POSTS: DiscoverPost[] = [
  {
    id: "seed-vittles-smoothie-deal",
    type: "deal",
    title: "$1 off smoothies at Vittles",
    description: "Show your GOCard at checkout this week for a dollar off any smoothie.",
    placeId: "vital-vittles",
    postedAt: "2026-08-05T15:20:00.000Z",
    expiresAt: "2026-08-10T00:00:00.000Z",
    upvotes: 14,
  },
  {
    id: "seed-epis-bogo-deal",
    type: "deal",
    title: "BOGO breakfast sandwiches before 10am",
    description: "Buy one breakfast sandwich, get one half off — mornings only, while supplies last.",
    placeId: "epicurean-and-company",
    postedAt: "2026-08-06T10:05:00.000Z",
    expiresAt: "2026-08-09T00:00:00.000Z",
    upvotes: 9,
  },
  {
    id: "seed-vittles-hours-promo",
    type: "promotion",
    title: "Now open until midnight on weekends",
    description: "Vittles extended their Friday/Saturday hours for the semester — good news for late-night snack runs.",
    placeId: "vital-vittles",
    postedAt: "2026-08-04T11:00:00.000Z",
    upvotes: 22,
  },
  {
    id: "seed-leos-taco-promo",
    type: "promotion",
    title: "Taco bar Thursdays are back",
    description: "Leo's is bringing back the build-your-own taco bar station every Thursday for the semester.",
    placeId: "leos-dining-hall",
    postedAt: "2026-08-04T18:40:00.000Z",
    upvotes: 21,
  },
  {
    id: "seed-fall-kickoff-reminder",
    type: "event",
    title: "Fall Kickoff Concert — don't forget!",
    description: "Reminder that the Fall Kickoff Concert is happening at Red Square later this month.",
    placeId: "red-square",
    postedAt: "2026-08-03T12:00:00.000Z",
    upvotes: 31,
  },
  {
    id: "seed-class-meetup",
    type: "event",
    title: "Class of 2029 casual meetup",
    description: "Grabbing a few tables to hang out and meet other first-years — all welcome, no need to RSVP.",
    placeId: "alumni-square",
    postedAt: "2026-08-06T09:00:00.000Z",
    upvotes: 18,
  },
  {
    id: "seed-lau-quiet-tip",
    type: "student-post",
    description: "lau 3rd floor is a ghost town right now, perfect if you need to actually lock in before finals 👀",
    placeId: "lauinger-library",
    locationDetail: "3rd floor",
    postedAt: "2026-08-06T13:10:00.000Z",
    upvotes: 26,
  },
  {
    id: "seed-leos-line-warning",
    type: "student-post",
    description: "the leo's line is NOT it right now. learn from my pain and go around 1:30 instead of noon",
    placeId: "leos-dining-hall",
    postedAt: "2026-08-06T12:05:00.000Z",
    upvotes: 33,
  },
  {
    id: "seed-healy-lawn-dog",
    type: "student-post",
    description: "someone's golden retriever just crashed our picnic on healy lawn and it was the best part of my day ngl",
    placeId: "healy-lawn",
    postedAt: "2026-08-05T17:45:00.000Z",
    upvotes: 41,
  },
];
