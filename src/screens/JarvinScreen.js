import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import Voice from 'react-native-voice';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function JarvinScreen({
  tasks, setTasks,
  routines, setRoutines,
  notes, setNotes,
  chatSessions, setChatSessions,
  currentChatId, setCurrentChatId
}) {
  const [pendingRoutine, setPendingRoutine] = useState(null);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState('ask'); // 'task', 'routine', 'ask'
  // Chat session management now handled in App.js
  // Props: chatSessions, setChatSessions, currentChatId, setCurrentChatId
  // Speech-to-text handlers
  React.useEffect(() => {
    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        setInput(event.value[0]);
      }
    };
    Voice.onSpeechError = (event) => {
      setError('Speech recognition error');
      setIsListening(false);
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Jarvin needs access to your microphone for speech recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Microphone permission denied');
          return;
        }
      }
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      setError('Could not start speech recognition');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      }
    } catch (e) {
      setError('Could not stop speech recognition');
      setIsListening(false);
    }
  };
  // Helper to get/set messages for current chat
  const currentChat = chatSessions.find(c => c.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];
  const setMessages = (fn) => {
    setChatSessions(sessions =>
      sessions.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: typeof fn === 'function' ? fn(chat.messages) : fn }
          : chat
      )
    );
  };

  // Save chats to localStorage on change
  // Removed localStorage saving effect
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  React.useEffect(() => {
    console.log('JarvinScreen mounted');
    if (!GOOGLE_API_KEY) {
      setError('Google API key is missing. Please check your app.json and restart Expo.');
    }
  }, []);

  const GOOGLE_API_KEY =
    Constants.expoConfig?.extra?.GOOGLE_API_KEY ||
    Constants.manifest?.extra?.GOOGLE_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);
    // Add user message to history
    setMessages(prev => [...prev, { role: 'USER', text: input }]);
    try {
      // If user is responding to a pending routine time prompt
      if (pendingRoutine) {
        // Assume input is the time for the routine
        const updatedRoutine = { ...pendingRoutine, time: input };
        setRoutines(prev => [...prev, updatedRoutine]);
        setMessages(prev => [...prev, { role: 'ASSISTANT', text: `Routine created: ${updatedRoutine.name} at ${input}` }]);
        setPendingRoutine(null);
        setInput('');
        setLoading(false);
        return;
      }

      // Use mode to determine intent
      const isTask = mode === 'task';
      const isRoutine = mode === 'routine';

      // Build Gemini contents array from history (skip SYSTEM for Gemini API)
      const contents = messages
        .filter(msg => msg.role !== 'SYSTEM')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));
      // Add current user input
      contents.push({ role: 'USER', parts: [{ text: input }] });

      // If task/routine, request JSON output
      let body = { contents };
      if (isTask) {
        body.generation_config = {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                due_at: { type: "string", format: "date-time" },
                recurrence_rule: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] }
              },
              required: ["title"]
            }
          }
        };
      } else if (isRoutine) {
        body.generation_config = {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              steps: { type: "array", items: { type: "string" } },
              timeblocks: { type: "array", items: { type: "string" } }
            },
            required: ["name", "steps", "timeblocks"]
          }
        };
      }

      const response = await fetch(`${endpoint}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log('Gemini API response:', data);
      let answer = 'No answer.';
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        answer = data.candidates[0].content.parts[0].text;
        // Try to parse JSON if task/routine
        if ((isTask || isRoutine) && answer) {
          try {
            const parsed = JSON.parse(answer);
            if (isTask) {
              let newTasks = [];
              if (Array.isArray(parsed)) {
                newTasks = parsed.map(task => ({
                  ...task,
                  id: Date.now() + Math.floor(Math.random() * 10000),
                  completed: false
                }));
                setTasks(prev => [...prev, ...newTasks]);
                answer = `Tasks created: ${newTasks.map(t => t.title).join(', ')}`;
              } else if (parsed && typeof parsed === 'object' && parsed.title) {
                // Single task fallback
                const newTask = {
                  ...parsed,
                  id: Date.now() + Math.floor(Math.random() * 10000),
                  completed: false
                };
                setTasks(prev => [...prev, newTask]);
                answer = `Task created: ${newTask.title}`;
              } else {
                // Fallback: try to extract comma-separated titles from plain text
                const titles = answer.split(',').map(t => t.trim()).filter(Boolean);
                newTasks = titles.map(title => ({
                  title,
                  id: Date.now() + Math.floor(Math.random() * 10000),
                  completed: false
                }));
                setTasks(prev => [...prev, ...newTasks]);
                answer = `Tasks created: ${titles.join(', ')}`;
              }
            } else if (isRoutine) {
              // If no time, prompt user for time
              if (!parsed.time) {
                setPendingRoutine(parsed);
                answer = `At what time do you do the routine "${parsed.name}"?`;
              } else {
                setRoutines(prev => [...prev, parsed]);
                answer = `Routine created: ${parsed.name} at ${parsed.time}`;
              }
            }
          } catch (e) {
            // If not valid JSON, just show the answer
          }
        }
      } else if (data?.error?.message) {
        answer = 'API Error: ' + data.error.message;
        setError(data.error.message);
      }
      setMessages(prev => [...prev, { role: 'ASSISTANT', text: answer }]);
      if (!data?.error?.message) setError(null);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ASSISTANT', text: 'Error: ' + (err?.message || 'Failed to fetch answer') }]);
      setError('Failed to fetch answer from Gemini API.');
    }
    setInput('');
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Main Chat Area */}
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
        >
          <View style={{ padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222' }}>Jarvin</Text>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 80 }}>
            {messages
              .filter(msg => msg.role !== 'SYSTEM')
              .map((msg, idx) => (
                <View key={idx} style={{ marginBottom: 18, alignSelf: msg.role === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <View style={{ backgroundColor: msg.role === 'USER' ? '#e0e0e0' : '#d1eaff', borderRadius: 12, padding: 14 }}>
                    {msg.role === 'ASSISTANT' ? (
                      <Markdown style={{ body: { fontSize: 16, color: '#222' } }}>{msg.text}</Markdown>
                    ) : (
                      <Text style={{ fontSize: 16, color: '#222' }}>{msg.text}</Text>
                    )}
                  </View>
                  {/* Chat actions for assistant messages */}
                  {msg.role === 'ASSISTANT' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <TouchableOpacity
                        onPress={() => Clipboard.setStringAsync(msg.text)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                      >
                        <Ionicons name="copy" size={18} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          if (setNotes) {
                            setNotes(prev => [...prev, { id: Date.now(), text: msg.text, createdAt: Date.now(), from: 'Jarvin' }]);
                          }
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}
                      >
                        <Ionicons name="library" size={16} color="#007AFF" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '500' }}>Save to Library</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={{ fontSize: 12, color: '#888', marginTop: 2, textAlign: msg.role === 'USER' ? 'right' : 'left' }}>{msg.role === 'USER' ? 'You' : 'Jarvin'}</Text>
                </View>
              ))}
            {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />}
          </ScrollView>
          {/* Mode Selector - centered above input, inserts text into input on press */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            {['Add Tasks', 'Add Routines', 'Ask Anything'].map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setInput(prev => {
                    // Only insert if not already present at start
                    if (prev.startsWith(option + ': ')) return prev;
                    return option + ': ' + prev;
                  });
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderBottomWidth: input.startsWith(option + ': ') ? 2 : 0,
                  borderBottomColor: input.startsWith(option + ': ') ? '#007AFF' : 'transparent',
                  marginHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: input.startsWith(option + ': ') ? 'bold' : 'normal', color: '#222' }}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                height: inputHeight,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#ddd',
                paddingHorizontal: 14,
                fontSize: 16,
                backgroundColor: '#fafafa',
                paddingTop: 10,
                paddingBottom: 10,
                textAlignVertical: 'top',
              }}
              placeholder="Ask Jarvin anything..."
              value={input}
              onChangeText={setInput}
              editable={!loading}
              onSubmitEditing={sendMessage}
              multiline
              numberOfLines={1}
              scrollEnabled={true}
              onContentSizeChange={e => {
                const newHeight = Math.min(Math.max(44, e.nativeEvent.contentSize.height), 120);
                setInputHeight(newHeight);
              }}
            />
            <TouchableOpacity
              onPress={isListening ? stopListening : startListening}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color={isListening ? '#007AFF' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage} disabled={loading || !input.trim()} style={{ marginLeft: 10 }}>
              <Ionicons name="send" size={28} color={loading || !input.trim() ? '#ccc' : '#007AFF'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
