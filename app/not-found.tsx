import { StyleSheet, View } from 'react-native';
import { Link, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
// Removed ThemedView

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
