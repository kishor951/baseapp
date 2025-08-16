import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import Voice from 'react-native-voice';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Utility function to analyze conversation context
const analyzeConversationContext = (messages, currentInput) => {
  const recentMessages = messages.slice(-5); // Last 5 messages
  const userMessages = recentMessages.filter(m => m.role === 'USER');
  const assistantMessages = recentMessages.filter(m => m.role === 'ASSISTANT');
  
  // Detect conversation patterns
  const isFollowUp = userMessages.length > 0 && (
    currentInput.toLowerCase().includes('what about') ||
    currentInput.toLowerCase().includes('and also') ||
    currentInput.toLowerCase().includes('also') ||
    currentInput.toLowerCase().includes('what if') ||
    currentInput.toLowerCase().includes('can you') ||
    currentInput.startsWith('how') ||
    currentInput.startsWith('why') ||
    currentInput.startsWith('when')
  );
  
  const hasOpenQuestion = assistantMessages.some(m => 
    m.text.includes('?') || m.text.includes('Would you like') || m.text.includes('anything else')
  );
  
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
  const conversationTopic = lastAssistantMessage ? 
    (lastAssistantMessage.text.includes('task') ? 'tasks' :
     lastAssistantMessage.text.includes('routine') ? 'routines' :
     lastAssistantMessage.text.includes('focus') ? 'focus' : 'general') : 'general';
  
  return {
    isFollowUp,
    hasOpenQuestion,
    conversationTopic,
    messageCount: recentMessages.length,
    lastAssistantMessage: lastAssistantMessage?.text || ''
  };
};

export default function JarvinScreen({
  tasks, setTasks,
  routines, setRoutines,
  notes, setNotes,
  chatSessions, setChatSessions,
  currentChatId, setCurrentChatId,
  createNewChatSession,
  saveMessageToDatabase,
  addTaskFromJarvin,
  addRoutineFromJarvin,
  addNote,
  user
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
            message: 'Timvis needs access to your microphone for speech recognition.',
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
    console.log('TimvisScreen mounted');
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
    
    const userMessage = { role: 'USER', text: input };
    
    // Add user message to history
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database
    if (user && !user.skipped) {
      await saveMessageToDatabase(currentChatId, 'user', input);
    }
    
    try {
      // If user is responding to a pending routine time prompt
      if (pendingRoutine) {
        // Assume input is the time for the routine
        const updatedRoutine = { ...pendingRoutine, time: input };
        const newRoutine = await addRoutineFromJarvin(updatedRoutine);
        
        const responseText = `Excellent! Your "${newRoutine.name}" routine is now set for ${input}. I'll help you track this going forward.`;
        const assistantMessage = { role: 'ASSISTANT', text: responseText };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message to database
        if (user && !user.skipped) {
          await saveMessageToDatabase(currentChatId, 'assistant', responseText);
        }
        
        setPendingRoutine(null);
        setInput('');
        setLoading(false);
        return;
      }

      // Build contextual system prompt with current state
      const buildContextualPrompt = () => {
        const activeTasks = tasks.filter(t => !t.completed);
        const completedToday = tasks.filter(t => t.completed && new Date(t.completed_at).toDateString() === new Date().toDateString());
        const recentNotes = notes.slice(0, 5);
        const conversationContext = analyzeConversationContext(messages, input);
        
        let contextPrompt = `You are Timvis, an intelligent productivity assistant. You maintain conversation context and build upon previous exchanges.

CURRENT USER CONTEXT:
- Active tasks: ${activeTasks.length} (${activeTasks.slice(0, 3).map(t => t.title).join(', ')}${activeTasks.length > 3 ? '...' : ''})
- Completed today: ${completedToday.length}
- Recent notes: ${recentNotes.length}
- Current time: ${new Date().toLocaleTimeString()}

CONVERSATION CONTEXT:
- This is message #${conversationContext.messageCount + 1} in our conversation
- Topic focus: ${conversationContext.conversationTopic}
- Is follow-up question: ${conversationContext.isFollowUp ? 'Yes' : 'No'}
- Has pending question: ${conversationContext.hasOpenQuestion ? 'Yes' : 'No'}`;

        if (conversationContext.lastAssistantMessage) {
          contextPrompt += `
- My last response: "${conversationContext.lastAssistantMessage.slice(0, 100)}..."`;
        }

        contextPrompt += `

CONVERSATION GUIDELINES:
1. MAINTAIN CONTEXT: Reference previous messages in this conversation when relevant
2. BUILD UPON RESPONSES: If user asks follow-up questions, connect to previous exchanges
3. BE SPECIFIC: Use user's actual task names, dates, and context when responding
4. REMEMBER INTENT: Track what the user is trying to accomplish across messages
5. SUGGEST NEXT STEPS: Based on conversation flow, suggest logical next actions
6. BE CONVERSATIONAL: Sound natural and engaging, not robotic

TASK CREATION RULES:
- If user mentions "create a task", "add task", "need to", "have to", "should do", "remind me to", "todo" - CREATE TASKS
- Extract clear task titles from user requests
- For requests like "create a task on X" - the task title should be "X"
- Always create actual tasks when requested, don't just discuss them

CAPABILITIES:
- Task creation and management with smart analysis
- Productivity insights and recommendations
- Time management and scheduling suggestions
- Project planning and breakdown
- Contextual follow-up questions and clarifications

Remember: Each response should feel like a continuation of our ongoing conversation, not an isolated interaction.`;

        return contextPrompt;
      };

      // Determine intent from conversation context - Enhanced detection
      const detectTaskIntent = (input) => {
        const taskKeywords = [
          'create a task', 'create task', 'add task', 'add a task',
          'make a task', 'new task', 'task for', 'task on',
          'need to', 'i need to', 'have to', 'should do',
          'remind me to', 'todo', 'to do', 'task:', 'create:'
        ];
        
        const routineKeywords = [
          'routine', 'daily routine', 'morning routine', 'schedule routine'
        ];
        
        const inputLower = input.toLowerCase();
        
        const isTask = taskKeywords.some(keyword => inputLower.includes(keyword)) || 
                      mode === 'task' ||
                      input.startsWith('Add Tasks:');
        
        const isRoutine = routineKeywords.some(keyword => inputLower.includes(keyword)) || 
                         mode === 'routine' ||
                         input.startsWith('Add Routines:');
        
        return { isTask, isRoutine };
      };

      const { isTask, isRoutine } = detectTaskIntent(input);
      
      // Debug logging
      console.log('Input:', input);
      console.log('Detected isTask:', isTask);
      console.log('Detected isRoutine:', isRoutine);

      // Build conversation history for context (include more messages for better context)
      const conversationHistory = messages
        .filter(msg => msg.role !== 'SYSTEM')
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      // Add system context as first message
      const contents = [
        {
          role: 'USER',
          parts: [{ text: buildContextualPrompt() }]
        },
        ...conversationHistory,
        // Add current user input
        { role: 'USER', parts: [{ text: input }] }
      ];

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
              time: { type: "string" },
              duration: { type: "integer", minimum: 1, maximum: 480 },
              steps: { type: "array", items: { type: "string" } },
              timeblocks: { type: "array", items: { type: "string" } }
            },
            required: ["name"]
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
        
        // Enhanced response processing with context awareness
        if ((isTask || isRoutine) && answer) {
          try {
            const parsed = JSON.parse(answer);
            if (isTask) {
              let newTasks = [];
              if (Array.isArray(parsed)) {
                // Create tasks in database
                const createdTasks = await Promise.all(
                  parsed.map(task => addTaskFromJarvin(task))
                );
                newTasks = createdTasks;
                answer = `Great! I've created ${newTasks.length} task${newTasks.length > 1 ? 's' : ''} for you:\n${newTasks.map(t => `• ${t.title}`).join('\n')}\n\nWould you like me to help you prioritize these or break any of them down further?`;
              } else if (parsed && typeof parsed === 'object' && parsed.title) {
                // Single task fallback
                const newTask = await addTaskFromJarvin(parsed);
                newTasks = [newTask];
                answer = `Perfect! I've created the task "${newTask.title}" for you. What would you like to work on next?`;
              } else {
                // Fallback: try to extract comma-separated titles from plain text
                const titles = answer.split(',').map(t => t.trim()).filter(Boolean);
                const createdTasks = await Promise.all(
                  titles.map(title => addTaskFromJarvin({ title }))
                );
                newTasks = createdTasks;
                answer = `I've created ${titles.length} tasks from your request:\n${titles.map(t => `• ${t}`).join('\n')}\n\nAnything else you'd like to add or modify?`;
              }
            } else if (isRoutine) {
              console.log('Processing routine JSON:', parsed);
              // If no time, prompt user for time
              if (!parsed.time) {
                console.log('No time found, setting pending routine');
                setPendingRoutine(parsed);
                answer = `I understand you want to create the "${parsed.name}" routine. At what time do you typically do this routine?`;
              } else {
                console.log('Time found, creating routine directly:', parsed);
                const newRoutine = await addRoutineFromJarvin(parsed);
                answer = `Excellent! Your "${newRoutine.name}" routine is now set for ${parsed.time}. I'll help you track this going forward.`;
              }
            }
          } catch (e) {
            // If not valid JSON, try to extract task from the original input
            console.log('JSON parsing failed, extracting task from input:', input);
            
            if (isTask) {
              // Extract task title from user input
              let taskTitle = input;
              
              // Clean up common task creation phrases
              const cleanupPhrases = [
                'create a task on ', 'create a task for ', 'create task on ', 'create task for ',
                'add a task on ', 'add a task for ', 'add task on ', 'add task for ',
                'make a task on ', 'make a task for ', 'make task on ', 'make task for ',
                'create a task to ', 'add a task to ', 'make a task to ',
                'i need to ', 'need to ', 'have to ', 'should do ', 'remind me to ',
                'Add Tasks: ', 'create: ', 'task: '
              ];
              
              for (const phrase of cleanupPhrases) {
                if (taskTitle.toLowerCase().includes(phrase.toLowerCase())) {
                  taskTitle = taskTitle.substring(taskTitle.toLowerCase().indexOf(phrase.toLowerCase()) + phrase.length);
                  break;
                }
              }
              
              // Clean up the title
              taskTitle = taskTitle.trim();
              if (taskTitle.endsWith('.')) taskTitle = taskTitle.slice(0, -1);
              
              if (taskTitle.length > 0) {
                try {
                  const newTask = await addTaskFromJarvin({ title: taskTitle });
                  answer = `Perfect! I've created the task "${newTask.title}" for you. What would you like to work on next?`;
                } catch (taskError) {
                  console.error('Error creating task from input:', taskError);
                  answer = `I understand you want to create a task, but I had trouble processing it. Could you try: "Create a task: [your task description]"?`;
                }
              } else {
                answer = `I'd be happy to create a task for you! Could you be more specific about what you need to do?`;
              }
            } else if (isRoutine) {
              // Fallback routine creation from input text
              console.log('JSON parsing failed, extracting routine from input:', input);
              
              let routineName = input;
              let routineTime = null;
              
              // Extract routine name and time from user input
              const routineCleanupPhrases = [
                'create a routine on ', 'create routine on ', 'routine on ',
                'daily routine for ', 'morning routine for ', 'evening routine for ',
                'create a routine for ', 'routine for ', 'add routine for '
              ];
              
              for (const phrase of routineCleanupPhrases) {
                if (routineName.toLowerCase().includes(phrase.toLowerCase())) {
                  routineName = routineName.substring(routineName.toLowerCase().indexOf(phrase.toLowerCase()) + phrase.length);
                  break;
                }
              }
              
              // Try to extract time from the input
              const timeRegex = /(\d{1,2}:\d{2}\s?(AM|PM|am|pm))|(\d{1,2}\s?(AM|PM|am|pm))/;
              const timeMatch = input.match(timeRegex);
              if (timeMatch) {
                routineTime = timeMatch[0];
                // Remove time from routine name
                routineName = routineName.replace(timeRegex, '').trim();
              }
              
              // Clean up the routine name
              routineName = routineName.trim();
              if (routineName.startsWith('at ')) routineName = routineName.substring(3);
              if (routineName.endsWith('.')) routineName = routineName.slice(0, -1);
              
              if (routineName.length > 0) {
                try {
                  const routineData = { 
                    name: routineName, 
                    time: routineTime,
                    duration: 30 // default duration
                  };
                  
                  if (routineTime) {
                    const newRoutine = await addRoutineFromJarvin(routineData);
                    answer = `Perfect! I've created your "${newRoutine.name}" routine for ${routineTime}. I'll help you track this going forward.`;
                  } else {
                    setPendingRoutine(routineData);
                    answer = `I understand you want to create a "${routineName}" routine. At what time do you typically do this routine?`;
                  }
                } catch (routineError) {
                  console.error('Error creating routine from input:', routineError);
                  answer = `I understand you want to create a routine, but I had trouble processing it. Could you try: "Create a routine on [activity] at [time]"?`;
                }
              } else {
                answer = `I'd be happy to create a routine for you! Could you be more specific? For example: "Create a routine on jogging at 6:00 AM"`;
              }
            } else {
              // If not valid JSON and not a task/routine, enhance the natural response
              if (answer.includes('task') || answer.includes('routine') || answer.includes('create')) {
                answer += '\n\nFeel free to be more specific about what you need, and I can help create proper tasks or routines for you.';
              }
            }
          }
        } else {
          // For non-task/routine responses, make them more conversational
          // Check if this is a follow-up question or continuation
          const recentMessages = messages.slice(-3);
          const isFollowUp = recentMessages.some(msg => 
            msg.role === 'ASSISTANT' && (
              msg.text.includes('?') || 
              msg.text.includes('Would you like') || 
              msg.text.includes('anything else')
            )
          );
          
          if (isFollowUp) {
            // This is likely a follow-up, so reference the context
            answer = `Based on our conversation, ${answer}`;
          }
          
          // Add contextual follow-up suggestions
          if (answer.length > 50 && !answer.includes('?') && !answer.includes('Would you like')) {
            answer += '\n\nIs there anything specific you\'d like me to help you with next?';
          }
        }
      } else if (data?.error?.message) {
        answer = 'I encountered an issue processing your request. Could you try rephrasing that?';
        setError(data.error.message);
      }
      
      const assistantMessage = { role: 'ASSISTANT', text: answer };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to database
      if (user && !user.skipped) {
        await saveMessageToDatabase(currentChatId, 'assistant', answer);
        
        // Auto-update chat title if this is early in the conversation
        const currentChat = chatSessions.find(c => c.id === currentChatId);
        if (currentChat && currentChat.messages.length <= 4 && currentChat.title === 'New Chat') {
          // Generate a title based on the first user message
          const firstUserMessage = currentChat.messages.find(m => m.role === 'USER');
          if (firstUserMessage) {
            let newTitle = firstUserMessage.text.slice(0, 30);
            if (firstUserMessage.text.length > 30) newTitle += '...';
            
            // Update the chat session title in state
            setChatSessions(sessions =>
              sessions.map(chat =>
                chat.id === currentChatId
                  ? { ...chat, title: newTitle }
                  : chat
              )
            );
          }
        }
      }
      
      if (!data?.error?.message) setError(null);
    } catch (err) {
      console.error('Conversation error:', err);
      const conversationContext = analyzeConversationContext(messages, input);
      
      let errorMessage = 'I apologize, but I encountered an issue processing your request. ';
      
      if (conversationContext.isFollowUp) {
        errorMessage += 'Could you try rephrasing your follow-up question? ';
      } else if (conversationContext.conversationTopic === 'tasks') {
        errorMessage += 'If you were trying to create tasks, could you list them more clearly? ';
      } else {
        errorMessage += 'Could you try asking that differently? ';
      }
      
      errorMessage += 'I\'m here to help!';
      
      const assistantMessage = { role: 'ASSISTANT', text: errorMessage };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save error message to database
      if (user && !user.skipped) {
        await saveMessageToDatabase(currentChatId, 'assistant', errorMessage);
      }
      
      setError('Failed to process your request. Please try again.');
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

          <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 80 }}>
            {messages
              .filter(msg => msg.role !== 'SYSTEM')
              .map((msg, idx) => (
                <View key={idx} style={{ marginBottom: 18, alignSelf: msg.role === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  {/* Sender name above bubble */}
                  <Text style={{ fontSize: 12, color: '#888', marginBottom: 2, textAlign: msg.role === 'USER' ? 'right' : 'left' }}>{msg.role === 'USER' ? 'You' : 'Timvis'}</Text>
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
                        onPress={async () => {
                          if (addNote && user && !user.skipped) {
                            // Save to database as library note (is_idea: false)
                            await addNote({ text: msg.text }, false);
                          } else if (setNotes) {
                            // Fallback to local state for guests
                            setNotes(prev => [...prev, { id: Date.now(), text: msg.text, created_at: new Date().toISOString(), from: 'Timvis', is_idea: false }]);
                          }
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}
                      >
                        <Ionicons name="library" size={16} color="#007AFF" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '500' }}>Save to Library</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
              placeholder="Ask Timvis anything..."
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
