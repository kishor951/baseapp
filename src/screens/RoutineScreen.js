import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskList from '../components/TaskList';
import DateTimePicker from '@react-native-community/datetimepicker';

const initialRoutines = [
  { id: 1, name: 'Yoga time', time: '12:30 AM', duration: 60 },
];

export default function RoutineScreen({
  tasks = [],
  toggleTaskCompletion = () => {},
  deleteTask = () => {},
  setShowTaskModal = () => {},
  editTask = () => {},
  routines = [],
  setRoutines = () => {},
}) {
  const [showModal, setShowModal] = useState(false);
  const [editRoutine, setEditRoutine] = useState(null);
  const [routineName, setRoutineName] = useState('');
  const [routineTime, setRoutineTime] = useState('');
  const [routineDuration, setRoutineDuration] = useState('');
  const [activeTab, setActiveTab] = useState('Tasks');
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [editTaskObj, setEditTaskObj] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationMode, setDurationMode] = useState('preset');
  const [customDuration, setCustomDuration] = useState('');

  const openEditTaskModal = (task) => {
    setEditTaskObj(task);
    setEditTaskTitle(task.title);
    setShowTaskEditModal(true);
  };

  const saveTaskEdit = () => {
    if (!editTaskTitle.trim()) return;
    editTask(editTaskObj.id, editTaskTitle.trim());
    setShowTaskEditModal(false);
  };

  const openEditModal = (routine) => {
    setEditRoutine(routine);
    setRoutineName(routine.name);
    setRoutineTime(routine.time);
    setRoutineDuration(routine.duration.toString());
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditRoutine(null);
    setRoutineName('');
    setRoutineTime('');
    setRoutineDuration('');
    setShowModal(true);
  };

  const saveRoutine = () => {
    if (!routineName.trim() || !routineTime || !(durationMode === 'custom' ? customDuration : routineDuration)) return;
    const durationToSave = durationMode === 'custom' ? customDuration : routineDuration;
    const formattedTime = formatAMPM(routineTime);
    if (editRoutine) {
      setRoutines(routines.map(r => r.id === editRoutine.id ? { ...r, name: routineName, time: formattedTime, duration: parseInt(durationToSave) } : r));
    } else {
      setRoutines([...routines, { id: Date.now(), name: routineName, time: formattedTime, duration: parseInt(durationToSave) }]);
    }
    setShowModal(false);
  };

  const deleteRoutine = (id) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  function formatAMPM(date) {
    if (!date || typeof date === 'string') return date || '--:-- --';
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Tasks' && styles.activeTab]}
          onPress={() => setActiveTab('Tasks')}
        >
          <Text style={activeTab === 'Tasks' ? styles.activeTabText : styles.tabText}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Routines' && styles.activeTab]}
          onPress={() => setActiveTab('Routines')}
        >
          <Text style={activeTab === 'Routines' ? styles.activeTabText : styles.tabText}>Routines</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Tasks' ? (
        <>
          <View style={{ flex: 1, marginHorizontal: 20, marginTop: 20 }}>
            <TaskList
              tasks={tasks}
              toggleTaskCompletion={toggleTaskCompletion}
              deleteTask={deleteTask}
              openEditTaskModal={openEditTaskModal}
            />
      {/* Modal for Edit Task */}
      <Modal visible={showTaskEditModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={editTaskTitle}
              onChangeText={setEditTaskTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowTaskEditModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={saveTaskEdit}>
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowTaskModal(true)}>
            <Text style={styles.addButtonText}>Create new Task</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Routines List */}
          <FlatList
            data={routines}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.routineItem}>
                <View style={styles.routineTimeBox}>
                  <Text style={styles.routineTimeText}>{item.time}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.routineName}>{item.name}</Text>
                  <Text style={styles.routineDuration}>{item.duration} mins</Text>
                </View>
                <TouchableOpacity style={styles.iconButton} onPress={() => openEditModal(item)}>
                  <Ionicons name="pencil" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => deleteRoutine(item.id)}>
                  <Ionicons name="trash" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            style={{ marginHorizontal: 20, marginTop: 20 }}
          />
          {/* Timeline View */}
          <View style={{ marginHorizontal: 20, marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Today's Routine Timeline</Text>
            {routines.length === 0 ? (
              <Text style={{ color: '#42281A', fontSize: 16 }}>No routines for today.</Text>
            ) : (
              routines
                .slice()
                .sort((a, b) => {
                  // Sort by time (assumes format 'HH:MM AM/PM')
                  const parseTime = t => {
                    if (!t) return 0;
                    const [hm, ap] = t.split(' ');
                    let [h, m] = hm.split(':').map(Number);
                    if (ap === 'PM' && h !== 12) h += 12;
                    if (ap === 'AM' && h === 12) h = 0;
                    return h * 60 + m;
                  };
                  return parseTime(a.time) - parseTime(b.time);
                })
                .map(routine => (
                  <View key={routine.id} style={{ backgroundColor: '#EAD7D1', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#42281A' }}>{routine.name}</Text>
                    <Text style={{ fontSize: 14, color: '#42281A' }}>Start: {routine.time} | Duration: {routine.duration} min</Text>
                  </View>
                ))
            )}
          </View>
          {/* Add Routine Button */}
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>Add My Daily Routine</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal for Add/Edit Routine */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editRoutine ? 'Edit Routine' : 'Add Routine'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Routine Name"
              value={routineName}
              onChangeText={setRoutineName}
            />
            {/* Time Picker */}
            <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowTimePicker(true)}>
              <Text style={{ fontSize: 16, color: '#42281A' }}>Start Time: {formatAMPM(routineTime)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={routineTime ? (typeof routineTime === 'string' ? new Date() : routineTime) : new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) setRoutineTime(selectedDate);
                }}
              />
            )}
            {/* Duration Selection */}
            <Text style={{ fontSize: 16, marginBottom: 6 }}>Duration</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {[15, 30, 45, 60, 90, 120].map(dur => (
                <TouchableOpacity
                  key={dur}
                  style={{ backgroundColor: durationMode === 'preset' && routineDuration == dur ? '#42281A' : '#EAD7D1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 }}
                  onPress={() => { setRoutineDuration(dur.toString()); setDurationMode('preset'); }}
                >
                  <Text style={{ color: durationMode === 'preset' && routineDuration == dur ? '#fff' : '#42281A', fontWeight: 'bold' }}>{dur} min</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ backgroundColor: durationMode === 'custom' ? '#42281A' : '#EAD7D1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 }}
                onPress={() => setDurationMode('custom')}
              >
                <Text style={{ color: durationMode === 'custom' ? '#fff' : '#42281A', fontWeight: 'bold' }}>Other</Text>
              </TouchableOpacity>
            </View>
            {durationMode === 'custom' && (
              <TextInput
                style={styles.input}
                placeholder="Enter duration (minutes)"
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="numeric"
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={() => {
                // Use custom duration if selected
                const durationToSave = durationMode === 'custom' ? customDuration : routineDuration;
                const formattedTime = formatAMPM(routineTime);
                if (!routineName.trim() || !routineTime || !durationToSave) return;
                if (editRoutine) {
                  setRoutines(routines.map(r => r.id === editRoutine.id ? { ...r, name: routineName, time: formattedTime, duration: parseInt(durationToSave) } : r));
                } else {
                  setRoutines([...routines, { id: Date.now(), name: routineName, time: formattedTime, duration: parseInt(durationToSave) }]);
                }
                setShowModal(false);
              }}>
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabSelector: {
    flexDirection: 'row',
    marginTop: 30,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ededed',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routineTimeBox: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTimeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  routineName: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
    marginBottom: 2,
  },
  routineDuration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  iconButton: {
    marginLeft: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
  },
  modalButtonPrimary: {
    backgroundColor: '#000',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
