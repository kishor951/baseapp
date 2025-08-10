import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function JarvinScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
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
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    try {
      const prompt = input;
      const response = await fetch(`${endpoint}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }] }
          ]
        }),
      });
      const data = await response.json();
      console.log('Gemini API response:', data);
      let answer = 'No answer.';
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        answer = data.candidates[0].content.parts[0].text;
      } else if (data?.error?.message) {
        answer = 'API Error: ' + data.error.message;
        setError(data.error.message);
      }
      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
      if (!data?.error?.message) setError(null);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error: ' + (err?.message || 'Failed to fetch answer') }]);
      setError('Failed to fetch answer from Gemini API.');
    }
    setInput('');
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 10, backgroundColor: '#ff0' }}>
        <Text style={{ fontSize: 18, color: '#222', textAlign: 'center' }}>JarvinScreen is mounted</Text>
      </View>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222' }}>Jarvin</Text>
        <Text style={{ fontSize: 16, color: '#666', marginTop: 4 }}>Ask anything, get instant answers powered by Gemini!</Text>
        {error && (
          <View style={{ marginTop: 12, padding: 12, backgroundColor: '#ffeaea', borderRadius: 8 }}>
            <Text style={{ color: '#d00', fontSize: 15 }}>{error}</Text>
          </View>
        )}
      </View>
      <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 80 }}>
        {messages.map((msg, idx) => (
          <View key={idx} style={{ marginBottom: 18, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <View style={{ backgroundColor: msg.role === 'user' ? '#e0e0e0' : '#d1eaff', borderRadius: 12, padding: 14 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{msg.text}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.role === 'user' ? 'You' : 'Jarvin'}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />}
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fafafa' }}
          placeholder="Ask Jarvin anything..."
          value={input}
          onChangeText={setInput}
          editable={!loading}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} disabled={loading || !input.trim()} style={{ marginLeft: 10 }}>
          <Ionicons name="send" size={28} color={loading || !input.trim() ? '#ccc' : '#007AFF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
