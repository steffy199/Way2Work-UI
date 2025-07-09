import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity
} from 'react-native';
import config from '../../config';

export default function Profile() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();

  const [user, setUser] = useState({
    username: '',
    email: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    if (!token) return Alert.alert('Error', 'Missing auth token');
    axios
      .get(`${config.API_BASE_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setUser({
          username: res.data.username,
          email: res.data.email,
        });
        setUpdatedUser({ username: res.data.username, email: res.data.email, password: '' });
      })
      .catch(() => Alert.alert('Error', 'Could not load profile'));
  }, [token]);

  const handleLogout = () => {
    router.replace('/login');
  };

  const handleUpdate = async () => {
    try {
      const payload: any = {
        username: updatedUser.username,
        email: updatedUser.email,
      };
      if (updatedUser.password) payload.password = updatedUser.password;

      const res = await axios.put(`${config.API_BASE_URL}/api/user/update`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Updated', 'Account updated successfully');
      setUser({
        username: res.data.username,
        email: res.data.email,
      });
      setEditMode(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    }
  };

  const initial = user.username ? user.username[0].toUpperCase() : '?';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.infoSection}>
        {/* <Text style={styles.sectionTitle}>My Account</Text> */}
        {editMode ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={updatedUser.username}
              onChangeText={val => setUpdatedUser(prev => ({ ...prev, username: val }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={updatedUser.email}
              onChangeText={val => setUpdatedUser(prev => ({ ...prev, email: val }))}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={updatedUser.password}
              onChangeText={val => setUpdatedUser(prev => ({ ...prev, password: val }))}
            />
            <Button title="Save Changes" onPress={handleUpdate} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" color="gray" onPress={() => setEditMode(false)} />
          </View>
        ) : (
          <TouchableOpacity style={styles.row} onPress={() => setEditMode(true)}>
            <Text style={styles.sectionTitle}>My Account</Text>
            <Text style={{ color: '#007AFF', fontWeight: '500' }}></Text>
          </TouchableOpacity>
        )}
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

  form: {
    gap: 10,
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 10,
  },

  actions: { marginTop: 10 },
});
