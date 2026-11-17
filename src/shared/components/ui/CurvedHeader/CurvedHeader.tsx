// src/shared/components/ui/CurvedHeader/CurvedHeader.tsx
import { useColors } from "@/src/theme";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CurvedHeaderProps {
  height?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function CurvedHeader({ height = 160, children, style }: CurvedHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.header, { height, backgroundColor: colors.primary }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
});