import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type {
  AccessibilityFeature,
  AccessibilityReportConfidence,
  DiscoverPostType,
  EventCategory,
  FriendStatus,
  PlaceCategory,
} from "@/types";
import { categoryColors, colors, discoverPostTypeColors, eventCategoryColors, friendStatusColors } from "./theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface CategoryMeta {
  label: string;
  icon: IoniconName;
  color: string;
}

export const PLACE_CATEGORY_META: Record<PlaceCategory, CategoryMeta> = {
  academic: { label: "Academic", icon: "school-outline", color: categoryColors.academic },
  dining: { label: "Dining", icon: "restaurant-outline", color: categoryColors.dining },
  coffee: { label: "Coffee", icon: "cafe-outline", color: categoryColors.coffee },
  study: { label: "Study spaces", icon: "book-outline", color: categoryColors.study },
  landmark: { label: "Landmarks", icon: "flag-outline", color: categoryColors.landmark },
  grocery: { label: "Grocery", icon: "basket-outline", color: categoryColors.grocery },
  parking: { label: "Parking", icon: "car-outline", color: categoryColors.parking },
  resource: { label: "Campus resources", icon: "heart-outline", color: categoryColors.resource },
  gathering: { label: "Gathering spots", icon: "people-outline", color: categoryColors.gathering },
};

export const EVENT_CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  sports: { label: "Sports", icon: "trophy-outline", color: eventCategoryColors.sports },
  concert: { label: "Concert", icon: "musical-notes-outline", color: eventCategoryColors.concert },
  social: { label: "Social", icon: "people-outline", color: eventCategoryColors.social },
  academic: { label: "Academic", icon: "school-outline", color: eventCategoryColors.academic },
  market: { label: "Market", icon: "basket-outline", color: eventCategoryColors.market },
  meeting: { label: "Meeting", icon: "chatbubbles-outline", color: eventCategoryColors.meeting },
};

export const DISCOVER_POST_TYPE_META: Record<DiscoverPostType, CategoryMeta> = {
  promotion: { label: "Promotion", icon: "storefront-outline", color: discoverPostTypeColors.promotion },
  deal: { label: "Deal", icon: "pricetag-outline", color: discoverPostTypeColors.deal },
  event: { label: "Event", icon: "calendar-outline", color: discoverPostTypeColors.event },
  "student-post": {
    label: "Student post",
    icon: "chatbubble-ellipses-outline",
    color: discoverPostTypeColors["student-post"],
  },
};

export const FRIEND_STATUS_META: Record<FriendStatus, CategoryMeta> = {
  studying: { label: "Studying", icon: "book-outline", color: friendStatusColors.studying },
  "in-class": { label: "In class", icon: "school-outline", color: friendStatusColors["in-class"] },
  chilling: { label: "Chilling", icon: "happy-outline", color: friendStatusColors.chilling },
  "free-to-hang": { label: "Free to hang", icon: "people-outline", color: friendStatusColors["free-to-hang"] },
  "grabbing-food": {
    label: "Grabbing food",
    icon: "restaurant-outline",
    color: friendStatusColors["grabbing-food"],
  },
};

export const CONSTRUCTION_META: CategoryMeta = {
  label: "Construction",
  icon: "construct-outline",
  color: categoryColors.construction,
};

export const ACCESSIBLE_ENTRANCE_META: CategoryMeta = {
  label: "Accessible entrances",
  icon: "accessibility-outline",
  color: categoryColors.accessible,
};

export const ACCESSIBILITY_FEATURE_META: Record<AccessibilityFeature, CategoryMeta> = {
  "wheelchair-accessible-entrance": {
    label: "Wheelchair-accessible entrance",
    icon: "accessibility-outline",
    color: categoryColors.accessible,
  },
  elevator: { label: "Elevator", icon: "swap-vertical-outline", color: categoryColors.accessible },
  ramp: { label: "Ramp", icon: "trending-up-outline", color: categoryColors.accessible },
  "accessible-restroom": {
    label: "Accessible restroom",
    icon: "body-outline",
    color: categoryColors.accessible,
  },
  "automatic-doors": {
    label: "Automatic doors",
    icon: "log-in-outline",
    color: categoryColors.accessible,
  },
  "level-access": { label: "Level access, no steps", icon: "remove-outline", color: categoryColors.accessible },
  "accessible-parking": {
    label: "Accessible parking",
    icon: "car-outline",
    color: categoryColors.accessible,
  },
};

export interface AccessibilityConfidenceMeta {
  emoji: string;
  label: string;
  color: string;
}

export const ACCESSIBILITY_CONFIDENCE_META: Record<AccessibilityReportConfidence, AccessibilityConfidenceMeta> = {
  verified: { emoji: "🟢", label: "Recently verified", color: colors.accessible },
  community: { emoji: "🟡", label: "Community reported", color: colors.warning },
  critical: { emoji: "🔴", label: "Multiple users reporting an active problem", color: colors.danger },
};

export const MAP_FILTER_CATEGORIES: PlaceCategory[] = [
  "academic",
  "dining",
  "coffee",
  "study",
  "landmark",
  "grocery",
  "parking",
  "resource",
  "gathering",
];
