import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams } from 'expo-router';
import haversine from 'haversine-distance';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import config from '../../config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Home() {
  const { token } = useLocalSearchParams();
  const [username, setUsername] = useState('User');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [searchText, setSearchText] = useState(''); // Search state

  const apiBaseUrl = config.API_BASE_URL;

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      alert('Push notifications require a physical device');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permission denied for push notifications');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await AsyncStorage.setItem('push_token', tokenData.data);
    console.log('📬 Expo Push Token:', tokenData.data);
  };

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
      return currentLocation;
    } catch (err) {
      console.error('Location error:', err);
    }
  };

  const notifyNearbyJobs = async (jobs, userLocation) => {
    const radiusKM = Number(await AsyncStorage.getItem('job_radius_km')) || 2;
    for (let job of jobs) {
      if (!job.latitude || !job.longitude) continue;
      const distance = haversine(
        { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
        { latitude: job.latitude, longitude: job.longitude }
      ) / 1000;
      if (distance <= radiusKM) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📢 ${job.job_title}`,
            body: `${job.job_type} at ${job.employer_name}`,
            data: { jobId: job._id },
            sound: 'default',
          },
          trigger: { seconds: 2 },
        });
      }
    }
  };

  const fetchData = async (userLocation) => {
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
      if (Array.isArray(jobData)) {
        setJobs(jobData);
        if (userLocation) {
          await notifyNearbyJobs(jobData, userLocation);
        }
      }
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
    const currentLocation = await initLocation();
    if (currentLocation) {
      await fetchData(currentLocation);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!hasInitialized) {
        setHasInitialized(true);
        registerForPushNotificationsAsync();
        handleRefresh();
      }

      const sub = Notifications.addNotificationResponseReceivedListener(response => {
        const jobId = response.notification.request.content.data?.jobId;
        const job = jobs.find(j => j._id === jobId);
        if (job) {
          setSelectedJob(job);
          setMapRegion({
            latitude: job.latitude,
            longitude: job.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      });

      return () => sub.remove();
    }, [token, jobs, hasInitialized])
  );

  // --- Filtered jobs for search bar ---
  const filteredJobs = jobs.filter(
    job =>
      job.job_title?.toLowerCase().includes(searchText.toLowerCase()) ||
      job.employer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      (job.job_location?.city || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hi {username} 👋</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={setSearchText}
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

      <ScrollView
        style={styles.jobsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" style={{ marginTop: 20 }} />
        ) : (
          filteredJobs.map((job, index) => (
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
