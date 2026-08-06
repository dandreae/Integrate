import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { DiscoverPostType, Place } from "@/types";
import { DISCOVER_POST_TYPE_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { PlacePickerSheet } from "@/features/places/PlacePickerSheet";

const POST_TYPES = Object.keys(DISCOVER_POST_TYPE_META) as DiscoverPostType[];

interface ShareDiscoverPostSheetProps {
  visible: boolean;
  places: Place[];
  onCancel: () => void;
  onSubmit: (details: {
    type: DiscoverPostType;
    title?: string;
    description: string;
    placeId: string;
    locationDetail?: string;
  }) => Promise<void>;
}

export function ShareDiscoverPostSheet({ visible, places, onCancel, onSubmit }: ShareDiscoverPostSheetProps) {
  const [type, setType] = useState<DiscoverPostType>("student-post");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedPlace, setLinkedPlace] = useState<Place | null>(null);
  const [locationDetail, setLocationDetail] = useState("");
  const [placePickerVisible, setPlacePickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = description.trim().length > 0 && linkedPlace !== null;

  function reset() {
    setType("student-post");
    setTitle("");
    setDescription("");
    setLinkedPlace(null);
    setLocationDetail("");
    setSubmitting(false);
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  async function handleSubmit() {
    if (!canSubmit || !linkedPlace) return;
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim() || undefined,
        description: description.trim(),
        placeId: linkedPlace.id,
        locationDetail: locationDetail.trim() || undefined,
      });
      reset();
    } catch {
      Alert.alert("Couldn't post", "Something went wrong — try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel} accessibilityLabel="Cancel" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Share with Discover</Text>
          <Pressable onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.smallLabel}>What kind of post?</Text>
        <View style={styles.typeGrid}>
          {POST_TYPES.map((option) => {
            const meta = DISCOVER_POST_TYPE_META[option];
            const active = option === type;
            return (
              <Pressable
                key={option}
                onPress={() => setType(option)}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: active }}
                style={[styles.typeChip, active && { backgroundColor: meta.color }]}
              >
                <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.smallLabel}>Where's this about?</Text>
        {linkedPlace ? (
          <Pressable
            onPress={() => setPlacePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Linked to ${linkedPlace.officialName}, tap to change`}
            style={styles.linkedPlaceRow}
          >
            <Ionicons name="location" size={16} color={colors.accent} />
            <Text style={styles.linkedPlaceText}>{linkedPlace.officialName}</Text>
            <Pressable onPress={() => setLinkedPlace(null)} accessibilityLabel="Remove place link" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setPlacePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Link a campus place — required"
            style={styles.linkPlaceButton}
          >
            <Ionicons name="location-outline" size={16} color={colors.accent} />
            <Text style={styles.linkPlaceButtonLabel}>Link a campus place — required</Text>
          </Pressable>
        )}
        {linkedPlace && (
          <TextInput
            value={locationDetail}
            onChangeText={setLocationDetail}
            placeholder="More specific? (e.g. 3rd floor) — optional"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Location detail"
          />
        )}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title — optional, skip for a quick post"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel="Post title"
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={type === "student-post" ? "What's going on?" : "Details"}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multilineInput]}
          multiline
          accessibilityLabel="Post description"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Post to Discover"
          style={[styles.submitButton, (submitting || !canSubmit) && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitLabel}>{submitting ? "Posting…" : "Post"}</Text>
        </Pressable>
      </SafeAreaView>

      <PlacePickerSheet
        visible={placePickerVisible}
        title="Link a place"
        places={places}
        onClose={() => setPlacePickerVisible(false)}
        onSelect={(place) => {
          setLinkedPlace(place);
          setPlacePickerVisible(false);
        }}
      />
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
    maxHeight: "85%",
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
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  smallLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    minHeight: 40,
  },
  typeLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  typeLabelActive: {
    color: colors.textInverse,
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
  multilineInput: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  linkPlaceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  linkPlaceButtonLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.accent,
  },
  linkedPlaceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
  },
  linkedPlaceText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.accent,
    flex: 1,
  },
  submitButton: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
