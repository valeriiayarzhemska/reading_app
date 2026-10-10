import { Text, View, StyleSheet } from "react-native";
import { BookFormat } from "@reading/shared";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Formats from @reading/shared:</Text>
      <Text>{Object.values(BookFormat).join(", ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
