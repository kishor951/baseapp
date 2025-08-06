import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export default function TaskDropdown({ tasks, selectTask }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#e0e0e0', maxHeight: 150 }}>
      {tasks.map((task) => (
        <TouchableOpacity key={task.id} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => selectTask(task)}>
          <Text style={{ fontSize: 16, color: '#333' }}>{task.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
