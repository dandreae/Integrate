import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACCESSIBLE_ENTRANCE_META, CONSTRUCTION_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface MapLegendProps {
  visible: boolean;
  onClose: () => void;
}

const LEGEND_ITEMS = [
  {
    icon: CONSTRUCTION_META.icon,
    color: CONSTRUCTION_META.color,
    label: "Construction zone",
    description: "An active work area — tap it on the map for details, dates, and accessibility impact.",
  },
  {
    icon: ACCESSIBLE_ENTRANCE_META.icon,
    color: ACCESSIBLE_ENTRANCE_META.color,
    label: "Accessible entrance",
    description: "A step-free entrance with no stairs, shown when \"Accessible entrances\" is on in filters.",
  },
];

export function MapLegend({ visible, onClose }: MapLegendProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close legend" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Map legend</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close legend"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {LEGEND_ITEMS.map((item) => (
          <View key={item.label} style={styles.itemRow}>
            <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={16} color={colors.textInverse} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
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
    paddingBottom: spacing.lg,
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
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  itemDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
