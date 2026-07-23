import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, radii, shadow, touchTarget } from "@/constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface IconButtonProps {
  icon: IoniconName;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  size?: number;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  active = false,
  size = 22,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        active && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={size}
        color={active ? colors.textInverse : colors.textPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
  buttonActive: {
    backgroundColor: colors.accent,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
