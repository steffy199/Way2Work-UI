import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import config from '../../config';

export default function Home() {
  const { token } = useLocalSearchParams();
  const [username, setUsername] = useState('User');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const apiBaseUrl = config.API_BASE_URL;

  const initLocation = async () => {
    try {
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
    } catch (err) {
      console.error('Location error:', err);
    }
  };

  const fetchData = async () => {
    if (!token) {
      Alert.alert('Unauthorized', 'No token found in route. Please log in.');
      return;
    }

    try {
      setLoading(true);
      const userRes = await fetch(`${apiBaseUrl}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
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
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initLocation();
    await fetchData();
  };

  // Load data when screen is focused (like Instagram)
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [token])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hi {username} 👋</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#999"
      />

      {mapRegion && (
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
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
          {selectedJob && (
            <Marker
              coordinate={{
                latitude: selectedJob.latitude,
                longitude: selectedJob.longitude,
              }}
              title={selectedJob.job_title}
              description={selectedJob.job_location?.city}
              pinColor="red"
            />
          )}
        </MapView>
      )}

      {selectedJob && (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>{selectedJob.job_title}</Text>
          <Text style={styles.detailsSubtitle}>
            {selectedJob.job_type} at {selectedJob.employer_name}
          </Text>
          <Text>
            📍 {selectedJob.job_location?.street_address},{' '}
            {selectedJob.job_location?.city},{' '}
            {selectedJob.job_location?.province}{' '}
            {selectedJob.job_location?.postal_code}
          </Text>
          <Text style={{ marginTop: 8 }}>📝 {selectedJob.job_description}</Text>
          <Text style={{ marginTop: 8 }}>📧 {selectedJob.employer_email}</Text>
          <Text>📞 {selectedJob.employer_contact}</Text>
          <Text>👥 Positions: {selectedJob.number_of_positions}</Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setSelectedJob(null);
              if (location) {
                setMapRegion({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                });
              }
            }}
          >
            <Text style={styles.closeButtonText}>Close Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Job List */}
      <ScrollView
        style={styles.jobsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" style={{ marginTop: 20 }} />
        ) : (
          jobs.map((job, index) => (
            <TouchableOpacity
              key={index}
              style={styles.jobCard}
              onPress={() => {
                setSelectedJob(job);
                setMapRegion({
                  latitude: job.latitude,
                  longitude: job.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                });
              }}
            >
              <Text style={styles.jobTitle}>{job.job_title}</Text>
              <Text style={styles.jobCompany}>{job.employer_name}</Text>
              <Text style={styles.jobDistance}>
                {job.job_location?.city || 'Unknown'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  detailsBox: {
    backgroundColor: '#eef0f2',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailsSubtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
