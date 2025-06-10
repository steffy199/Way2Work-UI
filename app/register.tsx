import { FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';

import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import config from '../config';


WebBrowser.maybeCompleteAuthSession();

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const apiBaseUrl = config.API_BASE_URL;
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    });
    const handleSignUp = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('All fields are required');
        } else if (password !== confirmPassword) {
            Alert.alert('Passwords do not match');
        } else {
            try {
                const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: name,
                        email,
                        password,
                        role: 'user', // or allow user to select role if needed
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    Alert.alert('Error', data.message || 'Registration failed');
                    return;
                }

                Alert.alert('Success', 'Registration successful');
                router.replace('/login');
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.topHalf}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.bottomHalf}>
                <Text style={styles.title}>Create new Account</Text>
                <Text style={styles.subText} onPress={() => router.push('/login')}>Already Registered? Log in here</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    onChangeText={setName}
                    value={name}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    value={email}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    secureTextEntry
                    onChangeText={setConfirmPassword}
                    value={confirmPassword}
                />

                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() => promptAsync()}
                    disabled={!request}
                >
                    <FontAwesome name="google" size={20} color="#DB4437" />
                    <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#002f86',
    },
    topHalf: {
        flex: 0.35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomHalf: {
        flex: 0.65,
        backgroundColor: '#fff',
        borderTopLeftRadius: 60,
        padding: 20,
    },
    logo: {
        height: 120,
        width: 120,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subText: {
        marginBottom: 16,
        color: '#777',
    },
    input: {
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#000',
        padding: 14,
        borderRadius: 10,
        marginTop: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#000',
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        marginTop: 14,
        justifyContent: 'center',
    },
    googleLogo: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
