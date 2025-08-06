import React from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TaskList({ tasks, toggleTaskCompletion, deleteTask }) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 10 }, item.completed && { backgroundColor: '#e8f5e8' }] }>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => toggleTaskCompletion(item.id)}>
            <Ionicons name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={item.completed ? '#000' : '#666'} />
          </TouchableOpacity>
          <Text style={[{ flex: 1, fontSize: 16, color: '#333' }, item.completed && { textDecorationLine: 'line-through', color: '#666' }]}>{item.title}</Text>
          <TouchableOpacity style={{ marginLeft: 10, padding: 5 }}>
            <Ionicons name="create-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 10, padding: 5 }} onPress={() => deleteTask(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
