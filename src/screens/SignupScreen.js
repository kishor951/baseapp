import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SignupScreen({ onSignup, onSkip }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
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
      <Text style={styles.title}>{mode === 'signup' ? 'Create Account' : 'Login'}</Text>
      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {mode === 'signup' ? (
        <TouchableOpacity
          style={styles.signupButton}
          onPress={async () => {
            // Supabase email/password signup
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { name } }
            });
            if (error) {
              alert(error.message);
            } else {
              onSignup({ name, email, password, google: false, supabaseUser: data.user });
            }
          }}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.signupButton}
          onPress={async () => {
            // Supabase email/password login
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) {
              alert(error.message);
            } else {
              onSignup({ email, password, google: false, login: true, supabaseUser: data.user });
            }
          }}
        >
          <Text style={styles.signupButtonText}>Login</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()} disabled={!request}>
        <Ionicons name="logo-google" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.googleButtonText}>{mode === 'signup' ? 'Sign Up with Google' : 'Login with Google'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
          {mode === 'signup' ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </Text>
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
