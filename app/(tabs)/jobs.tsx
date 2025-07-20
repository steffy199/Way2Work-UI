import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import config from '../../config';

const initialForm = {
  job_title: '',
  job_type: null,
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
};

export default function Jobs() {
  const { token } = useLocalSearchParams();
  const [user, setUser] = useState({ user_id: '', email: '', username: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [jobs, setJobs] = useState([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [showJobsList, setShowJobsList] = useState(false);

  const handleChange = (name: string, value: string | null) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = async () => {
    setShowJobsList(false); // 👈 Ensure jobs list is hidden

    if (!showForm) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setForm({
          ...initialForm,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (err) {
        Alert.alert("Location Error", "Could not get location.");
        setForm(initialForm);
      }
    } else {
      setForm(initialForm);
      setRegion(null);
    }

    setShowForm(prev => !prev);
    setEditingJobId(null);
  };

  const fetchUserJobs = async (uid: string) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/jobs/user/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch jobs.');
    }
  };

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

    try {
      if (editingJobId) {
        await axios.put(`${config.API_BASE_URL}/api/jobs/${editingJobId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Updated', 'Job updated successfully.');
      } else {
        await axios.post(`${config.API_BASE_URL}/api/jobs`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Created', 'Job created successfully.');
      }
      resetForm();
      fetchUserJobs(user.user_id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Job operation failed');
    }
  };

  const handleEdit = (job: any) => {
    setForm({
      ...job,
      street_address: job.job_location?.street_address || '',
      city: job.job_location?.city || '',
      province: job.job_location?.province || '',
      postal_code: job.job_location?.postal_code || '',
      latitude: job.latitude.toString(),
      longitude: job.longitude.toString(),
      number_of_positions: job.number_of_positions.toString(),
    });

    setRegion({
      latitude: job.latitude,
      longitude: job.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setEditingJobId(job.job_id);
    setShowForm(true);
    setShowJobsList(false); // 👈 Close jobs list if editing
  };

  const handleDelete = async (job_id: string) => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await axios.delete(`${config.API_BASE_URL}/api/jobs/${job_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Deleted", "Job deleted.");
            fetchUserJobs(user.user_id);
          } catch (err) {
            Alert.alert("Error", "Failed to delete job.");
          }
        }
      }
    ]);
  };

  useEffect(() => {
    const getUser = async () => {
      if (!token) return Alert.alert("Token Missing", "No token found");

      try {
        const res = await axios.get(`${config.API_BASE_URL}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = {
          user_id: res.data.user_id,
          email: res.data.email,
          username: res.data.username,
        };
        setUser(userData);
        fetchUserJobs(userData.user_id);
      } catch (error) {
        Alert.alert("Error", "Could not fetch user info");
      }
    };

    getUser();
  }, [token]);

  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setForm(prev => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hi {user.username || 'User'} 👋</Text>

      <TouchableOpacity style={styles.tabButton} onPress={resetForm}>
        <Text style={styles.tabButtonText}>{showForm ? '➕  Create New Job' : '➕  Create New Job'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => {
          setShowForm(false);           // 👈 Close form
          setShowJobsList(prev => !prev);
        }}
      >
        <Text style={styles.tabButtonText}>{showJobsList ? '📋 My Jobs' : '📋 My Jobs'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TextInput placeholder="Job Title" style={styles.input} value={form.job_title} onChangeText={val => handleChange('job_title', val)} />
          <View style={styles.input}>
            <Picker selectedValue={form.job_type} onValueChange={val => handleChange('job_type', val)}>
              <Picker.Item label="Select Job Type" value={null} />
              <Picker.Item label="Full-Time" value="Full-time" />
              <Picker.Item label="Part-Time" value="Part-time" />
              <Picker.Item label="Contract" value="Contract" />
              <Picker.Item label="Internship" value="Internship" />
              <Picker.Item label="Temporary" value="Temporary" />
              <Picker.Item label="Remote" value="Remote" />
            </Picker>
          </View>
          <TextInput placeholder="Employer Name" style={styles.input} value={form.employer_name} onChangeText={val => handleChange('employer_name', val)} />
          <TextInput placeholder="Street Address" style={styles.input} value={form.street_address} onChangeText={val => handleChange('street_address', val)} />
          <TextInput placeholder="City" style={styles.input} value={form.city} onChangeText={val => handleChange('city', val)} />
          <TextInput placeholder="Province" style={styles.input} value={form.province} onChangeText={val => handleChange('province', val)} />
          <TextInput placeholder="Postal Code" style={styles.input} value={form.postal_code} onChangeText={val => handleChange('postal_code', val)} />
          <TextInput placeholder="Number of Positions" style={styles.input} keyboardType="numeric" value={form.number_of_positions} onChangeText={val => handleChange('number_of_positions', val)} />
          <TextInput placeholder="Employer Email" style={styles.input} value={form.employer_email} onChangeText={val => handleChange('employer_email', val)} />
          <TextInput placeholder="Employer Contact" style={styles.input} value={form.employer_contact} onChangeText={val => handleChange('employer_contact', val)} />
          <TextInput placeholder="Job Description" style={styles.input} multiline numberOfLines={4} value={form.job_description} onChangeText={val => handleChange('job_description', val)} />

          {region && (
  <View style={{ marginVertical: 10 }}>
    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>📍 Tap map to select job location:</Text>
    <MapView style={styles.map} region={region} onPress={onMapPress}>
      {form.latitude && form.longitude && (
        <Marker coordinate={{
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude)
        }} />
      )}
    </MapView>
  </View>
)}


          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{editingJobId ? '💾 Save Changes' : '📤 Submit Job'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showJobsList && jobs.map((job) => (
        <TouchableOpacity key={job.job_id} style={styles.jobCard} onPress={() => handleEdit(job)}>
          <Text style={{ fontWeight: 'bold' }}>{job.job_title}</Text>
          <Text>{job.job_type} • {job.city || job.job_location.city}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => handleEdit(job)}>
              <Text style={{ color: '#1E90FF', fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(job.job_id)}>
              <Text style={{ color: 'red', fontWeight: '600' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  tabButton: {
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  form: { marginTop: 15, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  map: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  jobCard: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
  },
});
