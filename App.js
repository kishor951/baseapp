import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import * as Font from 'expo-font';

import { TimeLogProvider } from './src/context/TimeLogContext';
import { fetchTasks, saveTask, updateTask, toggleTaskCompletion as toggleTaskCompletionAPI, deleteTask as deleteTaskAPI, fetchChatSessions, saveChatSession, fetchMessages, saveMessage, fetchNotes, saveNote, updateNote, deleteNote, saveRoutine, fetchRoutines } from './src/utils/databaseApi';

import useTimer from './src/hooks/useTimer';
import FocusScreen from './src/screens/FocusScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import RoutineScreen from './src/screens/RoutineScreen';

import SplashScreen from './src/screens/SplashScreen';
import JarvinScreen from './src/screens/JarvinScreen';
import SignupScreen from './src/screens/SignupScreen';
import NotesScreen from './src/screens/NotesScreen';
import Header from './src/components/Header';
import BottomNavigation from './src/navigation/BottomNavigation';
import TimerCircle from './src/components/TimerCircle';

export default function App() {
  // Search bar state for Jarvin Chats
  const [chatSearchText, setChatSearchText] = useState('');
  // Jarvin chat sessions and selection
  const [chatSessions, setChatSessions] = useState([
    {
      id: Date.now(),
      title: 'New Chat',
      messages: [
        {
          role: 'SYSTEM',
          text:
            `You are Timvis, a concise, helpful productivity assistant. \nIf the user asks to create tasks (single or multiple), always return a JSON array of objects, each with: title, due_at (ISO 8601, optional), recurrence_rule (RRULE, optional), priority (low|medium|high, optional). \nIf the user asks for a routine, return a JSON object with: name, steps[], timeblocks[]. \nNever output markdown unless requested. Never output plain text for task creation. \nIf the user message contains multiple tasks (comma, list, or any format), extract all task titles and return as an array. \nExample: "create tasks: Buy milk, Walk dog, Call mom" → [{"title": "Buy milk"}, {"title": "Walk dog"}, {"title": "Call mom"}].`
        }
      ]
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState(chatSessions[0].id);
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Focus');
  const [timeLogs, setTimeLogs] = useState([]);
  const [idleStart, setIdleStart] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [showJarvinChats, setShowJarvinChats] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);

  // Helper function to get user ID from various user object structures
  const getUserId = () => {
    if (user?.supabaseUser?.id) return user.supabaseUser.id;
    if (user?.id) return user.id;
    if (user?.user?.id) return user.user.id;
    return null;
  };

  // Load tasks and chat sessions from database when user logs in
  useEffect(() => {
    if (user && !user.skipped) {
      loadTasks();
      loadChatSessions();
      loadNotes();
      loadRoutines();
    }
  }, [user]);

  const loadChatSessions = async () => {
    const userId = getUserId();
    console.log('Loading chat sessions for user ID:', userId);
    if (!userId) {
      console.log('No user ID found, skipping chat sessions load');
      return;
    }
    
    try {
      const { data, error } = await fetchChatSessions(userId);
      if (error) {
        console.error('Error loading chat sessions:', error);
        // Don't show alert, just keep default chat
      } else {
        console.log('Loaded chat sessions:', data);
        if (data && data.length > 0) {
          // Load messages for each chat session
          const sessionsWithMessages = await Promise.all(
            data.map(async (session) => {
              const { data: messages, error: msgError } = await fetchMessages(session.id);
              if (msgError) {
                console.error('Error loading messages for session:', session.id, msgError);
                return {
                  id: session.id,
                  title: session.title,
                  messages: [
                    {
                      role: 'SYSTEM',
                      text: `You are Jarvin, a concise, helpful productivity assistant. \nIf the user asks to create tasks (single or multiple), always return a JSON array of objects, each with: title, due_at (ISO 8601, optional), recurrence_rule (RRULE, optional), priority (low|medium|high, optional). \nIf the user asks for a routine, return a JSON object with: name, steps[], timeblocks[]. \nNever output markdown unless requested. Never output plain text for task creation. \nIf the user message contains multiple tasks (comma, list, or any format), extract all task titles and return as an array. \nExample: "create tasks: Buy milk, Walk dog, Call mom" → [{"title": "Buy milk"}, {"title": "Walk dog"}, {"title": "Call mom"}].`
                    }
                  ]
                };
              }
              return {
                id: session.id,
                title: session.title,
                messages: [
                  {
                    role: 'SYSTEM',
                    text: `You are Jarvin, a concise, helpful productivity assistant. \nIf the user asks to create tasks (single or multiple), always return a JSON array of objects, each with: title, due_at (ISO 8601, optional), recurrence_rule (RRULE, optional), priority (low|medium|high, optional). \nIf the user asks for a routine, return a JSON object with: name, steps[], timeblocks[]. \nNever output markdown unless requested. Never output plain text for task creation. \nIf the user message contains multiple tasks (comma, list, or any format), extract all task titles and return as an array. \nExample: "create tasks: Buy milk, Walk dog, Call mom" → [{"title": "Buy milk"}, {"title": "Walk dog"}, {"title": "Call mom"}].`
                  },
                  ...messages.map(msg => ({
                    role: msg.role.toUpperCase(),
                    text: msg.content
                  }))
                ]
              };
            })
          );
          setChatSessions(sessionsWithMessages);
          setCurrentChatId(sessionsWithMessages[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading chat sessions:', err);
    }
  };

  const loadTasks = async () => {
    const userId = getUserId();
    console.log('Loading tasks for user ID:', userId);
    if (!userId) {
      console.log('No user ID found, skipping task load');
      return;
    }
    
    try {
      setTasksLoading(true);
      const { data, error } = await fetchTasks(userId);
      if (error) {
        console.error('Error loading tasks:', error);
        Alert.alert('Error', 'Failed to load tasks');
      } else {
        console.log('Loaded tasks:', data);
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  const loadNotes = async () => {
    const userId = getUserId();
    console.log('Loading notes for user ID:', userId);
    if (!userId) {
      console.log('No user ID found, skipping notes load');
      return;
    }
    
    try {
      const { data, error } = await fetchNotes(userId);
      if (error) {
        console.error('Error loading notes:', error);
        return;
      }
      console.log('Loaded notes:', data);
      setNotes(data || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const loadRoutines = async () => {
    const userId = getUserId();
    console.log('Loading routines for user ID:', userId);
    if (!userId) {
      console.log('No user ID found, skipping routines load');
      return;
    }
    
    try {
      const { data, error } = await fetchRoutines(userId);
      if (error) {
        console.error('Error loading routines:', error);
        return;
      }
      console.log('Loaded routines:', data);
      // Transform database format to match current UI expectations
      const transformedRoutines = data?.map(routine => ({
        id: routine.id,
        name: routine.name,
        time: routine.schedule_time || '--:-- --',
        duration: routine.estimated_duration_minutes || 0,
        description: routine.description,
        isActive: routine.is_active,
        scheduleDays: routine.schedule_days || []
      })) || [];
      setRoutines(transformedRoutines);
    } catch (err) {
      console.error('Error loading routines:', err);
    }
  };

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

  // Idle tracking - set idle start when app loads and no timer is running
  useEffect(() => {
    if (!isRunning && !idleStart) {
      setIdleStart(new Date());
    }
  }, [isRunning, idleStart]);

  // When timer starts, clear idle tracking
  useEffect(() => {
    if (isRunning && idleStart) {
      setIdleStart(null);
    }
  }, [isRunning]);

  // When timer stops, start idle tracking again
  useEffect(() => {
    if (!isRunning && !idleStart) {
      const timer = setTimeout(() => {
        setIdleStart(new Date());
      }, 1000); // Small delay to avoid rapid toggling
      return () => clearTimeout(timer);
    }
  }, [isRunning, idleStart]);

  // Task management functions
  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setTaskSaving(true);
      const taskData = {
        title: newTaskTitle.trim(),
        completed: false,
        priority: 'medium'
      };

      const { data, error } = await saveTask(userId, taskData);
      if (error) {
        console.error('Error saving task:', error);
        Alert.alert('Error', 'Failed to create task');
        return;
      }

      // Add to local state
      setTasks(prev => [...prev, data]);
      setCurrentTask(data); // Set the new task as current
      setNewTaskTitle('');
      setShowTaskModal(false);
    } catch (err) {
      console.error('Error creating task:', err);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setTaskSaving(false);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    console.log('toggleTaskCompletion called with taskId:', taskId);
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Find the task to get its current completed status
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.log('Task not found with ID:', taskId);
        console.log('Available tasks:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
        return;
      }

      const newCompletedStatus = !task.completed;
      console.log(`Toggling task "${task.title}" (ID: ${taskId}) from ${task.completed} to ${newCompletedStatus}`);
      
      const { data, error } = await toggleTaskCompletionAPI(taskId, newCompletedStatus);
      if (error) {
        console.error('Error toggling task completion:', error);
        Alert.alert('Error', 'Failed to update task');
        return;
      }

      console.log('Database update successful:', data);

      // Update local state
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: newCompletedStatus, completed_at: data.completed_at } : task
        );
        console.log('Updated task in local state:', updatedTasks.find(t => t.id === taskId));
        return updatedTasks;
      });
      
      console.log('Local state update completed');
    } catch (err) {
      console.error('Error toggling task:', err);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const { error } = await deleteTaskAPI(taskId);
      if (error) {
        console.error('Error deleting task:', error);
        Alert.alert('Error', 'Failed to delete task');
        return;
      }

      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Clear current task if it was deleted
      if (currentTask?.id === taskId) {
        setCurrentTask(null);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const editTaskTitle = async (taskId, newTitle) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!newTitle.trim()) return;

    try {
      const { data, error } = await updateTask(taskId, { title: newTitle.trim() });
      if (error) {
        console.error('Error updating task:', error);
        Alert.alert('Error', 'Failed to update task');
        return;
      }

      // Update local state
      setTasks(tasks => tasks.map(task => task.id === taskId ? { ...task, title: newTitle.trim() } : task));
      
      // Update current task if it was edited
      if (currentTask?.id === taskId) {
        setCurrentTask(prev => ({ ...prev, title: newTitle.trim() }));
      }
    } catch (err) {
      console.error('Error updating task:', err);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  // Note management functions
  const addNote = async (noteData, isIdea = false) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const { data, error } = await saveNote(userId, { ...noteData, is_idea: isIdea });
      if (error) {
        console.error('Error saving note:', error);
        Alert.alert('Error', 'Failed to save note');
        return;
      }

      // Update local state
      setNotes(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error saving note:', err);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const updateNoteData = async (noteId, updates) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const { data, error } = await updateNote(noteId, updates);
      if (error) {
        console.error('Error updating note:', error);
        Alert.alert('Error', 'Failed to update note');
        return;
      }

      // Update local state
      setNotes(prev => prev.map(note => note.id === noteId ? { ...note, ...updates } : note));
      return data;
    } catch (err) {
      console.error('Error updating note:', err);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const deleteNoteData = async (noteId) => {
    const userId = getUserId();
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const { error } = await deleteNote(noteId);
      if (error) {
        console.error('Error deleting note:', error);
        Alert.alert('Error', 'Failed to delete note');
        return;
      }

      // Update local state
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      Alert.alert('Error', 'Failed to delete note');
    }
  };

  // Chat management functions
  const createNewChatSession = async (title = 'New Chat') => {
    const userId = getUserId();
    if (!userId) {
      // If no user, create local chat
      const newId = Date.now();
      setChatSessions(sessions => [...sessions, {
        id: newId,
        title,
        messages: [sessions[0].messages[0]] // SYSTEM prompt
      }]);
      setCurrentChatId(newId);
      return newId;
    }

    try {
      const sessionData = {
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await saveChatSession(userId, sessionData);
      if (error) {
        console.error('Error creating chat session:', error);
        // Fallback to local chat
        const newId = Date.now();
        setChatSessions(sessions => [...sessions, {
          id: newId,
          title,
          messages: [sessions[0].messages[0]]
        }]);
        setCurrentChatId(newId);
        return newId;
      }

      const newSession = {
        id: data.id,
        title: data.title,
        messages: [
          {
            role: 'SYSTEM',
            text: `You are Jarvin, a concise, helpful productivity assistant. \nIf the user asks to create tasks (single or multiple), always return a JSON array of objects, each with: title, due_at (ISO 8601, optional), recurrence_rule (RRULE, optional), priority (low|medium|high, optional). \nIf the user asks for a routine, return a JSON object with: name, steps[], timeblocks[]. \nNever output markdown unless requested. Never output plain text for task creation. \nIf the user message contains multiple tasks (comma, list, or any format), extract all task titles and return as an array. \nExample: "create tasks: Buy milk, Walk dog, Call mom" → [{"title": "Buy milk"}, {"title": "Walk dog"}, {"title": "Call mom"}].`
          }
        ]
      };

      setChatSessions(sessions => [...sessions, newSession]);
      setCurrentChatId(data.id);
      return data.id;
    } catch (err) {
      console.error('Error creating chat session:', err);
      // Fallback to local chat
      const newId = Date.now();
      setChatSessions(sessions => [...sessions, {
        id: newId,
        title,
        messages: [sessions[0].messages[0]]
      }]);
      setCurrentChatId(newId);
      return newId;
    }
  };

  // Function for Jarvin to add tasks directly to database
  const addTaskFromJarvin = async (taskData) => {
    const userId = getUserId();
    if (!userId) {
      // If no user, just add to local state
      const newTask = {
        ...taskData,
        id: Date.now() + Math.floor(Math.random() * 10000),
        completed: false
      };
      setTasks(prev => [...prev, newTask]);
      return newTask;
    }

    try {
      const { data, error } = await saveTask(userId, {
        ...taskData,
        completed: false
      });
      if (error) {
        console.error('Error saving task from Jarvin:', error);
        // Fallback to local state
        const newTask = {
          ...taskData,
          id: Date.now() + Math.floor(Math.random() * 10000),
          completed: false
        };
        setTasks(prev => [...prev, newTask]);
        return newTask;
      }

      // Add to local state
      setTasks(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating task from Jarvin:', err);
      // Fallback to local state
      const newTask = {
        ...taskData,
        id: Date.now() + Math.floor(Math.random() * 10000),
        completed: false
      };
      setTasks(prev => [...prev, newTask]);
      return newTask;
    }
  };

  // Function for Jarvin to add routines
  const addRoutineFromJarvin = async (routineData) => {
    const userId = getUserId();
    if (!userId) {
      // If no user, just add to local state
      const newRoutine = {
        ...routineData,
        id: Date.now() + Math.floor(Math.random() * 10000),
        created_at: new Date().toISOString()
      };
      setRoutines(prev => [...prev, newRoutine]);
      return newRoutine;
    }

    try {
      // Helper function to extract and format time
      const extractAndFormatTime = (timeInput) => {
        if (!timeInput) return '00:00:00';
        
        // If it's already in HH:MM:SS format, return it
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeInput)) {
          return timeInput;
        }
        
        // Extract time from text like "6:00 AM" or "Create a routine on skipping at 6:00 AM"
        const timeRegex = /(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)/;
        const timeMatch = timeInput.match(timeRegex);
        
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2];
          const ampm = timeMatch[3].toUpperCase();
          
          // Convert to 24-hour format
          if (ampm === 'PM' && hours !== 12) {
            hours += 12;
          } else if (ampm === 'AM' && hours === 12) {
            hours = 0;
          }
          
          // Format as HH:MM:SS
          return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
        }
        
        // If no time found, default to 00:00:00
        return '00:00:00';
      };

      // Save to database using the imported saveRoutine function
      const dbRoutineData = {
        name: routineData.name,
        description: routineData.description || '',
        schedule_time: extractAndFormatTime(routineData.time || routineData.schedule_time),
        estimated_duration_minutes: Math.round(routineData.duration || routineData.estimated_duration_minutes || 30),
        is_active: true,
        schedule_days: routineData.schedule_days || []
      };

      console.log('Saving routine to database:', dbRoutineData);
      const { data, error } = await saveRoutine(userId, dbRoutineData);
      
      if (error) {
        console.error('Database error saving routine:', error);
        throw error;
      }

      // Transform database response to match UI expectations
      const newRoutine = {
        id: data.id,
        name: data.name,
        time: data.schedule_time,
        duration: data.estimated_duration_minutes,
        description: data.description,
        isActive: data.is_active,
        scheduleDays: data.schedule_days || [],
        created_at: data.created_at
      };

      console.log('Routine saved successfully:', newRoutine);
      setRoutines(prev => [...prev, newRoutine]);
      return newRoutine;
    } catch (err) {
      console.error('Error creating routine from Jarvin:', err);
      // Fallback to local state
      const newRoutine = {
        ...routineData,
        id: Date.now() + Math.floor(Math.random() * 10000),
        created_at: new Date().toISOString()
      };
      setRoutines(prev => [...prev, newRoutine]);
      return newRoutine;
    }
  };

  const saveMessageToDatabase = async (chatSessionId, role, content) => {
    const userId = getUserId();
    if (!userId) return; // Skip database save if no user

    try {
      const messageData = {
        role,
        content,
        created_at: new Date().toISOString()
      };

      const { data, error } = await saveMessage(chatSessionId, messageData);
      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const selectTask = (task) => {
    setCurrentTask(task);
    setShowTaskDropdown(false);
  };

  const [fontError, setFontError] = useState(null);
  React.useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
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
        });
        setFontsLoaded(true);
      } catch (err) {
        setFontError(err.message || 'Font loading failed');
        console.error('Font loading error:', err);
        setFontsLoaded(false);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#222', marginBottom: 12 }}>Loading Timvis AI...</Text>
        {fontError && <Text style={{ color: 'red', fontSize: 16 }}>{fontError}</Text>}
      </SafeAreaView>
    );
  }

  // Show signup screen if user is not signed in
  if (!user) {
    return (
      <SignupScreen
        onSignup={userObj => {
          setUser(userObj);
        }}
        onSkip={() => setUser({ skipped: true })}
      />
    );
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
        <Header setShowJarvinChats={setShowJarvinChats} setCurrentScreen={setCurrentScreen} />

        {/* Jarvin Chats Modal - now shows chat sessions */}
        <Modal visible={showJarvinChats} transparent animationType="none">
          <Animated.View style={{
            flex: 1,
            flexDirection: 'row',
            backgroundColor: 'rgba(0,0,0,0.2)',
            transform: [{ translateX: showJarvinChats ? 0 : -400 }],
            transitionProperty: 'transform',
            transitionDuration: '300ms',
          }}>
            <View style={{ width: 320, backgroundColor: '#f8f8f8', borderRightWidth: 1, borderRightColor: '#eee', height: '100%', paddingTop: 40, position: 'relative' }}>
              <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222' }}>Timvis Chats</Text>
                <TouchableOpacity onPress={() => setShowJarvinChats(false)}>
                  <Ionicons name="chevron-back-outline" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              {/* Search bar for chats */}
              <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 16,
                    backgroundColor: '#fafafa',
                  }}
                  placeholder="Search chats..."
                  value={chatSearchText}
                  onChangeText={setChatSearchText}
                />
              </View>
              <TouchableOpacity onPress={async () => {
                // New chat
                const newChatId = await createNewChatSession('New Chat');
                setShowJarvinChats(false);
              }} style={{ marginTop: 4, marginBottom: 8, paddingHorizontal: 18 }}>
                <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>+ New Chat</Text>
              </TouchableOpacity>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
                {chatSessions
                  .filter(chat => {
                    const search = chatSearchText?.toLowerCase() || '';
                    return (
                      chat.title?.toLowerCase().includes(search) ||
                      chat.messages?.some(m => m.text?.toLowerCase().includes(search))
                    );
                  })
                  .map((chat, idx) => (
                    <TouchableOpacity
                      key={chat.id}
                      onPress={() => {
                        setCurrentChatId(chat.id);
                        setShowJarvinChats(false);
                      }}
                      style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: chat.id === currentChatId ? '#e0e0e0' : '#f8f8f8' }}
                    >
                      <Text style={{ fontSize: 16, color: '#222', fontWeight: chat.id === currentChatId ? 'bold' : 'normal' }} numberOfLines={1}>
                        {chat.title !== 'New Chat' ? chat.title : (chat.messages[1]?.text?.slice(0, 32) || 'New Chat')}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              {/* Profile info pinned at bottom */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#f8f8f8' }}>
                <Text style={{ fontSize: 16, color: '#222', fontWeight: 'bold', marginBottom: 12 }}>
                  {user?.name || user?.supabaseUser?.email || user?.email || 'Profile'}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      'Logout',
                      'Are you sure you want to logout?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Logout', 
                          style: 'destructive',
                          onPress: () => {
                            setUser(null);
                            setTasks([]);
                            setNotes([]);
                            setCurrentTask(null);
                            setShowJarvinChats(false);
                            // Reset chat sessions to default
                            const defaultChatId = Date.now();
                            setChatSessions([{
                              id: defaultChatId,
                              title: 'New Chat',
                              messages: [
                                {
                                  role: 'SYSTEM',
                                  text: `You are Jarvin, a concise, helpful productivity assistant. \nIf the user asks to create tasks (single or multiple), always return a JSON array of objects, each with: title, due_at (ISO 8601, optional), recurrence_rule (RRULE, optional), priority (low|medium|high, optional). \nIf the user asks for a routine, return a JSON object with: name, steps[], timeblocks[]. \nNever output markdown unless requested. Never output plain text for task creation. \nIf the user message contains multiple tasks (comma, list, or any format), extract all task titles and return as an array. \nExample: "create tasks: Buy milk, Walk dog, Call mom" → [{"title": "Buy milk"}, {"title": "Walk dog"}, {"title": "Call mom"}].`
                                }
                              ]
                            }]);
                            setCurrentChatId(defaultChatId);
                          }
                        }
                      ]
                    );
                  }}
                  style={{ 
                    backgroundColor: '#ff4444', 
                    borderRadius: 8, 
                    paddingVertical: 10, 
                    paddingHorizontal: 16, 
                    alignItems: 'center' 
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Click outside to close */}
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowJarvinChats(false)} />
          </Animated.View>
        </Modal>

        {currentScreen === 'Timeline' && (
          <TimelineScreen
            idleStart={idleStart}
            routines={routines}
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
            userId={getUserId()}
          />
        )}

        {currentScreen === 'Routines' && (
          <RoutineScreen
            tasks={tasks}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
            setShowTaskModal={setShowTaskModal}
            editTask={editTaskTitle}
            user={user}
            routines={routines}
            setRoutines={setRoutines}
            loadRoutines={loadRoutines}
          />
        )}

        {currentScreen === 'Jarvin' && (
          <JarvinScreen
            tasks={tasks}
            setTasks={setTasks}
            routines={routines}
            setRoutines={setRoutines}
            notes={notes}
            setNotes={setNotes}
            chatSessions={chatSessions}
            setChatSessions={setChatSessions}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            createNewChatSession={createNewChatSession}
            saveMessageToDatabase={saveMessageToDatabase}
            addTaskFromJarvin={addTaskFromJarvin}
            addRoutineFromJarvin={addRoutineFromJarvin}
            addNote={addNote}
            user={user}
          />
        )}

        {currentScreen === 'Notes' && (
          <NotesScreen 
            notes={notes} 
            setNotes={setNotes}
            user={user}
            addNote={addNote}
            updateNote={updateNoteData}
            deleteNote={deleteNoteData}
          />
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
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary, taskSaving && styles.modalButtonDisabled]} 
                  onPress={addTask}
                  disabled={taskSaving}
                >
                  {taskSaving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <BottomNavigation currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
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
  inactiveMenuItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 56,
  },
  activeMenuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.85)',
  borderRadius: 24,
  paddingHorizontal: 16,
  paddingVertical: 24,
  marginBottom: 2,
  },
  activeNavText: {
  color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DMSans-Regular',
    marginLeft: 8,
  },
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
  modalButtonDisabled: {
    backgroundColor: '#cccccc',
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
