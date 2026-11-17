// src/shared/components/ui/SegmentedControl/SegmentedControl.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/src/theme";
import { fontFamily, fontSize, radius, spacing } from "@/src/theme";

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onSelect,
}: SegmentedControlProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isActive = index === selectedIndex;
        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.segment,
              {
                borderColor: colors.primary,
                backgroundColor: isActive ? colors.primary : "transparent",
              },
              pressed && styles.segmentPressed,
            ]}
            onPress={() => onSelect(index)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.white : colors.primary },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  segment: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  segmentPressed: {
    opacity: 0.75,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
});
