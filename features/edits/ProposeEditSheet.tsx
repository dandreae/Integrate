import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Place } from "@/types";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";

type SheetView = "menu" | "rename-search" | "rename-form";

interface ProposeEditSheetProps {
  visible: boolean;
  places: Place[];
  onClose: () => void;
  onSubmitRename: (place: Place, newName: string) => Promise<void>;
  onStartConstructionReport: () => void;
}

export function ProposeEditSheet({
  visible,
  places,
  onClose,
  onSubmitRename,
  onStartConstructionReport,
}: ProposeEditSheetProps) {
  const [view, setView] = useState<SheetView>("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setView("menu");
    setSearchQuery("");
    setSelectedPlace(null);
    setNewName("");
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelectPlace(place: Place) {
    setSelectedPlace(place);
    setNewName(place.localName ?? place.officialName);
    setView("rename-form");
  }

  async function handleSubmitRename() {
    if (!selectedPlace || !newName.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitRename(selectedPlace, newName.trim());
      handleClose();
    } catch {
      Alert.alert("Couldn't submit", "Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return places;
    return places.filter(
      (place) =>
        place.officialName.toLowerCase().includes(query) ||
        place.localName?.toLowerCase().includes(query)
    );
  }, [places, searchQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />

        {view === "menu" && (
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Suggest an edit</Text>
              <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.helperText}>
              Edits apply once 10 other students confirm them.
            </Text>

            <Pressable
              onPress={() => setView("rename-search")}
              accessibilityRole="button"
              accessibilityLabel="Suggest a rename"
              style={styles.menuCard}
            >
              <Ionicons name="text-outline" size={22} color={colors.accent} />
              <View style={styles.menuCardText}>
                <Text style={styles.menuCardTitle}>Suggest a rename</Text>
                <Text style={styles.menuCardSubtitle}>Propose a different name for a place</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => {
                reset();
                onStartConstructionReport();
              }}
              accessibilityRole="button"
              accessibilityLabel="Report construction"
              style={styles.menuCard}
            >
              <Ionicons name="construct-outline" size={22} color={colors.accent} />
              <View style={styles.menuCardText}>
                <Text style={styles.menuCardTitle}>Report construction</Text>
                <Text style={styles.menuCardSubtitle}>Tap points on the map to mark the area</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {view === "rename-search" && (
          <View>
            <View style={styles.headerRow}>
              <Pressable onPress={() => setView("menu")} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.title}>Pick a place</Text>
              <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search places"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Search places to rename"
            />
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {filteredPlaces.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => handleSelectPlace(place)}
                  accessibilityRole="button"
                  accessibilityLabel={place.officialName}
                  style={styles.placeRow}
                >
                  <Text style={styles.placeRowTitle}>{place.officialName}</Text>
                  {place.localName && <Text style={styles.placeRowSubtitle}>{place.localName}</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {view === "rename-form" && selectedPlace && (
          <View>
            <View style={styles.headerRow}>
              <Pressable onPress={() => setView("rename-search")} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.title}>Suggest a rename</Text>
              <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.helperText}>Currently: {selectedPlace.officialName}</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New name"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="New name"
            />
            <Pressable
              onPress={handleSubmitRename}
              disabled={submitting || !newName.trim()}
              accessibilityRole="button"
              accessibilityLabel="Submit rename suggestion"
              style={[
                styles.submitButton,
                (submitting || !newName.trim()) && styles.submitButtonDisabled,
              ]}
            >
              <Text style={styles.submitLabel}>{submitting ? "Submitting…" : "Submit for confirmation"}</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    maxHeight: "75%",
    ...shadow.floating,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: touchTarget.minimum,
    ...shadow.card,
  },
  menuCardText: {
    flex: 1,
  },
  menuCardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  menuCardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 320,
  },
  placeRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  placeRowTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  placeRowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  submitButton: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
