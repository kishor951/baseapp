import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const timelineData = [
  {
    day: 'Mon',
    date: 20,
    blocks: [
      { id: 1, title: 'Create a app for launch', start: '12:00PM', end: '1:00AM' },
      { id: 2, title: 'Idle Time', start: '1:00PM', end: '2:00AM' },
    ],
  },
];

export default function TimelineScreen() {
  const [activeTab, setActiveTab] = useState('Blocks');
  const [selectedMonth, setSelectedMonth] = useState('Jan');
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
      {/* Timeline Blocks */}
      {activeTab === 'Blocks' && (
        <FlatList
          data={timelineData}
          keyExtractor={item => item.day + item.date}
          renderItem={({ item }) => (
            <View style={styles.dayRow}>
              <View style={styles.dayBox}>
                <Text style={styles.dayText}>{item.day}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
              <View style={{ flex: 1 }}>
                {item.blocks.map(block => (
                  <View key={block.id} style={styles.blockRow}>
                    <View style={styles.blockBox}>
                      <Text style={styles.blockTitle}>{block.title}</Text>
                      <Text style={styles.blockTime}>{block.start} - {block.end}</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton}>
                      <Ionicons name="pencil" size={20} color="#42281A" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
          style={{ marginTop: 20 }}
        />
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
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockBox: {
    backgroundColor: '#42281A',
    borderRadius: 16,
    padding: 16,
    flex: 1,
  },
  blockTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  blockTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#EAD7D1',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
});
