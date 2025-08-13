import { supabase } from './supabaseClient';

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

// ============================================================================
// NOTES MANAGEMENT
// ============================================================================

export const fetchNotes = async (userId, isIdea = null) => {
  try {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (isIdea !== null) {
      query = query.eq('is_idea', isIdea);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notes:', error);
    return { data: null, error };
  }
};

export const saveNote = async (userId, noteData) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ user_id: userId, ...noteData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving note:', error);
    return { data: null, error };
  }
};

export const updateNote = async (noteId, updates) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating note:', error);
    return { data: null, error };
  }
};

export const deleteNote = async (noteId) => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { error };
  }
};

// ============================================================================
// TASKS MANAGEMENT
// ============================================================================

export const fetchTasks = async (userId, includeCompleted = true) => {
  try {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        subtasks (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!includeCompleted) {
      query = query.eq('completed', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { data: null, error };
  }
};

export const saveTask = async (userId, taskData) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ user_id: userId, ...taskData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving task:', error);
    return { data: null, error };
  }
};

export const updateTask = async (taskId, updates) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating task:', error);
    return { data: null, error };
  }
};

export const toggleTaskCompletion = async (taskId, completed) => {
  try {
    const updates = { 
      completed,
      completed_at: completed ? new Date().toISOString() : null
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return { data: null, error };
  }
};

export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error };
  }
};

// ============================================================================
// SUBTASKS MANAGEMENT
// ============================================================================

export const saveSubtask = async (taskId, subtaskData) => {
  try {
    const { data, error } = await supabase
      .from('subtasks')
      .insert([{ task_id: taskId, ...subtaskData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving subtask:', error);
    return { data: null, error };
  }
};

export const updateSubtask = async (subtaskId, updates) => {
  try {
    const { data, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', subtaskId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating subtask:', error);
    return { data: null, error };
  }
};

export const deleteSubtask = async (subtaskId) => {
  try {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return { error };
  }
};

// ============================================================================
// ROUTINES MANAGEMENT
// ============================================================================

export const fetchRoutines = async (userId, activeOnly = false) => {
  try {
    let query = supabase
      .from('routines')
      .select(`
        *,
        routine_steps (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching routines:', error);
    return { data: null, error };
  }
};

export const saveRoutine = async (userId, routineData) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .insert([{ user_id: userId, ...routineData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving routine:', error);
    return { data: null, error };
  }
};

export const updateRoutine = async (routineId, updates) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating routine:', error);
    return { data: null, error };
  }
};

export const deleteRoutine = async (routineId) => {
  try {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting routine:', error);
    return { error };
  }
};

// ============================================================================
// ROUTINE STEPS MANAGEMENT
// ============================================================================

export const saveRoutineStep = async (routineId, stepData) => {
  try {
    const { data, error } = await supabase
      .from('routine_steps')
      .insert([{ routine_id: routineId, ...stepData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving routine step:', error);
    return { data: null, error };
  }
};

export const updateRoutineStep = async (stepId, updates) => {
  try {
    const { data, error } = await supabase
      .from('routine_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating routine step:', error);
    return { data: null, error };
  }
};

export const deleteRoutineStep = async (stepId) => {
  try {
    const { error } = await supabase
      .from('routine_steps')
      .delete()
      .eq('id', stepId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting routine step:', error);
    return { error };
  }
};

// ============================================================================
// CHAT SESSIONS & MESSAGES (Jarvin AI)
// ============================================================================

export const fetchChatSessions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return { data: null, error };
  }
};

export const saveChatSession = async (userId, sessionData) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: userId, ...sessionData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving chat session:', error);
    return { data: null, error };
  }
};

export const fetchMessages = async (chatSessionId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: null, error };
  }
};

export const saveMessage = async (chatSessionId, messageData) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_session_id: chatSessionId, ...messageData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving message:', error);
    return { data: null, error };
  }
};

// ============================================================================
// TIME LOGS MANAGEMENT
// ============================================================================

export const saveTimeLog = async (userId, timeLogData) => {
  try {
    const { data, error } = await supabase
      .from('time_logs')
      .insert([{ user_id: userId, ...timeLogData }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving time log:', error);
    return { data: null, error };
  }
};

export const fetchTimeLogs = async (userId, startDate = null, endDate = null) => {
  try {
    let query = supabase
      .from('time_logs')
      .select(`
        *,
        tasks(title),
        routines(name)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('started_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching time logs:', error);
    return { data: null, error };
  }
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const createTasksFromJarvin = async (userId, tasksArray) => {
  try {
    const tasksWithUserId = tasksArray.map(task => ({
      user_id: userId,
      ...task
    }));
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksWithUserId)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating tasks from Jarvin:', error);
    return { data: null, error };
  }
};

export const createRoutineWithSteps = async (userId, routineData, steps) => {
  try {
    // First create the routine
    const { data: routine, error: routineError } = await saveRoutine(userId, routineData);
    if (routineError) throw routineError;
    
    // Then create the steps
    const stepsWithRoutineId = steps.map((step, index) => ({
      routine_id: routine.id,
      order_index: index + 1,
      ...step
    }));
    
    const { data: routineSteps, error: stepsError } = await supabase
      .from('routine_steps')
      .insert(stepsWithRoutineId)
      .select();
    
    if (stepsError) throw stepsError;
    
    return { 
      data: { ...routine, routine_steps: routineSteps }, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating routine with steps:', error);
    return { data: null, error };
  }
};

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

export const getProductivityStats = async (userId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get time logs for the period
    const { data: timeLogs, error: timeError } = await fetchTimeLogs(
      userId, 
      startDate.toISOString()
    );
    
    if (timeError) throw timeError;
    
    // Get completed tasks for the period
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', startDate.toISOString());
    
    if (tasksError) throw tasksError;
    
    // Calculate statistics
    const totalFocusTime = timeLogs
      .filter(log => log.activity_type === 'focus')
      .reduce((sum, log) => sum + log.duration_seconds, 0);
    
    const completedTasksCount = tasks.length;
    
    return {
      data: {
        totalFocusTime,
        completedTasksCount,
        averageFocusPerDay: Math.round(totalFocusTime / days),
        timeLogs,
        completedTasks: tasks
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting productivity stats:', error);
    return { data: null, error };
  }
};
