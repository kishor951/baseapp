import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Timer from '../components/Timer';
import TaskDropdown from '../components/TaskDropdown';
import AIInput from '../components/AIInput';

const TIMER_OPTIONS = [
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
  setInitialTime
}) {
  const [showTimerDropdown, setShowTimerDropdown] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState(TIMER_OPTIONS[4].value); // Default 60 mins

  // Show dropdown only if timer is not running and at initial value
  const isFresh = !isRunning && progress === 0;

  const handleSelectTimer = (value) => {
    setSelectedTimer(value);
    setTimeLeft(value);
    setInitialTime(value);
    setShowTimerDropdown(false);
  };

  return (
    <>
      {/* Task Section */}
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 10 }}>Task</Text>
        <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setShowTaskDropdown(!showTaskDropdown)}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>{currentTask.title}</Text>
          <Text style={{ color: '#fff' }}>▼</Text>
        </TouchableOpacity>
        {showTaskDropdown && (
          <TaskDropdown tasks={tasks} selectTask={selectTask} />
        )}
      </View>
      {/* Timer Type Dropdown */}
      {isFresh && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <TouchableOpacity style={{ backgroundColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }} onPress={() => setShowTimerDropdown(!showTimerDropdown)}>
            <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Medium' }}>Select Timer Type ▼</Text>
          </TouchableOpacity>
          {showTimerDropdown && (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#e0e0e0', maxWidth: 200 }}>
              {TIMER_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => handleSelectTimer(opt.value)}>
                  <Text style={{ fontSize: 16, color: '#333', fontFamily: 'SpaceGrotesk-Regular' }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
      {/* Timer Circle */}
      <Timer timeLeft={timeLeft} isRunning={isRunning} toggleTimer={toggleTimer} progress={progress} />
      {/* Control Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, marginTop: 40 }}>
        <TouchableOpacity style={{ backgroundColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }} onPress={restartTimer}>
          <Text style={{ fontSize: 14, color: '#666', fontWeight: '500', fontFamily: 'DM Sans' }}>Restart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }} onPress={() => addTime(5)}>
          <Text style={{ fontSize: 14, color: '#666', fontWeight: '500', fontFamily: 'DM Sans' }}>+5 Mins</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }} onPress={() => addTime(10)}>
          <Text style={{ fontSize: 14, color: '#666', fontWeight: '500', fontFamily: 'DM Sans' }}>+10 Mins</Text>
        </TouchableOpacity>
      </View>
      {/* AI Assistant */}
      <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
        <AIInput />
      </View>
    </>
  );
}
