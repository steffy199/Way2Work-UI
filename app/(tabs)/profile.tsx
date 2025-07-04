import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import config from '../../config';

export default function Profile() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [user, setUser] = useState({
    user_id: '',
    username: '',
    email: '',
  });

  useEffect(() => {
    if (!token) return Alert.alert('Error', 'Missing auth token');
    axios
      .get(`${config.API_BASE_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setUser({
          user_id: res.data.user_id,
          username: res.data.username,
          email: res.data.email,
        });
      })
      .catch(() => Alert.alert('Error', 'Could not load profile'));
  }, [token]);

  const handleLogout = () => {
    router.replace('/login');
  };

  // get first initial (or “?” if no username)
  const initial = user.username ? user.username[0].toUpperCase() : '?';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {/* Initials avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value}>{user.user_id}</Text>
        </View>
        {/* add other details here */}
      </View>

      <View style={styles.actions}>
        <View style={{ height: 10 }} />
        <Button title="Logout" color="#d00" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },

  header: { alignItems: 'center', marginBottom: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: '600' },

  name: { fontSize: 24, fontWeight: '600' },
  email: { fontSize: 16, color: '#666', marginTop: 4 },

  infoSection: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  label: { fontSize: 16, color: '#444' },
  value: { fontSize: 16, fontWeight: '500', color: '#000' },

  actions: { marginTop: 10 },
});
