import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import TaskList from '../components/TaskList';

export default function TaskRoutineScreen({
  tasks,
  toggleTaskCompletion,
  deleteTask,
  setShowTaskModal
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      {/* Tab Selector */}
      <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 20 }}>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#000', alignItems: 'center', marginHorizontal: 5, borderRadius: 25 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#e0e0e0', alignItems: 'center', marginHorizontal: 5, borderRadius: 25 }}>
          <Text style={{ color: '#666', fontSize: 16, fontWeight: '500' }}>Routines</Text>
        </TouchableOpacity>
      </View>
      {/* Tasks List */}
      <TaskList tasks={tasks} toggleTaskCompletion={toggleTaskCompletion} deleteTask={deleteTask} />
      {/* Create New Task Button */}
      <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 25, paddingVertical: 15, alignItems: 'center', marginBottom: 20 }} onPress={() => setShowTaskModal(true)}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create new Task</Text>
      </TouchableOpacity>
    </View>
  );
}
