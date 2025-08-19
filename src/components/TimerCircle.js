import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TimerCircle = ({ timeLeft, isRunning, progress, toggleTimer, restartTimer }) => {
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <TouchableOpacity onPress={toggleTimer}>
          <Text>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={restartTimer}>
          <Text>Restart!</Text>
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.progressRing,
          {
            transform: [{ rotate: `${progress * 360}deg` }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    position: 'relative',
  },
  timerCircle: {
    width: 400, // Increased size
    height: 400, // Increased size
    borderRadius: 150, // Adjusted for new size
    borderWidth: 8,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  progressRing: {
    position: 'absolute',
    width: 400, // Updated size to match timerCircle
    height: 400, // Updated size to match timerCircle
    borderRadius: 200, // Adjusted for new size
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#8d0000ff',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default TimerCircle;
