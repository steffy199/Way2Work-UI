import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';

import config from '../../config'; // Ensure it has API_BASE_URL

export default function Home() {
  const { token } = useLocalSearchParams(); // ✅ Extract token from route params
  const [username, setUsername] = useState('User');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = config.API_BASE_URL;

  useEffect(() => {
  const fetchData = async () => {
    if (!token) {
      Alert.alert('Unauthorized', 'No token found in route. Please log in.');
      return;
    }

    try {
      // ✅ Corrected URL
      const userRes = await fetch(`${apiBaseUrl}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userRes.ok) setUsername(userData.username);

      const jobRes = await fetch(`${apiBaseUrl}/api/jobs`);
      const jobData = await jobRes.json();
      if (Array.isArray(jobData)) setJobs(jobData);

    } catch (err) {
      console.error('Error loading data:', err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hi {username} 👋</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#999"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : (
        <ScrollView style={styles.jobsContainer}>
          {jobs.map((job, index) => (
            <View key={index} style={styles.jobCard}>
              <Text style={styles.jobTitle}>{job.job_title}</Text>
              <Text style={styles.jobCompany}>{job.employer_name}</Text>
              <Text style={styles.jobDistance}>
                {job.job_location?.city || 'Unknown'}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  jobsContainer: { flex: 1 },
  jobCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  jobTitle: { fontSize: 16, fontWeight: 'bold' },
  jobCompany: { fontSize: 14, color: '#666' },
  jobDistance: { fontSize: 14, color: '#999' },
});
