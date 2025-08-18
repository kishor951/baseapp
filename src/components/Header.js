import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ setShowJarvinChats, setCurrentScreen }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setShowJarvinChats(true)}>
        <Ionicons name="menu-outline" size={32} color="#666" />
      </TouchableOpacity>
      <Text style={[styles.title, { fontFamily: 'SpaceGrotesk-Bold' }]}>Timvis AI</Text>
      <TouchableOpacity onPress={() => setCurrentScreen('Timeline')}>
        <Ionicons name="calendar-outline" size={32} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 40, // Add consistent space for all platforms
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
});
