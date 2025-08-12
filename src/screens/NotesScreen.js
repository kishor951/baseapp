import React, { useState } from 'react';
import Markdown from 'react-native-markdown-display';
import Voice from 'react-native-voice';
import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const now = Date.now();
const initialIdeas = [
  { id: 1, text: 'Fashion Application VR', duration: '60 mins', createdAt: now },
  { id: 2, text: 'Make a mobile app like Jarvis', duration: '6 hrs', createdAt: now },
];

export default function NotesScreen({ notes = [], setNotes }) {
  const [tab, setTab] = useState('Idea Pool');
  const [ideas, setIdeas] = useState(initialIdeas);
  const [showModal, setShowModal] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  // Remove duration
  const [editId, setEditId] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [searchText, setSearchText] = useState('');

  const handleAddIdea = () => {
    if (newIdea.trim()) {
      if (editId) {
        setIdeas(ideas => ideas.map(idea => idea.id === editId ? { ...idea, text: newIdea } : idea));
      } else {
        setIdeas(ideas => [...ideas, { id: Date.now(), text: newIdea, createdAt: Date.now() }]);
      }
      setShowModal(false);
      setNewIdea('');
      setEditId(null);
    }
  };

  const handleEdit = (idea) => {
    setEditId(idea.id);
    setNewIdea(idea.text);
    setShowModal(true);
  };

  // Speech-to-text
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  React.useEffect(() => {
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setNewIdea(e.value[0]);
      }
    };
    Voice.onSpeechError = (e) => setVoiceError(e.error);
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleMicPress = async () => {
    if (isListening) {
      await Voice.stop();
      setIsListening(false);
    } else {
      setVoiceError(null);
      setIsListening(true);
      try {
        await Voice.start('en-US');
      } catch (e) {
        setVoiceError(e.message);
        setIsListening(false);
      }
    }
  };

  const handleDelete = (id) => {
    setIdeas(ideas => ideas.filter(idea => idea.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Tab Selector */}
      {/* Toggle Tab Selector - pill style */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, tab === 'Library' && styles.toggleActive]}
          onPress={() => setTab('Library')}
        >
          <Text style={[styles.toggleText, tab === 'Library' && styles.toggleTextActive]}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, tab === 'Idea Pool' && styles.toggleActive]}
          onPress={() => setTab('Idea Pool')}
        >
          <Text style={[styles.toggleText, tab === 'Idea Pool' && styles.toggleTextActive]}>Idea Pool</Text>
        </TouchableOpacity>
      </View>
      {/* Idea Pool Search Bar */}
      {tab === 'Idea Pool' && (
        <>
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 10,
                padding: 12,
                fontSize: 16,
                marginBottom: 10,
                backgroundColor: '#fafafa',
              }}
              placeholder="Search ideas..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <FlatList
            data={ideas.filter(idea => idea.text.toLowerCase().includes(searchText.toLowerCase()))}
            keyExtractor={item => (item.id ? item.id.toString() : String(item.text || Math.random()))}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 80 }}
            renderItem={({ item }) => {
              // ...existing code...
              const now = Date.now();
              const elapsedMs = now - item.createdAt;
              const minutes = Math.floor(elapsedMs / 60000);
              const hours = Math.floor(minutes / 60);
              let timeInPool = '';
              if (hours > 0) {
                timeInPool = `${hours} hr${hours > 1 ? 's' : ''} ${minutes % 60} min${minutes % 60 !== 1 ? 's' : ''}`;
              } else {
                timeInPool = `${minutes} min${minutes !== 1 ? 's' : ''}`;
              }
              return (
                <View style={styles.ideaItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ideaText}>{item.text}</Text>
                    <Text style={styles.ideaDuration}>In pool: {timeInPool}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                    <Ionicons name="pencil" size={22} color="#888" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash" size={22} color="#d00" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </>
      )}

      {/* Library Search Bar */}
      {tab === 'Library' && (
        <>
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 10,
                padding: 12,
                fontSize: 16,
                marginBottom: 10,
                backgroundColor: '#fafafa',
              }}
              placeholder="Search notes..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <FlatList
            data={notes.filter(note => note.text.toLowerCase().includes(searchText.toLowerCase()))}
            keyExtractor={item => item.id?.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 80 }}
            renderItem={({ item }) => {
              const isExpanded = expandedNoteId === item.id;
              let displayText = item.text;
              if (!isExpanded) {
                const lines = item.text.split(/\r?\n/);
                displayText = lines.slice(0, 2).join('\n');
                if (lines.length > 2) displayText += '...';
              }
              return (
                <TouchableOpacity onPress={() => setExpandedNoteId(isExpanded ? null : item.id)}>
                  <View style={styles.ideaItem}>
                    <View style={{ flex: 1 }}>
                      <Markdown style={{ body: { fontSize: 16, color: '#222' } }}>{displayText}</Markdown>
                      {item.from && <Text style={{ fontSize: 12, color: '#888' }}>From: {item.from}</Text>}
                      {item.createdAt && <Text style={{ fontSize: 12, color: '#888' }}>{new Date(item.createdAt).toLocaleString()}</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, minHeight: 60 }]}
                placeholder="Idea description"
                value={newIdea}
                onChangeText={setNewIdea}
                multiline
              />
              <TouchableOpacity onPress={handleMicPress} style={styles.micButton}>
                <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color={isListening ? '#d00' : '#222'} />
              </TouchableOpacity>
            </View>
            {voiceError && <Text style={{ color: 'red', marginBottom: 8 }}>{voiceError}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => { setShowModal(false); setEditId(null); setNewIdea(''); }}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleAddIdea}>
                <Text style={styles.modalButtonTextPrimary}>{editId ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ...existing code... */}
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 24,
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 20,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: '#000',
  },
  toggleText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleTextActive: {
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
  deleteButton: {
    marginLeft: 4,
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  micButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
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
