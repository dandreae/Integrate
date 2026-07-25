import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { AccessibilityFeature, PlaceCategory, RoutePreference, RouteWarningSeverity } from "@/types";
import { categoryColors, colors } from "./theme";

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

/**
 * Icon + word pairing for each warning severity — used alongside color so
 * warnings never rely on color alone to communicate meaning.
 */
export const ROUTE_WARNING_SEVERITY_META: Record<RouteWarningSeverity, CategoryMeta> = {
  info: { label: "Info", icon: "information-circle-outline", color: colors.textSecondary },
  caution: { label: "Caution", icon: "alert-circle-outline", color: colors.warning },
  high: { label: "Alert", icon: "warning-outline", color: colors.danger },
};

export const ROUTE_PREFERENCE_META: Record<RoutePreference, CategoryMeta> = {
  fastest: { label: "Fastest", icon: "flash-outline", color: colors.accent },
  accessible: { label: "Accessible", icon: "accessibility-outline", color: colors.accessible },
  avoidConstruction: { label: "Avoid construction", icon: "construct-outline", color: colors.warning },
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
