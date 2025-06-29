# 🥗 NutriFlow AI  
**Sector:** Health and Wellness  
**Hackathon:** Code4Hope 2025  

## 🌟 The Problem  
Personalized nutrition plans exist — but most people don’t follow them.  
Why? Because they rely on users to **manually log meals**, **track groceries**, and **follow strict routines**, which often break down in busy, real life.  

## 🧠 Our Solution  
**NutriFlow AI** is a **smart, real-time dietary assistant** that combines **hardware**, **computer vision**, and **local AI** to turn your fridge into a personalized health tool — no logging or tracking required.

### 🧊 Hardware  
- A **USB or Pi camera** installed inside the fridge  
- Runs on a **Raspberry Pi** or **Orange Pi**, capturing food images  
- Tracks what's taken out or put in using live camera comparisons  

### 👁️ Software  
- **YOLOv8 + Roboflow** trained on 2,000+ custom fridge images  
- Automatically detects food changes between "before" and "after" snapshots  
- Sends results to a **locally hosted LLaMA 3** AI model (via **Ollama**) to generate:  
  - Personalized meals based on fridge contents  
  - Adjusted for **DNA risks**, **allergies**, **age**, **cuisine preferences**, and **time of day**  
  - Clear instructions, calories, and ingredient lists  

## 🚀 Key Features  
- 🧃 Passive food tracking — no need to log anything  
- 🧬 Health-aware personalization (DNA, allergies, lifestyle)  
- 🍱 LLaMA-powered recipe generation with natural language prompts  
- 📸 Real-time detection using fridge camera and object tracking  
- 🔊 Future: Voice/chatbot interaction and expiry detection  

## 🖥️ User Interface  
- Built using **V0 (Vercel)** and customized in **TypeScript + TSX**  
- Two-button UX: `Start Capture` and `What Was Taken?`  
- Meal suggestions appear instantly, with no typing or manual input  

## 🔧 Tech Stack  
- **Hardware:** Raspberry Pi / Orange Pi + USB/CSI camera  
- **CV Library:** OpenCV, YOLOv8 (via Roboflow)  
- **AI Model:** LLaMA 3 via Ollama (local, fast, offline-capable)  
- **Backend:** Python + Flask  
- **Frontend:** V0 (React/TSX UI)  
- **Data:** JSON / SQLite for local user profiles  

## 💡 Why It Works  
NutriFlow doesn’t ask users to change how they eat — it works with them.  
By using **passive sensing**, **real fridge data**, and **personal health profiles**, we turn food tracking into a background task and meal planning into a personalized, AI-driven experience.

## 👥 Team  
Team NutriFlow — Code4Hope 2025  
Lead Developer: Ryan Zhang  
Project Manager: Ryan Kong  
UI/Design: Queena Lin  
Contact: [solver.mind.edu@gmail.com](mailto:solver.mind.edu@gmail.com)

## 📜 License  
This project is under a **custom non-commercial license**.  
Any public or commercial use requires written permission.  
See [`LICENSE`](./LICENSE) for more details.
