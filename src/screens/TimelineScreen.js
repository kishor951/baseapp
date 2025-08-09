import React, { useState, useEffect } from 'react';
import { Modal } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function parseTimeString(t) {
  if (!t) return 0;
  const [hm, ap] = t.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + m;
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

export default function TimelineScreen({ timeLogs = [], routines = [], idleStart }) {
  const [activeTab, setActiveTab] = useState('Blocks');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [nowY, setNowY] = useState(0);
  const [currentTimeLabel, setCurrentTimeLabel] = useState('');
  // Live current time line updater
  useEffect(() => {
    function pad(n) { return n < 10 ? '0' + n : n; }
    function updateNowYAndLabel() {
      const now = new Date();
      if (
        now.getDate() === selectedDate.getDate() &&
        now.getMonth() === selectedDate.getMonth() &&
        now.getFullYear() === selectedDate.getFullYear()
      ) {
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
  }, [selectedDate]);
  // Helper for day info
  const dayInfo = {
    day: days[selectedDate.getDay()],
    date: selectedDate.getDate(),
    month: months[selectedDate.getMonth()],
    year: selectedDate.getFullYear(),
    hour: selectedDate.getHours(),
    minute: selectedDate.getMinutes(),
  };
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
  // Filter logs and routines for selected day
  const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  let blocks = [
    ...timeLogs.filter(log => isSameDay(new Date(log.start), selectedDate)).map(log => ({
      id: log.id,
      title: log.title,
      start: formatAMPM(new Date(log.start)),
      end: formatAMPM(new Date(log.end)),
      type: 'log',
      description: log.description,
    })),
    ...routines.filter(r => isSameDay(selectedDate, selectedDate)).map(r => ({
      id: r.id,
      title: r.name,
      start: r.time,
      end: r.duration ? getEndTime(r.time, r.duration) : '',
      type: 'routine',
    })),
  ];
  blocks = blocks.sort((a, b) => parseTimeString(a.start) - parseTimeString(b.start));

  function getEndTime(start, duration) {
    // start: 'HH:MM AM/PM', duration: minutes
    const [hm, ap] = start.split(' ');
    let [h, m] = hm.split(':').map(Number);
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    let total = h * 60 + m + parseInt(duration);
    let endH = Math.floor(total / 60) % 24;
    let endM = total % 60;
    let endAP = endH >= 12 ? 'PM' : 'AM';
    endH = endH % 12;
    endH = endH ? endH : 12;
    endM = endM < 10 ? '0' + endM : endM;
    return `${endH}:${endM} ${endAP}`;
  }

  // Add live idle block if no logs/routines
  if (blocks.length === 0 && idleStart && isSameDay(selectedDate, new Date())) {
    const now = new Date();
    blocks.push({
      id: 'idle',
      title: 'Idle Time',
      start: formatAMPM(idleStart),
      end: formatAMPM(now),
      type: 'idle',
    });
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
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', marginTop: 2 }}>{dayInfo.day}, {dayInfo.date} {dayInfo.month} {dayInfo.year}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            <View style={{ flexDirection: 'row', position: 'relative', height: TIMELINE_HEIGHT, backgroundColor: '#FFF6F5', borderRadius: 16, overflow: 'hidden', marginHorizontal: 20 }}>
              {/* Time scale - 30 min divisions */}
              <View style={{ width: 60, paddingVertical: 8 }}>
                {HALF_HOURS.map(mins => {
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return (
                    <View key={mins} style={{ height: 40, justifyContent: 'flex-start' }}>
                      <Text style={{ color: '#42281A', fontSize: 13 }}>{h.toString().padStart(2, '0')}:{m === 0 ? '00' : '30'}</Text>
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
                {blocks.map(block => {
                  const { top, height } = getBlockPosition(block.start, block.end);
                  // Calculate duration in minutes
                  const durationMins = block.type === 'routine'
                    ? parseInt(block.end && block.start ? parseTimeString(block.end) - parseTimeString(block.start) : block.duration || 0)
                    : block.end && block.start ? parseTimeString(block.end) - parseTimeString(block.start) : 0;
                  // Reduce font size if block is short
                  const smallBlock = height < 40;
                  return (
                    <View key={block.id} style={{
                      position: 'absolute',
                      left: 8,
                      right: 8,
                      top,
                      height,
                      backgroundColor: '#F2F2F2', // light grey
                      borderRadius: 8,
                      padding: 6,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: smallBlock ? 12 : 15, fontWeight: 'bold' }}>{block.title}</Text>
                        <View>
                          <Text style={{ fontWeight: 'bold', fontSize: smallBlock ? 10 : 13 }}>{durationMins} min</Text>
                        </View>
                      </View>
                      {/* Description if present */}
                      {block.description && (
                        <Text style={{ fontSize: 12, marginTop: 2 }}>{block.description}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      )}
      {/* Summary Tab Placeholder */}
      {activeTab === 'Summary' && (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 18, color: '#42281A' }}>Summary view coming soon...</Text>
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
});
