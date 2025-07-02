// app/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useLocalSearchParams } from 'expo-router';

export default function Layout() {
  const { token } = useLocalSearchParams(); // ✅ get token from route

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        initialParams={{ token }} // ✅ pass token here
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        initialParams={{ token }} // ✅ pass token here
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        initialParams={{ token }} // ✅ pass token here
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
