import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Animated, Easing, Image } from 'react-native';
import icon from '../../assets/icon.png';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SignupScreen({ onSignup, onSkip }) {
  // Glaze animation setup
  const glazeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(glazeAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [glazeAnim]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const googleIds = Constants.expoConfig?.extra?.googleClientIds || {};
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: googleIds.expoClientId,
    iosClientId: googleIds.iosClientId,
    androidClientId: googleIds.androidClientId,
    webClientId: googleIds.webClientId,
  });

  const validateInput = () => {
    setError('');
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (mode === 'signup' && !name.trim()) {
      setError('Name is required for signup');
      return false;
    }
    
    return true;
  };

  const handleAuth = async () => {
    if (!validateInput()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // console.log(`🔄 ${mode === 'signup' ? 'Signing up' : 'Logging in'} user:`, email);
      
      const normalizedEmail = email.trim().toLowerCase();
      
      if (mode === 'signup') {
        // Signup logic
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { 
            data: { 
              name: name.trim(),
              full_name: name.trim()
            } 
          }
        });
        
        if (error) {
          // console.log('❌ Signup error:', error);
          setError(error.message);
        } else if (data?.user) {
          // console.log('✅ Signup successful:', data.user.id);
          
          // Check if email confirmation is required
          if (!data.session) {
            setError('Please check your email for confirmation link');
            setLoading(false);
            return;
          }
          
          // Success - pass consistent user object
          onSignup({ 
            supabaseUser: data.user,
            email: normalizedEmail,
            name: name.trim(),
            google: false
          });
        }
      } else {
        // Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        
        if (error) {
          // console.log('❌ Login error:', error);
          setError(error.message);
        } else if (data?.user) {
          // console.log('✅ Login successful:', data.user.id);
          
          // Success - pass consistent user object
          onSignup({
            supabaseUser: data.user,
            email: normalizedEmail,
            google: false,
            login: true
          });
        }
      }
    } catch (err) {
      // console.log('💥 Unexpected auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      onSignup({ 
        google: true, 
        token: authentication.accessToken,
        name: '', 
        email: '' 
      });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      {/* Animated App Icon with glaze effect */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 90, height: 90, justifyContent: 'center', alignItems: 'center' }}>
          <Image source={icon} style={{ width: 80, height: 80, borderRadius: 0 }} />
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.18)',
              opacity: 0.7,
              transform: [
                {
                  translateX: glazeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 80],
                  }),
                },
                {
                  rotateZ: glazeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-15deg', '15deg'],
                  }),
                },
              ],
            }}
          />
        </View>

      </View>
      <Text style={styles.title}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          editable={!loading}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity
        style={[styles.signupButton, loading && styles.disabledButton]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.signupButtonText}>
              {mode === 'signup' ? 'Creating...' : 'Signing In...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.signupButtonText}>
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </Text>
        )}
      </TouchableOpacity>
      
  {/* Google and Guest buttons removed as requested */}
      
      <TouchableOpacity 
        style={{ marginTop: 16 }} 
        onPress={() => {
          setMode(mode === 'signup' ? 'login' : 'signup');
          setError('');
        }}
        disabled={loading}
      >
        <Text style={styles.switchModeText}>
          {mode === 'signup' 
            ? 'Already have an account? Sign In' 
            : "Don't have an account? Create Account"}
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
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  switchModeText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
