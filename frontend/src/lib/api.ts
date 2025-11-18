const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Tasks
export const getTodayTasks = async () => {
  const response = await fetch(`${API_BASE_URL}/tasks/today`);
  return response.json();
};

export const getAllTasks = async () => {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  return response.json();
};

export const createTask = async (task: any) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return response.json();
};

export const updateTask = async (id: number, task: any) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return response.json();
};

export const deleteTask = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

// Expenses
export const getLast7DaysExpenses = async () => {
  const response = await fetch(`${API_BASE_URL}/expenses/7days`);
  return response.json();
};

export const getAllExpenses = async () => {
  const response = await fetch(`${API_BASE_URL}/expenses`);
  return response.json();
};

export const createExpense = async (expense: any) => {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  return response.json();
};

export const updateExpense = async (id: number, expense: any) => {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  return response.json();
};

export const deleteExpense = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

// Study Goals
export const getStudyGoals = async () => {
  const response = await fetch(`${API_BASE_URL}/study-goals`);
  return response.json();
};

export const createStudyGoal = async (goal: any) => {
  const response = await fetch(`${API_BASE_URL}/study-goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  return response.json();
};

export const updateStudyGoal = async (id: number, goal: any) => {
  const response = await fetch(`${API_BASE_URL}/study-goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  return response.json();
};

export const deleteStudyGoal = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/study-goals/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

// AI Assistant
export const chatWithAssistant = async (message: string) => {
  const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return response.json();
};

export const getDailyPlan = async () => {
  const response = await fetch(`${API_BASE_URL}/assistant/daily-plan`);
  return response.json();
};

export const getDailySummary = async () => {
  const response = await fetch(`${API_BASE_URL}/assistant/daily-summary`);
  return response.json();
};
