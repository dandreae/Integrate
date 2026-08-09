import * as Notifications from "expo-notifications";
import type { CampusEvent } from "@/types";

/** How long before an event's start time the reminder fires. */
export const REMINDER_LEAD_MINUTES = 30;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function reminderIdentifier(eventId: string): string {
  return `event-reminder-${eventId}`;
}

/** Requests notification permission if not already granted/denied. Safe to call repeatedly. */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Schedules a local reminder `REMINDER_LEAD_MINUTES` before `event.startAt`.
 * Returns false (no-op, nothing scheduled) if permission was denied or the
 * reminder time has already passed — never throws for either of those
 * expected cases.
 */
export async function scheduleEventReminder(event: CampusEvent): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const triggerDate = new Date(new Date(event.startAt).getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
  if (triggerDate.getTime() <= Date.now()) return false;

  await cancelEventReminder(event.id); // avoid a duplicate if a reminder was already scheduled
  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(event.id),
    content: {
      title: event.title,
      body: `Starting in ${REMINDER_LEAD_MINUTES} minutes${event.locationLabel ? ` at ${event.locationLabel}` : ""}.`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return true;
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(eventId));
}
