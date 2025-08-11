import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const initialIdeas = [
  { id: 1, text: 'Fashion Application VR', duration: '60 mins' },
  { id: 2, text: 'Make a mobile app like Jarvis', duration: '6 hrs' },
];

export default function NotesScreen() {
  const [tab, setTab] = useState('Idea Pool');
  const [ideas, setIdeas] = useState(initialIdeas);
  const [showModal, setShowModal] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [editId, setEditId] = useState(null);

  const handleAddIdea = () => {
    if (newIdea.trim() && newDuration.trim()) {
      if (editId) {
        setIdeas(ideas => ideas.map(idea => idea.id === editId ? { ...idea, text: newIdea, duration: newDuration } : idea));
      } else {
        setIdeas(ideas => [...ideas, { id: Date.now(), text: newIdea, duration: newDuration }]);
      }
      setShowModal(false);
      setNewIdea('');
      setNewDuration('');
      setEditId(null);
    }
  };

  const handleEdit = (idea) => {
    setEditId(idea.id);
    setNewIdea(idea.text);
    setNewDuration(idea.duration);
    setShowModal(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={32} color="#222" />
        <Text style={styles.title}>WorkSight!</Text>
        <Ionicons name="document-text-outline" size={32} color="#222" />
      </View>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'Library' && styles.activeTab]}
          onPress={() => setTab('Library')}
        >
          <Text style={[styles.tabText, tab === 'Library' && styles.activeTabText]}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'Idea Pool' && styles.activeTab]}
          onPress={() => setTab('Idea Pool')}
        >
          <Text style={[styles.tabText, tab === 'Idea Pool' && styles.activeTabText]}>Idea Pool</Text>
        </TouchableOpacity>
      </View>
      {/* Idea Pool List */}
      {tab === 'Idea Pool' && (
        <FlatList
          data={ideas}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.ideaItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ideaText}>{item.text}</Text>
                <Text style={styles.ideaDuration}>{item.duration}</Text>
              </View>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                <Ionicons name="pencil" size={22} color="#888" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      {/* Add Idea Button */}
      {tab === 'Idea Pool' && (
        <View style={{ padding: 20 }}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Text style={styles.addButtonText}>Add Idea</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Idea' : 'Add Idea'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Idea description"
              value={newIdea}
              onChangeText={setNewIdea}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Duration (e.g. 60 mins, 6 hrs)"
              value={newDuration}
              onChangeText={setNewDuration}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => { setShowModal(false); setEditId(null); setNewIdea(''); setNewDuration(''); }}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleAddIdea}>
                <Text style={styles.modalButtonTextPrimary}>{editId ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Bottom Navigation (dummy, for UI) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="radio-button-on" size={24} color="#666" /><Text style={styles.navText}>Focus</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="repeat-outline" size={24} color="#666" /><Text style={styles.navText}>Task & Routine</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="sparkles-outline" size={24} color="#666" /><Text style={styles.navText}>Jarvin</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="document-text-outline" size={24} color="#000" /><Text style={[styles.navText, { color: '#000' }]}>Notes</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
  },
  ideaText: {
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  ideaDuration: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
  },
  editButton: {
    marginLeft: 10,
    padding: 6,
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    width: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: '#fafafa',
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
});
