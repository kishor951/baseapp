import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SignupScreen({ onSignup, onSkip }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const googleIds = Constants.expoConfig?.extra?.googleClientIds || {};
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: googleIds.expoClientId,
    iosClientId: googleIds.iosClientId,
    androidClientId: googleIds.androidClientId,
    webClientId: googleIds.webClientId,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      // You can fetch user info here if needed
      onSignup({ name: '', email: '', google: true, token: authentication.accessToken });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TouchableOpacity style={styles.signupButton} onPress={() => onSignup({ name, email, google: false })}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()} disabled={!request}>
        <Ionicons name="logo-google" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.googleButtonText}>Sign Up with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#222',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: '#fafafa',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
