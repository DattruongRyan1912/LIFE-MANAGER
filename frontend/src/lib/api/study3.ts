const API_BASE = 'http://localhost:8000/api';

// Module APIs
export const moduleAPI = {
  // Get all modules for a goal
  getModules: async (goalId: number) => {
    const res = await fetch(`${API_BASE}/study-goals/${goalId}/modules`);
    if (!res.ok) throw new Error('Failed to fetch modules');
    return res.json();
  },

  // Get single module with details
  getModule: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}`);
    if (!res.ok) throw new Error('Failed to fetch module');
    return res.json();
  },

  // Create module
  createModule: async (goalId: number, data: {
    title: string;
    description?: string;
    estimated_hours: number;
  }) => {
    const res = await fetch(`${API_BASE}/study-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: goalId, ...data }),
    });
    if (!res.ok) throw new Error('Failed to create module');
    return res.json();
  },

  // Update module
  updateModule: async (moduleId: number, data: Partial<{
    title: string;
    description: string;
    estimated_hours: number;
  }>) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update module');
    return res.json();
  },

  // Delete module
  deleteModule: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete module');
    return res.json();
  },

  // Generate modules with AI
  generateModules: async (goalId: number) => {
    const res = await fetch(`${API_BASE}/study-goals/${goalId}/generate-modules`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate modules');
    return res.json();
  },

  // Reorder modules
  reorderModules: async (goalId: number, moduleIds: number[]) => {
    const res = await fetch(`${API_BASE}/study-goals/${goalId}/reorder-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_ids: moduleIds }),
    });
    if (!res.ok) throw new Error('Failed to reorder modules');
    return res.json();
  },
};

// Task APIs
export const taskAPI = {
  // Get all tasks for a module
  getTasks: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  // Get single task
  getTask: async (taskId: number) => {
    const res = await fetch(`${API_BASE}/study-tasks/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  // Create task
  createTask: async (moduleId: number, data: {
    title: string;
    description?: string;
    due_date: string;
    estimated_minutes: number;
    priority: 'low' | 'medium' | 'high';
  }) => {
    const res = await fetch(`${API_BASE}/study-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId, ...data }),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  // Update task
  updateTask: async (taskId: number, data: Partial<{
    title: string;
    description: string;
    due_date: string;
    estimated_minutes: number;
    priority: 'low' | 'medium' | 'high';
  }>) => {
    const res = await fetch(`${API_BASE}/study-tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  // Delete task
  deleteTask: async (taskId: number) => {
    const res = await fetch(`${API_BASE}/study-tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  // Toggle task completion
  toggleTask: async (taskId: number) => {
    const res = await fetch(`${API_BASE}/study-tasks/${taskId}/toggle`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle task');
    return res.json();
  },

  // Generate tasks with AI
  generateTasks: async (moduleId: number, startDate?: string) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate }),
    });
    if (!res.ok) throw new Error('Failed to generate tasks');
    return res.json();
  },

  // Get pending tasks
  getPendingTasks: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}/tasks/pending`);
    if (!res.ok) throw new Error('Failed to fetch pending tasks');
    return res.json();
  },

  // Get overdue tasks
  getOverdueTasks: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}/tasks/overdue`);
    if (!res.ok) throw new Error('Failed to fetch overdue tasks');
    return res.json();
  },

  // Bulk update priority
  bulkUpdatePriority: async (taskIds: number[], priority: 'low' | 'medium' | 'high') => {
    const res = await fetch(`${API_BASE}/study-tasks/bulk-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: taskIds, priority }),
    });
    if (!res.ok) throw new Error('Failed to update priorities');
    return res.json();
  },

  // Reschedule task
  rescheduleTask: async (taskId: number, newDueDate: string) => {
    const res = await fetch(`${API_BASE}/study-tasks/${taskId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_due_date: newDueDate }),
    });
    if (!res.ok) throw new Error('Failed to reschedule task');
    return res.json();
  },
};

// Note APIs
export const noteAPI = {
  // Get notes for module
  getNotes: async (moduleId: number, type?: 'lesson' | 'reflection' | 'insight') => {
    const url = type 
      ? `${API_BASE}/study-modules/${moduleId}/notes?type=${type}`
      : `${API_BASE}/study-modules/${moduleId}/notes`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  // Get single note
  getNote: async (noteId: number) => {
    const res = await fetch(`${API_BASE}/study-notes/${noteId}`);
    if (!res.ok) throw new Error('Failed to fetch note');
    return res.json();
  },

  // Create note
  createNote: async (data: {
    module_id: number;
    task_id?: number;
    content: string;
    note_type: 'lesson' | 'reflection' | 'insight';
  }) => {
    const res = await fetch(`${API_BASE}/study-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },

  // Update note
  updateNote: async (noteId: number, data: Partial<{
    content: string;
    note_type: 'lesson' | 'reflection' | 'insight';
  }>) => {
    const res = await fetch(`${API_BASE}/study-notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },

  // Delete note
  deleteNote: async (noteId: number) => {
    const res = await fetch(`${API_BASE}/study-notes/${noteId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  },

  // Get insights for module
  getInsights: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}/insights`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  },

  // Search notes
  searchNotes: async (query: string, limit: number = 10) => {
    const res = await fetch(`${API_BASE}/study-notes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) throw new Error('Failed to search notes');
    return res.json();
  },

  // Find similar insights
  findSimilarInsights: async (query: string, limit: number = 5) => {
    const res = await fetch(`${API_BASE}/study-notes/similar-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) throw new Error('Failed to find similar insights');
    return res.json();
  },
};

// Recommendation APIs
export const recommendationAPI = {
  // Get daily study plan
  getDailyPlan: async () => {
    const res = await fetch(`${API_BASE}/study/daily-plan`);
    if (!res.ok) throw new Error('Failed to fetch daily plan');
    return res.json();
  },

  // Get resource suggestions for module
  getResources: async (moduleId: number) => {
    const res = await fetch(`${API_BASE}/study-modules/${moduleId}/resources`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  // Get weaknesses for goal
  getWeaknesses: async (goalId: number) => {
    const res = await fetch(`${API_BASE}/study-goals/${goalId}/weaknesses`);
    if (!res.ok) throw new Error('Failed to fetch weaknesses');
    return res.json();
  },

  // Get goals overview
  getGoalsOverview: async () => {
    const res = await fetch(`${API_BASE}/study/goals-overview`);
    if (!res.ok) throw new Error('Failed to fetch goals overview');
    return res.json();
  },

  // Get study statistics
  getStatistics: async () => {
    const res = await fetch(`${API_BASE}/study/statistics`);
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return res.json();
  },
};
