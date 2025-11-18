# VECTOR MEMORY DESIGN – LIFE MANAGER AI
# VECTOR MEMORY DESIGN – (Bản Full)

---

# Purpose
Cho AI khả năng nhớ dài hạn như con người.

---

# Data Stored
- Insights  
- Study notes  
- Life goals  
- Mood logs  
- Preferences  

---

# Architecture

User input
   ▼
Embedding Model (Groq embedding)
   ▼
ChromaDB / Pinecone
   ▼
Query memory when needed
   ▼
Inject to context

---

# API FLOW

POST /assistant/chat:
1. embed user message
2. vector search
3. merge relevant memory into context
4. send to AI
5. store new insights

