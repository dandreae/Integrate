import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CampusEvent } from "@/types";

const notificationsMock = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

// expo-notifications is a native module — this vitest suite runs in a plain
// node environment (see vitest.config.ts) with no jest-expo/RN setup, so it
// must be mocked rather than imported for real, same reasoning as every
// other pure-logic test in this repo.
vi.mock("expo-notifications", () => notificationsMock);

const { REMINDER_LEAD_MINUTES, cancelEventReminder, scheduleEventReminder } = await import("../eventReminders");

function event(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "e1",
    campusId: "georgetown-university",
    title: "Fall Kickoff Concert",
    startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    date: "2026-08-28",
    category: "concert",
    expectedPopularity: "high",
    source: "seed",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("scheduleEventReminder", () => {
  it("does nothing and returns false when permission is denied", async () => {
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: false });
    notificationsMock.requestPermissionsAsync.mockResolvedValue({ granted: false });

    const scheduled = await scheduleEventReminder(event());

    expect(scheduled).toBe(false);
    expect(notificationsMock.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("schedules a notification identified by the event id when permission is granted", async () => {
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: true });

    const scheduled = await scheduleEventReminder(event({ id: "e42" }));

    expect(scheduled).toBe(true);
    expect(notificationsMock.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "event-reminder-e42" })
    );
  });

  it("schedules the trigger REMINDER_LEAD_MINUTES before the event's startAt", async () => {
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: true });
    const startAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    await scheduleEventReminder(event({ startAt }));

    const call = notificationsMock.scheduleNotificationAsync.mock.calls[0][0];
    const expectedTrigger = new Date(new Date(startAt).getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
    expect(call.trigger.date.getTime()).toBe(expectedTrigger.getTime());
  });

  it("returns false without scheduling when the reminder time has already passed", async () => {
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: true });
    const startAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // starts in 5 min, reminder lead is 30 min

    const scheduled = await scheduleEventReminder(event({ startAt }));

    expect(scheduled).toBe(false);
    expect(notificationsMock.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("cancels any existing reminder before scheduling a new one", async () => {
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: true });

    await scheduleEventReminder(event({ id: "e7" }));

    expect(notificationsMock.cancelScheduledNotificationAsync).toHaveBeenCalledWith("event-reminder-e7");
  });
});

describe("cancelEventReminder", () => {
  it("cancels by the deterministic reminder identifier", async () => {
    await cancelEventReminder("e99");
    expect(notificationsMock.cancelScheduledNotificationAsync).toHaveBeenCalledWith("event-reminder-e99");
  });
});
