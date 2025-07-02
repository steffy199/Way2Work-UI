import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

import config from '../../config';

export default function Home() {
  const { token } = useLocalSearchParams();
  const [username, setUsername] = useState('User');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const apiBaseUrl = config.API_BASE_URL;

  useEffect(() => {
    const initLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    };

    const fetchData = async () => {
      if (!token) {
        Alert.alert('Unauthorized', 'No token found in route. Please log in.');
        return;
      }

      try {
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

    initLocation();
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

      {/* ✅ Map centered on user location */}
      {mapRegion && (
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Optional: User's marker */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You"
              pinColor="blue"
            />
          )}
        </MapView>
      )}

   

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
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
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
