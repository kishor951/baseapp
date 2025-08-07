import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import formatTime from '../utils/formatTime';

export default function Timer({ timeLeft, isRunning, toggleTimer, progress }) {
  // Timer circle dimensions
  const size = 250;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Reverse: start full, reduce as time passes
  const progressOffset = circumference * progress;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
      <View style={{ position: 'absolute', zIndex: 1 }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#000"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference},${circumference}`}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
      </View>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'absolute', zIndex: 2 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 56, color: '#000', fontFamily: 'SpaceGrotesk-Bold', textAlign: 'center', marginBottom: 8 }}>{formatTime(timeLeft)}</Text>
          <TouchableOpacity style={{ marginTop: 0 }} onPress={toggleTimer}>
            <Ionicons name={isRunning ? 'pause' : 'play'} size={64} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Spacer to keep layout */}
      <View style={{ width: size, height: size, opacity: 0 }} />
    </View>
  );
}
