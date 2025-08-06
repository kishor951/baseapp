import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AIInput() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e0e0e0' }}>
      <Ionicons name="camera-outline" size={20} color="#666" />
      <Text style={{ color: '#666', fontSize: 16, flex: 1, marginLeft: 10 }}>Ask Anything...</Text>
      <Ionicons name="mic-outline" size={20} color="#666" />
    </View>
  );
}
