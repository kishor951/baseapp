import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, FlatList, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskList from '../components/TaskList';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveRoutine, updateRoutine, deleteRoutine as deleteRoutineAPI } from '../utils/databaseApi';

const initialRoutines = [
  { id: 1, name: 'Yoga time', time: '12:30 AM', duration: 60 },
];

export default function RoutineScreen({
  tasks = [],
  toggleTaskCompletion = () => {},
  deleteTask = () => {},
  setShowTaskModal = () => {},
  editTask = () => {},
  user = null, // Add user prop for database operations
  routines = [], // Add routines prop from App.js
  setRoutines = () => {}, // Add setRoutines prop from App.js
  loadRoutines = () => {}, // Add loadRoutines prop from App.js
  completedTasks = [], // Add completedTasks prop for completed tasks
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const [showCompletedTasksModal, setShowCompletedTasksModal] = useState(false);

  // Load routines from database when component mounts
  useEffect(() => {
    // console.log('RoutineScreen - User object:', user);
    if (user && !user.skipped) {
      setLoading(true);
      loadRoutines().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to get user ID from various user object structures
  const getUserId = () => {
    if (user?.supabaseUser?.id) return user.supabaseUser.id;
    if (user?.id) return user.id;
    if (user?.user?.id) return user.user.id;
    return null;
  };

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

  const saveRoutineToDatabase = async () => {
    if (!routineName.trim() || !routineTime || !(durationMode === 'custom' ? customDuration : routineDuration)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const userId = getUserId();
    // console.log('Saving routine for user ID:', userId);
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);
      const durationToSave = durationMode === 'custom' ? customDuration : routineDuration;
      const formattedTime = formatAMPM(routineTime);
      
      // Prepare routine data for database
      const routineData = {
        name: routineName.trim(),
        description: '', // Can be extended later
        schedule_time: typeof routineTime === 'string' ? routineTime : routineTime.toTimeString().slice(0, 8),
        estimated_duration_minutes: parseInt(durationToSave),
        is_active: true,
        schedule_days: [] // Can be extended later for specific days
      };

      let result;
      if (editRoutine) {
        // Update existing routine
        result = await updateRoutine(editRoutine.id, routineData);
      } else {
        // Create new routine
        result = await saveRoutine(userId, routineData);
      }

      const { data, error } = result;
      if (error) {
        // console.error('Error saving routine:', error);
        Alert.alert('Error', 'Failed to save routine');
        return;
      }

      // Reload routines from database to ensure consistency
      await loadRoutines();

      setShowModal(false);
      // Reset form
      setRoutineName('');
      setRoutineTime('');
      setRoutineDuration('');
      setCustomDuration('');
      setDurationMode('preset');
      
    } catch (err) {
      // console.error('Error saving routine:', err);
      Alert.alert('Error', 'Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteRoutineAPI(routineId);
              if (error) {
                // console.error('Error deleting routine:', error);
                Alert.alert('Error', 'Failed to delete routine');
              } else {
                // Reload routines from database to ensure consistency
                await loadRoutines();
              }
            } catch (err) {
              // console.error('Error deleting routine:', err);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
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
              tasks={tasks.filter(task => !task.completed)}
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
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.circleButton} onPress={() => setShowTaskModal(true)}>
              <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, { backgroundColor: '#333', marginTop: 12 }]} onPress={() => setShowCompletedTasksModal(true)}>
              <Ionicons name="checkmark-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Loading indicator */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading routines...</Text>
            </View>
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
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteRoutine(item.id)}>
                      <Ionicons name="trash" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                style={{ marginHorizontal: 20, marginTop: 20 }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="time-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No routines yet</Text>
                    <Text style={styles.emptySubText}>Create your first daily routine</Text>
                  </View>
                }
              />

              {/* Add Routine Button */}
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>Add My Daily Routine</Text>
              </TouchableOpacity>
            </>
          )}
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
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary, saving && styles.modalButtonDisabled]} 
                onPress={saveRoutineToDatabase}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Completed Tasks */}
      <Modal visible={showCompletedTasksModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Completed Tasks</Text>
            <FlatList
              data={tasks.filter(task => task.completed)}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.completedTaskItem}>
                  <TouchableOpacity 
                    style={styles.radioButton}
                    onPress={() => toggleTaskCompletion(item.id)}
                  >
                    <View style={styles.radioButtonInner}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.completedTaskText}>{item.title}</Text>
                  <Text style={styles.completedTaskDate}>
                    {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Completed'}
                  </Text>
                </View>
              )}
              style={{ maxHeight: '80%' }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No completed tasks yet</Text>
                </View>
              }
            />
            <View style={styles.completedTasksModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { flex: 0, paddingHorizontal: 40 }]}
                onPress={() => setShowCompletedTasksModal(false)}
              >
                <Text style={styles.modalButtonTextPrimary}>Close</Text>
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
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  floatingButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    alignItems: 'center',
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  completedTaskItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedTaskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  completedTaskDate: {
    fontSize: 12,
    color: '#666',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  radioButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTasksModalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
