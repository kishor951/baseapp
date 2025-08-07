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
      {/* AI Assistant */}
      <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
        <AIInput />
      </View>
    </>
  );
}
