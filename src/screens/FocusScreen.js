import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import Timer from '../components/Timer';
import { useTimeLogs } from '../context/TimeLogContext';
import { saveTimeLog, saveSubtask } from '../utils/databaseApi';
import { supabase } from '../utils/supabaseClient';
import TaskDropdown from '../components/TaskDropdown';
import { Modal, TextInput } from 'react-native'; // Added import for Modal and TextInput
import { Ionicons } from '@expo/vector-icons';
import { getSubtasksFromGoogleAI } from '../utils/googleAi';
import AIInput from '../components/AIInput';

const TIMER_OPTIONS = [
  { label: '10 sec (Test)', value: 10 },
  { label: '15 mins', value: 15 * 60 },
  { label: '25 mins', value: 25 * 60 },
  { label: '30 mins', value: 30 * 60 },
  { label: '45 mins', value: 45 * 60 },
  { label: '60 mins', value: 60 * 60 },
];


export default function FocusScreen({
  currentTask,
  tasks,
  showTaskDropdown,
  setShowTaskDropdown,
  selectTask,
  timeLeft,
  isRunning,
  toggleTimer,
  progress,
  restartTimer,
  addTime,
  setTimeLeft,
  setInitialTime,
  onCreateTask, // callback to open create task modal in App.js
  userId // <-- pass userId from App.js
}) {

  const { addTimeLog } = useTimeLogs();
  const [showLogModal, setShowLogModal] = useState(false);
  const [logText, setLogText] = useState('');
  const [logTask, setLogTask] = useState(currentTask);
  const [timerStart, setTimerStart] = useState(null);
  const [timerEnd, setTimerEnd] = useState(null);
  const [logDuration, setLogDuration] = useState(selectedTimer);
  const [logSaving, setLogSaving] = useState(false);
  // Filter out completed tasks
  const incompleteTasks = tasks.filter(task => !task.completed);

  // Subtasks state
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtasksError, setSubtasksError] = useState(null);
  // Helper to get subtasks from DB or generate via AI
  const fetchOrGenerateSubtasks = async (task) => {
    setSubtasksError(null);
    setSubtasksLoading(true);
    setSubtasks([]);
    if (!task || !task.id) {
      setSubtasksLoading(false);
      return;
    }
    // Always fetch subtasks from DB
    try {
      const { data: dbSubtasks, error: dbError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('order_index', { ascending: true });
      if (dbError) {
        setSubtasksError('Failed to fetch subtasks from DB');
        setSubtasksLoading(false);
        return;
      }
      if (dbSubtasks && dbSubtasks.length > 0) {
        setSubtasks(dbSubtasks);
        setSubtasksLoading(false);
        return;
      }
      // If no subtasks in DB, generate via AI
      const aiResult = await getSubtasksFromGoogleAI(task.title);
      let aiSubtasks = Array.isArray(aiResult) ? aiResult : aiResult.subtasks;
      if (aiResult && aiResult.error) {
        setSubtasksError('AI error: ' + aiResult.error);
        console.error('AI subtask error:', aiResult.error, aiResult);
        setSubtasksLoading(false);
        return;
      }
      if (!aiSubtasks || aiSubtasks.length === 0) {
        setSubtasks([]);
        setSubtasksLoading(false);
        return;
      }
      // Save each subtask to DB with order_index
      for (let i = 0; i < aiSubtasks.length; i++) {
        const subtaskTitle = aiSubtasks[i];
        const orderIndex = i + 1;
        try {
          await saveSubtask(task.id, { title: subtaskTitle, completed: false, order_index: orderIndex });
        } catch (e) {
          console.error('Error saving subtask:', e);
        }
      }
      // Fetch again from DB to get saved subtasks (order by order_index)
      const { data: savedSubtasks, error: savedError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('order_index', { ascending: true });
      if (savedError) {
        setSubtasksError('Failed to fetch saved subtasks');
        setSubtasksLoading(false);
        return;
      }
      setSubtasks(savedSubtasks || []);
    } catch (err) {
      setSubtasksError('Failed to get subtasks: ' + (err?.message || err));
      console.error('Subtask fetch/generate error:', err);
    }
    setSubtasksLoading(false);
  };

  useEffect(() => {
    if (isRunning && timeLeft === selectedTimer) {
      setTimerStart(new Date());
      setLogDuration(selectedTimer);
    }
    if (!isRunning && timerStart && timeLeft !== selectedTimer) {
      setTimerEnd(new Date());
    }
  }, [isRunning, timeLeft, selectedTimer]);

  // Fetch/generate subtasks when currentTask changes
  useEffect(() => {
    if (currentTask && currentTask.id) {
      fetchOrGenerateSubtasks(currentTask);
    } else {
      setSubtasks([]);
    }
  }, [currentTask]);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowLogModal(true);
      setLogTask(currentTask);
      setTimerEnd(new Date());
    }
  }, [timeLeft, currentTask]);
  const [showTimerDropdown, setShowTimerDropdown] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState(TIMER_OPTIONS[0].value); // Default 15 mins

  // Ensure selectedTimer persists after restart
  const handleRestart = () => {
    setTimeLeft(selectedTimer);
    setInitialTime(selectedTimer);
    setShowTimerDropdown(false);
    if (typeof restartTimer === 'function') restartTimer(selectedTimer);
  };

  // Ref for dropdown button position
  const dropdownButtonRef = React.useRef();

  // Show dropdown if timer is not running or timer is completed
  const showTimerDropdownInsteadOfRestart = !isRunning || timeLeft === 0;

  const handleSelectTimer = (value) => {
    setSelectedTimer(value);
    setTimeLeft(value);
    setInitialTime(value);
    setShowTimerDropdown(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Task Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, marginTop: 0 }}>
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 10 }}>Task</Text>
          {incompleteTasks.length > 0 ? (
            <>
              <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setShowTaskDropdown(!showTaskDropdown)}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>{currentTask?.title || 'Select a task'}</Text>
                <Text style={{ color: '#fff' }}>▼</Text>
              </TouchableOpacity>
              {/* Floating Dropdown Overlay */}
              {showTaskDropdown && (
                <View style={{ position: 'absolute', top: 75, left: '50%', transform: [{ translateX: -100 }], width: 200, zIndex: 100 }} pointerEvents="box-none">
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      width: 200,
                      height: Math.min(180, incompleteTasks.length * 50 + 10),
                      borderRadius: 10,
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setShowTaskDropdown(false)}
                  >
                    <View style={{
                      backgroundColor: '#fff',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                      width: 200,
                      marginTop: 0,
                      zIndex: 101,
                      elevation: 5,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                    }}
                      pointerEvents="box-none"
                    >
                      {incompleteTasks.map(task => (
                        <TouchableOpacity key={task.id} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%', backgroundColor: '#fff' }} onPress={() => { selectTask(task); setShowTaskDropdown(false); }}>
                          <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center' }}>{task.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: '#000', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
              onPress={onCreateTask}
            >
              <Text style={{ color: '#000', fontSize: 16, fontWeight: '500' }}>Create New Task</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Timer Circle */}
        <Timer timeLeft={timeLeft} isRunning={isRunning} toggleTimer={toggleTimer} progress={progress} />
        {/* Control Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 40, position: 'relative', gap: 4 }}>
          {showTimerDropdownInsteadOfRestart ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <TouchableOpacity
                ref={dropdownButtonRef}
                style={{ backgroundColor: '#bdbdbd', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setShowTimerDropdown(!showTimerDropdown)}
              >
                <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Medium', marginRight: 6 }}>{`${selectedTimer / 60} mins`}</Text>
                <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Medium' }}>▼</Text>
              </TouchableOpacity>
              {showTimerDropdown && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 50,
                    left: '50%',
                    transform: [{ translateX: -100 }],
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    width: 200,
                    height: 180,
                    zIndex: 10,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                  activeOpacity={1}
                  onPress={() => setShowTimerDropdown(false)}
                >
                  <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    width: 200,
                    marginTop: 0,
                    zIndex: 11,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                  }}
                    pointerEvents="box-none"
                  >
                    {TIMER_OPTIONS.map(opt => (
                      <TouchableOpacity key={opt.value} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%', backgroundColor: opt.value === TIMER_OPTIONS[0].value ? '#f5f5f5' : '#fff' }} onPress={() => handleSelectTimer(opt.value)}>
                        <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center' }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={{ backgroundColor: '#bdbdbd', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, zIndex: 1 }} onPress={handleRestart}>
              <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Medium' }}>Restart</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ backgroundColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, zIndex: 1 }} onPress={() => addTime(5)}>
            <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Medium' }}>+5 Mins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, zIndex: 1 }} onPress={() => addTime(10)}>
            <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Medium' }}>+10 Mins</Text>
          </TouchableOpacity>
        </View>
        {/* Subtasks Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Subtasks</Text>
          {subtasksLoading ? (
            <Text style={{ color: '#888', fontStyle: 'italic' }}>Loading subtasks...</Text>
          ) : subtasksError ? (
            <Text style={{ color: 'red' }}>{subtasksError}</Text>
          ) : subtasks && subtasks.length > 0 ? (
            subtasks.map((sub, idx) => (
              <View key={sub.id || idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sub.completed ? '#4caf50' : '#bdbdbd', marginRight: 10 }} />
                <Text style={{ fontSize: 15, color: sub.completed ? '#4caf50' : '#222' }}>{sub.title}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#888', fontStyle: 'italic' }}>No subtasks available.</Text>
          )}
        </View>

        {/* AI Assistant */}
        <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
          <AIInput />
        </View>
        {/* Log Time Overlay Modal */}
        <Modal visible={showLogModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '90%', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' }}>Log your Time</Text>
              <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, alignSelf: 'flex-start' }}>Task</Text>
              <View style={{ width: '100%', marginBottom: 18 }}>
                <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 10, padding: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>{logTask?.title || 'Select a task'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: '#f5f5f5', borderRadius: 16, padding: 18, width: '100%', alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 4 }}>
                  {timerStart && timerEnd
                    ? `${formatAMPM(timerStart)} - ${formatAMPM(timerEnd)}`
                    : '--:-- -- - --:-- --'}
                </Text>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#000' }}>{formatDuration(logDuration)}</Text>
                <Text style={{ fontSize: 16, color: '#666', marginTop: 4 }}>Time Spent</Text>
              </View>
              <View style={{ width: '100%', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 14 }}>
                  <TextInput
                    style={{ flex: 1, height: 48, fontSize: 16 }}
                    placeholder="Tell, What you did?"
                    value={logText}
                    onChangeText={setLogText}
                  />
                  <Ionicons name="mic-outline" size={24} color="#666" style={{ marginLeft: 8 }} />
                </View>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#000', borderRadius: 12, paddingVertical: 16, width: '100%', alignItems: 'center', marginTop: 8, opacity: logSaving ? 0.7 : 1 }}
                disabled={logSaving}
                onPress={async () => {
                  if (logSaving) return;
                  setLogSaving(true);
                  let saveError = null;
                  // Save log to context for timeline
                  if (timerStart && timerEnd && logTask) {
                    const logObj = {
                      title: logTask?.title,
                      description: logText,
                      start: timerStart,
                      end: timerEnd,
                      duration: logDuration,
                      task_id: logTask?.id || null,
                    };
                    addTimeLog({ ...logObj, date: new Date(timerStart).toDateString() }); // keep date for local context only
                    // Save to Supabase if userId is available
                    if (userId) {
                      const dbLog = {
                        activity_type: 'focus',
                        duration_seconds: logObj.duration,
                        notes: logObj.description,
                        started_at: logObj.start,
                        ended_at: logObj.end,
                        task_id: logObj.task_id,
                      };
                      try {
                        const { data, error } = await saveTimeLog(userId, dbLog);
                        if (error) {
                          saveError = error;
                        }
                      } catch (e) {
                        saveError = e;
                      }
                    }
                  }
                  setLogSaving(false);
                  setShowLogModal(false);
                  setLogText('');
                  setTimerStart(null);
                  setTimerEnd(null);
                  setTimeLeft(selectedTimer);
                  setInitialTime(selectedTimer);
                  if (saveError) {
                    alert('Failed to save time log to database: ' + (saveError.message || saveError));
                  }
                }}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{logSaving ? 'Saving...' : 'ENTER'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Helper functions
function formatAMPM(date) {
  if (!date) return '--:-- --';
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min > 0 ? min + ':' : ''}${sec.toString().padStart(2, '0')}`;
}
