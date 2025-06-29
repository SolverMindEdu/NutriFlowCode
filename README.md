# 🥗 NutriFlow AI  
**Sector:** Health and Wellness  
**Hackathon:** Code4Hope 2025  

## 🌟 The Problem  
Personalized nutrition plans exist — but people don’t always follow them.  
Most apps rely on users to **log meals**, **track groceries**, or **follow strict routines**, which often fails in busy real life.  

## 🧠 Our Solution  
**NutriFlow AI** is a **smart dietary assistant** that uses **hardware + AI** to passively monitor what’s actually in your fridge — and dynamically generate **doctor-approved, personalized meal suggestions**.

### 🧊 Hardware  
- A small **USB or Pi camera** installed in your fridge  
- Powered by **Raspberry Pi** or **Orange Pi**, continuously monitoring fridge contents

### 👁️ Software  
- **Computer Vision (OpenCV + YOLO/MediaPipe)** to detect food items in real-time  
- Inventory updates when you **take out** or **put in** food  
- **Adaptive recipe engine** that:
  - Suggests meals based on **current ingredients**
  - Takes into account your **DNA, lifestyle, and health goals**
  - Sends **alerts or nudges** (e.g. “You’re low on greens. Consider a salad tonight!”)

## 🚀 Key Features  
- 🧃 Passive food tracking — no manual logging  
- 🧬 DNA/lifestyle-based preferences baked in  
- 🍱 Doctor-generated meal plans using available ingredients  
- 📤 Optional share function so nutritionists can monitor remotely  
- 🔁 Real-time adaptation as food is added or removed

## 🔧 Tech Stack  
- **Hardware:** Raspberry Pi / Orange Pi + USB/CSI camera  
- **CV Library:** OpenCV, possibly YOLOv5 for object detection  
- **Backend:** Python, Flask/FastAPI  
- **Frontend:** Streamlit or lightweight React dashboard  
- **Database:** SQLite or Firebase for food inventory and preferences  

## 💡 Why It Works  
Instead of asking users to *change* their habits, NutriFlow AI works *with* them — capturing real-life fridge behavior to recommend **realistic**, **timely**, and **healthy** choices.  
By combining **passive hardware sensing** and **personalized health data**, we close the gap between **ideal plans** and **real-life action**.

## 👥 Team  
Team NutriFlow — Code4Hope 2025  
Lead: Ryan Zhang  
Contact: [solver.mind.edu@gmail.com](mailto:solver.mind.edu@gmail.com)

## 📜 License  
This project is under a **custom non-commercial license**.  
Public or commercial use requires written permission.  
See [`LICENSE`](./LICENSE) for details.
