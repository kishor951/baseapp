import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import formatTime from '../utils/formatTime';

export default function Timer({ timeLeft, isRunning, toggleTimer, progress }) {
  // Border thickness: starts at 16, reduces to 4 as progress goes to 1
  const borderWidth = 16 - 12 * progress;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, position: 'relative' }}>
      {/* Progress ring first, so timer circle and play button are on top */}
      <View style={{ position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth, borderColor: 'transparent', borderTopColor: progress > 0 ? '#000' : '#e0e0e0', transform: [{ rotate: `${progress * 360}deg` }] }} />
      <View style={{
        width: 250,
        height: 250,
        borderRadius: 125,
        borderWidth,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isRunning ? '#e3f2fd' : '#fff',
      }}>
        <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#000', marginBottom: 10, fontFamily: 'SpaceGrotesk-Bold' }}>{formatTime(timeLeft)}</Text>
        <TouchableOpacity style={{ marginTop: 10 }} onPress={() => {
          console.log('Play/Pause button pressed. isRunning:', isRunning);
          toggleTimer();
        }}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={64} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
