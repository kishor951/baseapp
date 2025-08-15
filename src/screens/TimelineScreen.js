import React, { useState, useEffect } from 'react';
import { Modal } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimeLogs } from '../context/TimeLogContext';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function parseTimeString(t) {
  if (!t || typeof t !== 'string') return 0;
  try {
    const parts = t.trim().split(' ');
    if (parts.length !== 2) return 0;
    
    const [hm, ap] = parts;
    const timeParts = hm.split(':');
    if (timeParts.length !== 2) return 0;
    
    let [h, m] = timeParts.map(Number);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 12 || m < 0 || m > 59) return 0;
    
    const period = ap.toUpperCase();
    if (period !== 'AM' && period !== 'PM') return 0;
    
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    
    return h * 60 + m;
  } catch (error) {
    // console.error('Error parsing time string:', t, error);
    return 0;
  }
}

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

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i * 30);
const TIMELINE_HEIGHT = 1920; // px for 24 hours, 40px per 30 min
const pxPerMinute = TIMELINE_HEIGHT / (24 * 60);

function getBlockPosition(start, end) {
  // start/end: 'HH:MM AM/PM'
  const startMins = parseTimeString(start);
  const endMins = parseTimeString(end);
  const top = startMins * pxPerMinute;
  const height = Math.max((endMins - startMins) * pxPerMinute, 32); // min height
  return { top, height };
}

import { fetchTimeLogs } from '../utils/databaseApi';

export default function TimelineScreen({ routines = [], idleStart, userId, timeLogs: propTimeLogs }) {
  // Use propTimeLogs if provided, else context, else fetch from DB
  const context = useTimeLogs ? useTimeLogs() : {};
  const [timeLogs, setTimeLogs] = useState(propTimeLogs || context.timeLogs || []);
  const [activeTab, setActiveTab] = useState('Blocks');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [nowY, setNowY] = useState(0);
  const [currentTimeLabel, setCurrentTimeLabel] = useState('');

  // Fetch time logs from DB if not present
  const refreshTimeLogs = () => {
    if (userId) {
      fetchTimeLogs(userId).then(({ data, error }) => {
        if (data) setTimeLogs(data);
      });
    }
  };
  useEffect(() => {
    if ((!timeLogs || timeLogs.length === 0) && userId) {
      refreshTimeLogs();
    }
  }, [userId]);

  // Helper functions - defined early to avoid hoisting issues
  const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  
  // Helper for day info
  const dayInfo = {
    day: days[selectedDate.getDay()],
    date: selectedDate.getDate(),
    month: months[selectedDate.getMonth()],
    year: selectedDate.getFullYear(),
    hour: selectedDate.getHours(),
    minute: selectedDate.getMinutes(),
  };

  // Check if selected date is today
  const isToday = isSameDay(selectedDate, new Date());

  // Live current time line updater
  useEffect(() => {
    function pad(n) { return n < 10 ? '0' + n : n; }
    function updateNowYAndLabel() {
      const now = new Date();
      if (isToday) {
        const mins = now.getHours() * 60 + now.getMinutes();
        setNowY(mins * pxPerMinute);
        setCurrentTimeLabel(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      } else {
        setNowY(null);
        setCurrentTimeLabel('');
      }
    }
    updateNowYAndLabel();
    const interval = setInterval(updateNowYAndLabel, 1000); // update every second
    return () => clearInterval(interval);
  }, [selectedDate, isToday]);

  // Navigation handlers
  const goToPrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };
  const goToNextDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };
  const selectMonth = (monthIdx) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setMonth(monthIdx);
      return d;
    });
    setMonthModalVisible(false);
  };
  
  // Get focus sessions (time logs) for selected day
  const focusSessions = (timeLogs || []).filter(log => {
    // Prefer started_at/ended_at from DB, fallback to start/end
    const startDate = log.started_at ? new Date(log.started_at) : (log.start ? new Date(log.start) : null);
    return startDate && isSameDay(startDate, selectedDate);
  }).map(log => {
    // Use started_at/ended_at for DB logs, fallback to start/end for local logs
    const startDate = log.started_at ? new Date(log.started_at) : (log.start ? new Date(log.start) : null);
    const endDate = log.ended_at ? new Date(log.ended_at) : (log.end ? new Date(log.end) : null);
    // If either is missing, skip this block
    if (!startDate || !endDate) return null;
    // Title: prefer log.title, then tasks.title, then notes, then fallback
    let title = log.title;
    if (!title && log.tasks && log.tasks.title) title = log.tasks.title;
    if (!title && log.notes) title = log.notes;
    if (!title) title = 'Focus Session';
    return {
      id: log.id,
      title,
      start: formatAMPM(startDate),
      end: formatAMPM(endDate),
      type: 'focus',
      description: log.description || log.notes || '',
    };
  }).filter(Boolean);

  // Get routines for selected day (handle overnight routines properly)
  const dailyRoutines = [];
  
  routines.forEach(r => {
    // Convert 24-hour format to 12-hour format if needed
    let formattedTime = r.time;
    if (r.time && r.time.includes(':') && !r.time.includes('AM') && !r.time.includes('PM')) {
      // This is likely in HH:MM:SS format from database, convert to 12-hour format
      const [hours, minutes] = r.time.split(':');
      const h = parseInt(hours);
      const m = parseInt(minutes);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      formattedTime = `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
    }
    
    const endTime = r.duration ? getEndTime(formattedTime, r.duration) : '';
    const startMins = parseTimeString(formattedTime);
    const endMins = parseTimeString(endTime);
    
    // Check if this is an overnight routine (crosses midnight)
    const isOvernightRoutine = endMins < startMins;
    
    if (isOvernightRoutine) {
      // For overnight routines, split into two parts
      
      // Part 1: Show the start portion (from start time to 11:59 PM)
      dailyRoutines.push({
        id: r.id + '-part1',
        title: r.name,
        start: formattedTime,
        end: '11:59 PM',
        type: 'routine',
        description: r.description,
        isOvernightPart: 'start'
      });
      
      // Part 2: Show the end portion (from 12:00 AM to end time)
      dailyRoutines.push({
        id: r.id + '-part2',
        title: r.name,
        start: '12:00 AM',
        end: endTime,
        type: 'routine',
        description: r.description,
        isOvernightPart: 'end'
      });
      
    } else {
      // Regular routine that doesn't cross midnight
      dailyRoutines.push({
        id: r.id,
        title: r.name,
        start: formattedTime,
        end: endTime,
        type: 'routine',
        description: r.description,
      });
    }
  });


  // Combine all blocks and sort by start time
  let activityBlocks = [...focusSessions, ...dailyRoutines];
  activityBlocks = activityBlocks.sort((a, b) => parseTimeString(a.start) - parseTimeString(b.start));

  // Build a new blocks array with non-overlapping idle blocks
  let blocks = [];
  if (activityBlocks.length === 0) {
    // If no activities and it's today, show current idle session
    if (idleStart && isToday) {
      const now = new Date();
      blocks.push({
        id: 'idle-current',
        title: 'Idle Time',
        start: formatAMPM(idleStart),
        end: formatAMPM(now),
        type: 'idle',
      });
    }
  } else {
    // Add idle before first block if needed (today only)
    if (isToday && idleStart) {
      const idleStartMins = parseTimeString(formatAMPM(idleStart));
      const firstBlockStart = parseTimeString(activityBlocks[0].start);
      if (idleStartMins < firstBlockStart) {
        blocks.push({
          id: 'idle-morning',
          title: 'Idle Time',
          start: formatAMPM(idleStart),
          end: activityBlocks[0].start,
          type: 'idle',
        });
      }
    }
    // Add activity blocks and idle gaps between them (today only)
    for (let i = 0; i < activityBlocks.length; i++) {
      blocks.push(activityBlocks[i]);
      if (i < activityBlocks.length - 1 && isToday) {
        const currentEnd = parseTimeString(activityBlocks[i].end);
        const nextStart = parseTimeString(activityBlocks[i + 1].start);
        // Only add idle if gap > 15 min and no overlap
        if (nextStart - currentEnd > 15) {
          blocks.push({
            id: `idle-gap-${i}`,
            title: 'Idle Time',
            start: activityBlocks[i].end,
            end: activityBlocks[i + 1].start,
            type: 'idle',
          });
        }
      }
    }
    // Add idle after last block if needed (today only)
    if (isToday) {
      const lastBlockEnd = parseTimeString(activityBlocks[activityBlocks.length - 1].end);
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (nowMins > lastBlockEnd + 15) {
        blocks.push({
          id: 'idle-current',
          title: 'Idle Time',
          start: activityBlocks[activityBlocks.length - 1].end,
          end: formatAMPM(now),
          type: 'idle',
        });
      }
    }
  }

  function getEndTime(start, duration) {
    try {
      if (!start || !duration) return '';
      
      // start: 'HH:MM AM/PM', duration: minutes
      const parts = start.split(' ');
      if (parts.length !== 2) return '';
      
      const [hm, ap] = parts;
      const timeParts = hm.split(':');
      if (timeParts.length !== 2) return '';
      
      let [h, m] = timeParts.map(Number);
      if (isNaN(h) || isNaN(m)) return '';
      
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      
      let total = h * 60 + m + parseInt(duration);
      
      // Handle overnight scenarios
      if (total >= 24 * 60) {
        total = total % (24 * 60); // Wrap around to next day
      }
      
      let endH = Math.floor(total / 60) % 24;
      let endM = total % 60;
      let endAP = endH >= 12 ? 'PM' : 'AM';
      endH = endH % 12;
      endH = endH ? endH : 12;
      endM = endM < 10 ? '0' + endM : endM;
      return `${endH}:${endM} ${endAP}`;
    } catch (error) {
      // console.error('Error calculating end time:', start, duration, error);
      return '';
    }
  }

  // Get block styling based on type
  function getBlockStyle(type, isOvernightPart) {
    const baseStyle = {
      borderLeftWidth: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    };

    switch (type) {
      case 'focus':
        return {
          ...baseStyle,
          backgroundColor: '#10B981', // Emerald green for focus sessions
          borderLeftColor: '#059669',
          shadowColor: '#10B981',
        };
      case 'routine':
        const routineStyle = {
          ...baseStyle,
          backgroundColor: '#3B82F6', // Bright blue for routines  
          borderLeftColor: '#2563EB',
          shadowColor: '#3B82F6',
        };
        
        // Add special styling for overnight routine parts
        if (isOvernightPart === 'start') {
          return {
            ...routineStyle,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomWidth: 2,
            borderBottomColor: '#FFF',
            borderBottomStyle: 'dashed',
          };
        } else if (isOvernightPart === 'end') {
          return {
            ...routineStyle,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderTopWidth: 2,
            borderTopColor: '#FFF',
            borderTopStyle: 'dashed',
          };
        }
        
        return routineStyle;
      case 'idle':
        return {
          backgroundColor: '#F3F4F6', // Light gray for idle time
          borderLeftWidth: 4,
          borderLeftColor: '#9CA3AF',
          opacity: 0.8,
        };
      default:
        return {
          backgroundColor: '#E5E7EB',
          borderLeftWidth: 4,
          borderLeftColor: '#9CA3AF',
        };
    }
  }

  function getTextColor(type) {
    switch (type) {
      case 'focus':
      case 'routine':
        return '#fff';
      case 'idle':
        return '#666';
      default:
        return '#333';
    }
  }
  const timelineHeight = 400;
  // nowY is managed by useState and useEffect for live current time line
  return (
    <View style={styles.container}>
      {/* Header with date navigation and month dropdown */}
      <View style={styles.timelineHeader}>
        <TouchableOpacity onPress={goToPrevDay}>
          <Ionicons name="chevron-back-outline" size={28} color="#42281A" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '500', marginTop: 2 }}>
              {dayInfo.day}, {dayInfo.date} {dayInfo.month} {dayInfo.year}
            </Text>
            {isToday && (
              <View style={{ 
                marginLeft: 8, 
                backgroundColor: '#10B981', 
                borderRadius: 8, 
                paddingHorizontal: 6, 
                paddingVertical: 2 
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>TODAY</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={refreshTimeLogs} style={{ marginRight: 8 }}>
            <Ionicons name="refresh" size={24} color="#42281A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.monthSelector} onPress={() => setMonthModalVisible(true)}>
            <Text style={styles.monthSelectorText}>{dayInfo.month}</Text>
            <Ionicons name="chevron-down-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextDay}>
            <Ionicons name="chevron-forward-outline" size={28} color="#42281A" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Month picker modal */}
      <Modal visible={monthModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, minWidth: 220 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Select Month</Text>
            {months.map((m, idx) => (
              <TouchableOpacity key={m} style={{ paddingVertical: 8 }} onPress={() => selectMonth(idx)}>
                <Text style={{ fontSize: 16, color: idx === selectedDate.getMonth() ? '#42281A' : '#333', fontWeight: idx === selectedDate.getMonth() ? 'bold' : 'normal' }}>{m}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 16, alignSelf: 'flex-end' }} onPress={() => setMonthModalVisible(false)}>
              <Text style={{ color: '#2176AE', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Blocks' && styles.activeTab]} onPress={() => setActiveTab('Blocks')}>
          <Text style={activeTab === 'Blocks' ? styles.activeTabText : styles.tabText}>Blocks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Summary' && styles.activeTab]} onPress={() => setActiveTab('Summary')}>
          <Text style={activeTab === 'Summary' ? styles.activeTabText : styles.tabText}>Summary</Text>
        </TouchableOpacity>
      </View>
      {/* Timeline Blocks for current day only */}
      {activeTab === 'Blocks' && (
        <View style={{ flex: 1, marginTop: 20 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: TIMELINE_HEIGHT + 40, paddingBottom: 40 }}>
            {/* --- Dynamic Time Scale and Segments --- */}
            {(() => {
              // 1. Gather all unique split points (in minutes): 0, 30, 60, ... + all block start/end times
              let splitPoints = new Set([0, 24 * 60]);
              blocks.forEach(b => {
                splitPoints.add(parseTimeString(b.start));
                splitPoints.add(parseTimeString(b.end));
              });
              for (let m = 0; m < 24 * 60; m += 30) {
                splitPoints.add(m);
              }
              const splitArr = Array.from(splitPoints).sort((a, b) => a - b);
              // 2. Build segments
              const segments = [];
              for (let i = 0; i < splitArr.length - 1; i++) {
                segments.push({ start: splitArr[i], end: splitArr[i + 1] });
              }
              // 3. Render
              return (
                <View style={{ flexDirection: 'row', position: 'relative', minHeight: TIMELINE_HEIGHT, backgroundColor: '#FFF6F5', borderRadius: 16, overflow: 'hidden', marginHorizontal: 20 }}>
                  {/* Time scale - dynamic divisions */}
                  <View style={{ width: 60, paddingVertical: 8 }}>
                    {segments.map(seg => {
                      const h = Math.floor(seg.start / 60);
                      const m = seg.start % 60;
                      const segHeight = (seg.end - seg.start) * pxPerMinute;
                      return (
                        <View key={seg.start} style={{ height: segHeight, justifyContent: 'flex-start' }}>
                          <Text style={{ color: '#42281A', fontSize: 13 }}>{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}</Text>
                        </View>
                      );
                    })}
                  </View>
                  {/* Blocks overlay + live time line */}
                  <View style={{ flex: 1, position: 'relative' }}>
                    {/* Live current time line with label */}
                    {nowY !== null && (
                      <>
                        <View style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: nowY,
                          height: 2,
                          backgroundColor: '#FF6F61',
                          zIndex: 10,
                        }} />
                        <View style={{
                          position: 'absolute',
                          right: 0,
                          top: nowY - 12,
                          backgroundColor: '#FF6F61',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          zIndex: 11,
                        }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{currentTimeLabel}</Text>
                        </View>
                      </>
                    )}
                    {/* Render blocks in each segment */}
                    {/* Enforce a minimum gap between blocks for even appearance */}
                    {(() => {
                      // Stack blocks vertically, never overlap, with minimum gap
                      const MIN_BLOCK_HEIGHT = 40; // px
                      const MIN_BLOCK_GAP = 8; // px
                      let currentY = 0;
                      return blocks.map((block, idx) => {
                        const startMins = parseTimeString(block.start);
                        const endMins = parseTimeString(block.end);
                        let blockHeight = Math.max((endMins - startMins) * pxPerMinute, MIN_BLOCK_HEIGHT);
                        // Always stack blocks, never overlap
                        let top = currentY;
                        let durationMins = 0;
                        if (block.type === 'routine') {
                          const originalRoutine = routines.find(r => r.id === block.id || block.id.startsWith(r.id + '-part'));
                          if (originalRoutine && originalRoutine.duration) {
                            if (block.isOvernightPart === 'start') {
                              const startMins = parseTimeString(block.start);
                              const endOfDayMins = 23 * 60 + 59;
                              durationMins = endOfDayMins - startMins + 1;
                            } else if (block.isOvernightPart === 'end') {
                              const endMins = parseTimeString(block.end);
                              durationMins = endMins;
                            } else {
                              durationMins = parseInt(originalRoutine.duration);
                            }
                          } else if (block.end && block.start) {
                            durationMins = parseTimeString(block.end) - parseTimeString(block.start);
                          }
                        } else if (block.end && block.start) {
                          durationMins = parseTimeString(block.end) - parseTimeString(block.start);
                        }
                        const smallBlock = blockHeight < 48;
                        const blockStyle = getBlockStyle(block.type, block.isOvernightPart);
                        const textColor = getTextColor(block.type);
                        const displayTitle = block.isOvernightPart 
                          ? `${block.title} ${block.isOvernightPart === 'start' ? '(Night)' : '(Morning)'}`
                          : block.title;
                        // Update currentY for next block
                        currentY = top + blockHeight + MIN_BLOCK_GAP;
                        return (
                          <View key={block.id} style={{
                            position: 'absolute',
                            left: 8,
                            right: 8,
                            top,
                            height: blockHeight,
                            borderRadius: 8,
                            padding: 6,
                            ...blockStyle,
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ 
                                fontSize: smallBlock ? 12 : 15, 
                                fontWeight: 'bold',
                                color: textColor,
                              }}>
                                {displayTitle}
                              </Text>
                              <View>
                                <Text style={{ 
                                  fontWeight: 'bold', 
                                  fontSize: smallBlock ? 10 : 13,
                                  color: textColor,
                                }}>
                                  {durationMins} min
                                </Text>
                              </View>
                            </View>
                            {block.description && (
                              <Text style={{ 
                                fontSize: 12, 
                                marginTop: 2,
                                color: textColor,
                                opacity: 0.9,
                              }}>
                                {block.description}
                              </Text>
                            )}
                            <Text style={{ 
                              fontSize: 11, 
                              marginTop: 2,
                              color: textColor,
                              opacity: 0.8,
                            }}>
                              {block.start} - {block.end}
                            </Text>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>
              );
            })()}
          </ScrollView>
        </View>
      )}
      {/* Summary Tab */}
      {activeTab === 'Summary' && (
        <View style={{ flex: 1, marginTop: 20, marginHorizontal: 20 }}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Daily Summary</Text>
            <Text style={styles.summaryDate}>{dayInfo.day}, {dayInfo.date} {dayInfo.month} {dayInfo.year}</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statLabel}>Focus Sessions</Text>
                <Text style={styles.statValue}>
                  {focusSessions.length} sessions ({Math.round(focusSessions.reduce((total, session) => {
                    return total + parseTimeString(session.end) - parseTimeString(session.start);
                  }, 0))} min)
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.statLabel}>Routines</Text>
                <Text style={styles.statValue}>
                  {dailyRoutines.length} routines ({dailyRoutines.reduce((total, routine) => {
                    const originalRoutine = routines.find(r => r.id === routine.id);
                    if (originalRoutine && originalRoutine.duration) {
                      return total + parseInt(originalRoutine.duration);
                    } else if (routine.end && routine.start) {
                      return total + (parseTimeString(routine.end) - parseTimeString(routine.start));
                    }
                    return total;
                  }, 0)} min)
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#9CA3AF' }]} />
                <Text style={styles.statLabel}>Idle Time</Text>
                <Text style={styles.statValue}>
                  {blocks.filter(b => b.type === 'idle').length} periods ({Math.round(blocks.filter(b => b.type === 'idle').reduce((total, idle) => {
                    return total + parseTimeString(idle.end) - parseTimeString(idle.start);
                  }, 0))} min)
                </Text>
              </View>
            </View>

            {/* Activity breakdown */}
            <View style={styles.activityBreakdown}>
              <Text style={styles.breakdownTitle}>Activity Breakdown</Text>
              {blocks.length > 0 ? blocks.map((block, index) => {
                let blockDuration = 0;
                if (block.end && block.start) {
                  blockDuration = Math.max(0, parseTimeString(block.end) - parseTimeString(block.start));
                }
                
                return (
                  <View key={block.id} style={styles.activityItem}>
                    <View style={[styles.activityIndicator, getBlockStyle(block.type)]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle}>{block.title}</Text>
                      <Text style={styles.activityTime}>
                        {block.start} - {block.end} ({blockDuration} min)
                      </Text>
                    </View>
                  </View>
                );
              }) : (
                <Text style={styles.noActivities}>No activities scheduled for this day</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6F5',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  timelineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#42281A',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#42281A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  monthSelectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 6,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#EAD7D1',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#42281A',
  },
  tabText: {
    color: '#42281A',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginHorizontal: 20,
  },
  dayBox: {
    backgroundColor: '#42281A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 50,
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#42281A',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  summaryStats: {
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: '#666',
  },
  activityBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#42281A',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  activityIndicator: {
    width: 8,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
  },
  noActivities: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
