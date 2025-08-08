
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getCurrentDayInfo = () => {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    day: days[now.getDay()],
    date: now.getDate(),
    month: now.toLocaleString('default', { month: 'short' }),
    year: now.getFullYear(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
};

export default function TimelineScreen({ timeLogs = [], routines = [], idleStart }) {
  const [activeTab, setActiveTab] = useState('Blocks');
  const dayInfo = getCurrentDayInfo();
  const [selectedMonth, setSelectedMonth] = useState(dayInfo.month);
  // Filter logs and routines for today
  const today = new Date();
  const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  let blocks = [
    ...timeLogs.filter(log => isSameDay(new Date(log.start), today)).map(log => ({
      id: log.id,
      title: log.title,
      start: formatAMPM(new Date(log.start)),
      end: formatAMPM(new Date(log.end)),
      type: 'log',
      description: log.description,
    })),
    ...routines.filter(r => isSameDay(today, today)).map(r => ({
      id: r.id,
      title: r.name,
      start: r.time,
      end: r.duration ? `${parseInt(r.time) + r.duration} mins` : '',
      type: 'routine',
    })),
  ];
  // Add live idle block if no logs/routines
  if (blocks.length === 0 && idleStart) {
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
  const nowY = ((dayInfo.hour * 60 + dayInfo.minute) / (24 * 60)) * timelineHeight;
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.timelineHeader}>
        <TouchableOpacity>
          <Ionicons name="arrow-back-outline" size={28} color="#42281A" />
        </TouchableOpacity>
        <Text style={styles.timelineTitle}>Timeline</Text>
        <TouchableOpacity style={styles.monthSelector}>
          <Text style={styles.monthSelectorText}>{selectedMonth}</Text>
          <Ionicons name="chevron-down-outline" size={20} color="#42281A" />
        </TouchableOpacity>
      </View>
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
        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
          <View style={styles.dayRow}>
            <View style={styles.dayBox}>
              <Text style={styles.dayText}>{dayInfo.day}</Text>
              <Text style={styles.dateText}>{dayInfo.date}</Text>
            </View>
            <View style={{ flex: 1, position: 'relative', height: timelineHeight }}>
              {/* Render blocks here if available */}
              {blocks.length === 0 && (
                <Text style={{ color: '#42281A', fontSize: 16, marginTop: 20 }}>No activities logged for today.</Text>
              )}
              {blocks.map((block, idx) => (
                <View key={block.id} style={{ ...styles.blockRow, position: 'absolute', top: (timelineHeight / blocks.length) * idx, left: 0, right: 0 }}>
                  <View style={styles.blockBox}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockTime}>{block.start} - {block.end}</Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="pencil" size={20} color="#42281A" />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Current time horizontal line */}
              <View style={{ position: 'absolute', left: 0, right: 0, top: nowY, height: 2, backgroundColor: '#FF6F61', borderRadius: 2 }} />
              <Text style={{ position: 'absolute', left: 0, top: nowY - 12, color: '#FF6F61', fontWeight: 'bold', fontSize: 12 }}>{`${dayInfo.hour}:${dayInfo.minute < 10 ? '0' + dayInfo.minute : dayInfo.minute}`}</Text>
            </View>
          </View>
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
  // ...existing code...
});
