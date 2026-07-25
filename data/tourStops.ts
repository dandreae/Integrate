import type { TourStop } from "@/types";

/**
 * First Day Mode — a curated, ordered guided tour for new students. Every
 * stop points at a real place already in the campus dataset; the narrative
 * fields here (story/whyItMatters/funTip) are tour-specific copy, distinct
 * from that place's own `studentTips` shown elsewhere in the app.
 */
export const TOUR_STOPS: TourStop[] = [
  {
    id: "tour-healy",
    placeId: "healy-hall",
    emoji: "🏰",
    headline: "The building on every postcard.",
    story:
      "Most freshmen try the big front doors first. Turns out almost everyone actually uses the side entrance near Dahlgren Quad.",
    whyItMatters:
      "This is where your campus tour probably started, and where a lot of administrative offices live — you'll walk past it constantly.",
    funTip: "Take your \"I made it\" photo on the front steps, then walk around to the side door to actually get in.",
  },
  {
    id: "tour-lau",
    placeId: "lauinger-library",
    emoji: "📚",
    headline: "Your home base for the next four years.",
    story:
      "Six floors, and the vibe changes completely as you go up — the 2nd floor is basically a common room, floor 3 and up is where people actually get work done.",
    whyItMatters:
      "You'll spend more hours here than you think. Knowing which floor matches your mood saves you from getting distracted, or from group-project noise when you need quiet.",
    funTip: "Book a group study room online early during midterms — they disappear fast.",
  },
  {
    id: "tour-hfsc",
    placeId: "healey-family-student-center",
    emoji: "🛋️",
    headline: "Where campus actually hangs out.",
    story: "Lounges, a rooftop, and study space that stays open way later than the library gets loud.",
    whyItMatters:
      "It's the easiest place to meet people outside of class — and the rooftop at sunset is a top-tier campus moment.",
    funTip: "Go up to the roof around golden hour at least once your first week.",
  },
  {
    id: "tour-leos",
    placeId: "leos-dining-hall",
    emoji: "🍽️",
    headline: "The dining hall everyone just calls \"Leo's\".",
    story: "All-you-can-eat, and Sunday brunch is basically a campus tradition.",
    whyItMatters:
      "This is where your meal plan actually gets used — and where you'll run into people you know, whether you planned to or not.",
    funTip: "Show up before 11am on Sundays, or the brunch line will eat your whole morning.",
  },
  {
    id: "tour-yates",
    placeId: "yates-field-house",
    emoji: "🏋️",
    headline: "Yes, your tuition already paid for this.",
    story: "Full gym, pool, and courts — free with your student ID.",
    whyItMatters:
      "Easy to forget it exists until week six of finals stress. It's already paid for, so there's no reason not to use it.",
    funTip: "Mid-morning and mid-afternoon mean you basically never wait for equipment.",
  },
  {
    id: "tour-hes",
    placeId: "health-education-services",
    emoji: "🩺",
    headline: "Not just for when you're sick.",
    story: "Walk-in health services and wellness resources, tucked near the HFSC.",
    whyItMatters:
      "College is the first time a lot of people manage their own healthcare — knowing where this is before you need it saves a stressful search later.",
    funTip: "Walk-in hours are quietest first thing in the morning.",
  },
  {
    id: "tour-saxbys",
    placeId: "saxbys-georgetown",
    emoji: "☕",
    headline: "Run by students, for students.",
    story: "Campus coffee shop staffed by students — a classic between-class stop.",
    whyItMatters: "You'll be here more than you expect. It's also a real on-campus job if you're looking for one.",
    funTip: "Mobile order ahead — the walk-in line looks longer than it actually moves.",
  },
  {
    id: "tour-red-square",
    placeId: "red-square",
    emoji: "🟥",
    headline: "The crossroads of campus.",
    story: "If someone says \"meet me near Red Square,\" this is it — the brick plaza between the library and the ICC.",
    whyItMatters:
      "It's the most common meeting point and landmark on campus. Learn it now and you'll never be lost giving directions.",
    funTip: "Club tables pop up here most weekday afternoons — a good way to find things to join.",
  },
];
