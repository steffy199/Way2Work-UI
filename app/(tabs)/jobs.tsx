import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import config from '../../config';

export default function Jobs() {
  const { token } = useLocalSearchParams(); // ✅ same as home.tsx
  const [user, setUser] = useState({ user_id: '', email: '', username: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    job_title: '',
    job_type: 'Full-time',
    employer_name: '',
    street_address: '',
    city: '',
    province: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    number_of_positions: '1',
    employer_email: '',
    employer_contact: '',
    job_description: '',
  });

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const getUser = async () => {
      if (!token) {
        Alert.alert("Token Missing", "No token found in jobs.tsx");
        return;
      }
      try {
        const res = await axios.get(`${config.API_BASE_URL}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          setUser({
            user_id: res.data.user_id,
            email: res.data.email,
            username: res.data.username,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "Could not fetch user info");
      }
    };

    getUser();
  }, [token]);

  const handleSubmit = async () => {
  const payload = {
    ...form,
    latitude: parseFloat(form.latitude),
    longitude: parseFloat(form.longitude),
    number_of_positions: parseInt(form.number_of_positions),
    job_location: {
      street_address: form.street_address,
      city: form.city,
      province: form.province,
      postal_code: form.postal_code,
    },
    created_by: {
      user_id: user.user_id,
      email: user.email,
    },
  };

  console.log("JWT Token:", token); // Optional: for confirmation
  console.log("Payload being submitted:\n", JSON.stringify(payload, null, 2));

  try {
    await axios.post(`${config.API_BASE_URL}/api/jobs`, payload, {
      headers: { Authorization: `Bearer ${token}` }, // ✅ FIXED
    });
    Alert.alert('Success', 'Job created successfully!');
    setShowForm(false);
  } catch (err: any) {
    console.error('Create job error:', err.response?.data || err.message);
    Alert.alert('Error', err.response?.data?.message || 'Failed to create job');
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hi {user.username || 'User'} 👋</Text>
      <Button title={showForm ? 'Cancel' : 'Create New Job'} onPress={() => setShowForm(!showForm)} />

      {showForm && (
        <View style={styles.form}>
          <TextInput placeholder="Job Title" style={styles.input} onChangeText={(val) => handleChange('job_title', val)} />
          <TextInput placeholder="Job Type (e.g. Full-time)" style={styles.input} onChangeText={(val) => handleChange('job_type', val)} />
          <TextInput placeholder="Employer Name" style={styles.input} onChangeText={(val) => handleChange('employer_name', val)} />
          <TextInput placeholder="Street Address" style={styles.input} onChangeText={(val) => handleChange('street_address', val)} />
          <TextInput placeholder="City" style={styles.input} onChangeText={(val) => handleChange('city', val)} />
          <TextInput placeholder="Province" style={styles.input} onChangeText={(val) => handleChange('province', val)} />
          <TextInput placeholder="Postal Code" style={styles.input} onChangeText={(val) => handleChange('postal_code', val)} />
          <TextInput placeholder="Latitude" keyboardType="numeric" style={styles.input} onChangeText={(val) => handleChange('latitude', val)} />
          <TextInput placeholder="Longitude" keyboardType="numeric" style={styles.input} onChangeText={(val) => handleChange('longitude', val)} />
          <TextInput placeholder="Number of Positions" keyboardType="numeric" style={styles.input} onChangeText={(val) => handleChange('number_of_positions', val)} />
          <TextInput placeholder="Employer Email" style={styles.input} onChangeText={(val) => handleChange('employer_email', val)} />
          <TextInput placeholder="Employer Contact" style={styles.input} onChangeText={(val) => handleChange('employer_contact', val)} />
          <TextInput placeholder="Job Description" multiline numberOfLines={4} style={styles.input} onChangeText={(val) => handleChange('job_description', val)} />

          <Button title="Submit Job" onPress={handleSubmit} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  form: {
    marginTop: 15,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});
