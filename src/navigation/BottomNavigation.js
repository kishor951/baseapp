import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavigation({ currentScreen, setCurrentScreen }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => setCurrentScreen('Focus')}
      >
        {currentScreen === 'Focus' ? (
          <View style={styles.activeMenuItem}>
            <Ionicons name="radio-button-on" size={24} color="#fff" />
            <Text style={styles.activeNavText}>Focus</Text>
          </View>
        ) : (
          <View style={styles.inactiveMenuItem}>
            <Ionicons name="radio-button-off" size={24} color="#666" />
            <Text style={styles.navTextInactive}>Focus</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => setCurrentScreen('Routines')}
      >
        {currentScreen === 'Routines' ? (
          <View style={styles.activeMenuItem}>
            <Ionicons name="alarm" size={24} color="#fff" />
            <Text style={styles.activeNavText}>Duties</Text>
          </View>
        ) : (
          <View style={styles.inactiveMenuItem}>
            <Ionicons name="alarm-outline" size={24} color="#666" />
            <Text style={styles.navTextInactive}>Duties</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => setCurrentScreen('Jarvin')}
      >
        {currentScreen === 'Jarvin' ? (
          <View style={styles.activeMenuItem}>
            <Ionicons name="flash" size={24} color="#fff" />
            <Text style={styles.activeNavText}>Timvis</Text>
          </View>
        ) : (
          <View style={styles.inactiveMenuItem}>
            <Ionicons name="flash-outline" size={24} color="#666" />
            <Text style={styles.navTextInactive}>Timvis</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => setCurrentScreen('Notes')}
      >
        {currentScreen === 'Notes' ? (
          <View style={styles.activeMenuItem}>
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={styles.activeNavText}>Notes</Text>
          </View>
        ) : (
          <View style={styles.inactiveMenuItem}>
            <Ionicons name="document-text-outline" size={24} color="#666" />
            <Text style={styles.navTextInactive}>Notes</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    alignItems: 'center',
  },
  navTextInactive: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  activeMenuItem: {
    flexDirection: 'column', // Ensure icon and text are stacked vertically
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 56,
  },
  activeNavText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5, // Add margin to separate icon and text
  },
  inactiveMenuItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 56,
  },
});
