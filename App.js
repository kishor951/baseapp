import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';

import { TimeLogProvider } from './src/context/TimeLogContext';

import useTimer from './src/hooks/useTimer';
import FocusScreen from './src/screens/FocusScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import RoutineScreen from './src/screens/RoutineScreen';

import SplashScreen from './src/screens/SplashScreen';
import JarvinScreen from './src/screens/JarvinScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Jarvin');
  const [timeLogs, setTimeLogs] = useState([]);
  const [idleStart, setIdleStart] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Timer hook
  const {
    timeLeft,
    isRunning,
    initialTime,
    toggleTimer,
    restartTimer,
    addTime,
    progress,
    setTimeLeft,
    setInitialTime,
    setIsRunning,
  } = useTimer(60 * 60);

  // Task management functions
  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: tasks.length + 1,
        title: newTaskTitle.trim(),
        completed: false
      };
      setTasks(prev => {
        const updated = [...prev, newTask];
        setCurrentTask(newTask); // Set the new task as current
        return updated;
      });
      setNewTaskTitle('');
      setShowTaskModal(false);
    }
  };
  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  const selectTask = (task) => {
    setCurrentTask(task);
    setShowTaskDropdown(false);
  };

  React.useEffect(() => {
    Font.loadAsync({
      'SpaceGrotesk-Regular': require('./assets/fonts/Space_Grotesk/static/SpaceGrotesk-Regular.ttf'),
      'SpaceGrotesk-Medium': require('./assets/fonts/Space_Grotesk/static/SpaceGrotesk-Medium.ttf'),
      'SpaceGrotesk-SemiBold': require('./assets/fonts/Space_Grotesk/static/SpaceGrotesk-SemiBold.ttf'),
      'SpaceGrotesk-Bold': require('./assets/fonts/Space_Grotesk/static/SpaceGrotesk-Bold.ttf'),
      'SpaceGrotesk-Light': require('./assets/fonts/Space_Grotesk/static/SpaceGrotesk-Light.ttf'),
      'DMSans-Regular': require('./assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
      'DMSans-Medium': require('./assets/fonts/DM_Sans/static/DMSans-Medium.ttf'),
      'DMSans-SemiBold': require('./assets/fonts/DM_Sans/static/DMSans-SemiBold.ttf'),
      'DMSans-Bold': require('./assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
      'DMSans-Light': require('./assets/fonts/DM_Sans/static/DMSans-Light.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return <AppLoading />;
  }
  // Disable splash screen for testing/development
  // if (showSplash) {
  //   return <SplashScreen onFinish={() => setShowSplash(false)} />;
  // }

  return (
    <TimeLogProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={32} color="#666" />
          <Text style={[styles.title, { fontFamily: 'SpaceGrotesk-Bold' }]}>WorkSight!</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('Timeline')}>
            <Ionicons name="calendar-outline" size={32} color="#666" />
          </TouchableOpacity>
        </View>
        {currentScreen === 'Timeline' && (
          <TimelineScreen
            routines={routines}
            idleStart={idleStart}
          />
        )}

        {currentScreen === 'Focus' && (
          <FocusScreen
            currentTask={currentTask}
            tasks={tasks}
            showTaskDropdown={showTaskDropdown}
            setShowTaskDropdown={setShowTaskDropdown}
            selectTask={selectTask}
            timeLeft={timeLeft}
            isRunning={isRunning}
            toggleTimer={toggleTimer}
            progress={progress}
            restartTimer={restartTimer}
            addTime={addTime}
            setTimeLeft={setTimeLeft}
            setInitialTime={setInitialTime}
            onCreateTask={() => {
              setCurrentScreen('Routines');
              setShowTaskModal(true);
            }}
          />
        )}

        {currentScreen === 'Routines' && (
          <RoutineScreen
            tasks={tasks}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
            setShowTaskModal={setShowTaskModal}
            editTask={(id, newTitle) => {
              setTasks(tasks => tasks.map(task => task.id === id ? { ...task, title: newTitle } : task));
            }}
            routines={routines}
            setRoutines={setRoutines}
          />
        )}

        {currentScreen === 'Jarvin' && (
          <JarvinScreen tasks={tasks} setTasks={setTasks} routines={routines} setRoutines={setRoutines} />
        )}

        {/* Task Creation Modal */}
        <Modal visible={showTaskModal} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter task title"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setShowTaskModal(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={addTask}>
                  <Text style={styles.modalButtonTextPrimary}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('Focus')}
          >
            <Ionicons
              name="radio-button-on"
              size={24}
              color={currentScreen === 'Focus' ? "#000" : "#666"}
            />
            <Text style={currentScreen === 'Focus' ? styles.navText : styles.navTextInactive}>
              Focus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('Routines')}
          >
            <Ionicons
              name="repeat-outline"
              size={24}
              color={currentScreen === 'Routines' ? "#000" : "#666"}
            />
            <Text style={currentScreen === 'Routines' ? styles.navText : styles.navTextInactive}>
              Tasks & Routines
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('Jarvin')}
          >
            <Ionicons
              name="sparkles-outline"
              size={24}
              color={currentScreen === 'Jarvin' ? "#000" : "#666"}
            />
            <Text style={currentScreen === 'Jarvin' ? styles.navText : styles.navTextInactive}>
              Jarvin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('Notes')}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={currentScreen === 'Notes' ? "#000" : "#666"}
            />
            <Text style={currentScreen === 'Notes' ? styles.navText : styles.navTextInactive}>
              Notes
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TimeLogProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  taskSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  taskLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  taskSelector: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-Medium',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    position: 'relative',
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  progressRing: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#000',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  playButton: {
    marginTop: 10,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  controlButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  controlButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'DMSans-Regular',
  },
  aiSection: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  aiInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aiPlaceholder: {
    color: '#666',
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    fontFamily: 'DMSans-Regular',
  },
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
  navText: {
    fontSize: 12,
    color: '#000',
    marginTop: 5,
    fontWeight: '500',
    fontFamily: 'DMSans-Regular',
  },
  navTextInactive: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontFamily: 'DMSans-Regular',
  },
  // New styles for task management
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  taskRoutineScreen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabSelector: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 25,
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
  tasksList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  completedTask: {
    backgroundColor: '#e8f5e8',
  },
  taskCheckbox: {
    marginRight: 15,
  },
  taskItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskAction: {
    marginLeft: 10,
    padding: 5,
  },
  createButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
