import tkinter as tk
from tkinter import messagebox
import cv2
from PIL import Image, ImageTk
from ultralytics import YOLO
from collections import Counter
import threading
import requests
import time
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import base64
import json

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- YOLO Model ---
model = YOLO("D:/Github/NutriFlow/V4/weights.pt")

# --- Buffers ---
before_items = []
after_items = []
capture_running = False
latest_after_frame = None
current_frame = None  # Add this to store current frame for streaming

# --- User Profile ---
name = "John"
allergies = ["peanuts", "lactose"]
preferred_items = ["low-carb", "high-protein", "vegetables"]
risk_factors = ["heart disease", "diabetes"]
food_cusine = ["Italian", "Mexican", "Indian"]
age = 30

# --- LLM ---
def generate_meal_suggestion(taken_items):
    items_text = ", ".join([f"{count} {item}" for item, count in taken_items.items()])
    prompt = f"""
You are a smart health-focused AI meal planner. The following food items were just taken out of the fridge: {items_text}.

The person has DNA data suggesting a higher risk of {risk_factors}, is allergic to {allergies}, and prefers {preferred_items} as well as they like {food_cusine} cuisines.

They are {age} years old. Their name is {name}.

Please suggest 3 healthy meal ideas using ONLY the ingredients taken out, tailored to these needs and based on the time of day.

Give clear meal names and a short 1-sentence description for each.

Then provide the full recipe for the first meal, including ingredients and step-by-step instructions.

Make sure to avoid any allergens and focus on health benefits.
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=30
        )
        if response.status_code == 200:
            return response.json().get("response", "[LLM returned nothing]")
        else:
            return f"[LLM ERROR] Status: {response.status_code}\n{response.text}"
    except Exception as e:
        return f"[LLM ERROR] {str(e)}"

# --- GUI Setup ---
root = tk.Tk()
root.title("NutriFlow Fridge Tracker")
video_label = tk.Label(root)
video_label.pack()

cap = cv2.VideoCapture(2)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

def update_video():
    global current_frame
    ret, frame = cap.read()
    if ret:
        current_frame = frame.copy()  # Store for streaming
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame_rgb)
        imgtk = ImageTk.PhotoImage(image=img)
        video_label.imgtk = imgtk
        video_label.configure(image=imgtk)
    video_label.after(10, update_video)

def detect_items_from_frame(frame):
    results = model(frame)[0]
    return [results.names[int(cls)] for cls in results.boxes.cls.tolist()]

def start_capture_loop():
    global capture_running, latest_after_frame
    capture_running = True
    def loop():
        while capture_running:
            ret, frame = cap.read()
            if ret:
                latest_after_frame = frame
            time.sleep(10)
    threading.Thread(target=loop, daemon=True).start()

def handle_capture_before():
    global before_items
    ret, frame = cap.read()
    if not ret:
        messagebox.showerror("Error", "Failed to capture full fridge image.")
        return {"success": False, "error": "Failed to capture image"}
    
    before_items = detect_items_from_frame(frame)
    messagebox.showinfo("Captured", f"Full fridge:\n{Counter(before_items)}")
    start_capture_loop()
    return {"success": True, "before_items": before_items}

def compare_and_summarize():
    global capture_running, latest_after_frame, after_items
    capture_running = False
    
    if latest_after_frame is None:
        messagebox.showerror("Error", "No frame captured after fridge open.")
        return {"success": False, "error": "No frame captured"}
    
    after_items = detect_items_from_frame(latest_after_frame)
    before_count = Counter(before_items)
    after_count = Counter(after_items)
    taken = before_count - after_count
    
    if not taken:
        messagebox.showinfo("No Change", "Nothing was taken out.")
        return {"success": False, "message": "Nothing was taken out"}
    
    summary = "\n".join(f"{item}: {count}" for item, count in taken.items())
    print("[LLM INPUT]:", taken)
    
    result = generate_meal_suggestion(taken)
    messagebox.showinfo("Meal Suggestions", f"You removed:\n{summary}\n\n{result}")
    
    return {
        "success": True, 
        "taken_items": dict(taken),
        "meal_suggestion": result,
        "summary": summary
    }

# --- GUI Buttons ---
tk.Button(root, text="📷 Capture Full Fridge", command=handle_capture_before, width=30).pack(pady=10)
tk.Button(root, text="🍽 What Was Taken?", command=compare_and_summarize, width=30).pack(pady=10)

update_video()

# --- Flask Endpoints ---

@app.route('/video-feed')
def video_feed():
    """Video streaming route"""
    def generate_frames():
        while True:
            if current_frame is not None:
                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', current_frame)
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.1)  # Control frame rate
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video-frame')
def video_frame():
    """Get single frame as base64"""
    if current_frame is not None:
        ret, buffer = cv2.imencode('.jpg', current_frame)
        if ret:
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            return jsonify({"frame": frame_base64})
    return jsonify({"error": "No frame available"}), 404

@app.route('/update-profile', methods=['POST'])
def update_profile():
    global name, allergies, preferred_items, risk_factors, food_cusine, age
    data = request.json
    name = data.get('name', name)
    allergies = data.get('allergies', allergies)
    preferred_items = data.get('preferred_items', preferred_items)
    risk_factors = data.get('risk_factors', risk_factors)
    food_cusine = data.get('food_cusine', food_cusine)
    age = data.get('age', age)
    return {"success": True}

@app.route('/capture-before', methods=['POST'])
def flask_capture_before():
    result = handle_capture_before()
    return jsonify(result)

@app.route('/capture-after', methods=['POST'])
def flask_capture_after():
    result = compare_and_summarize()
    return jsonify(result)

@app.route('/status')
def status():
    return jsonify({
        "capture_running": capture_running,
        "camera_active": current_frame is not None,
        "before_items_count": len(before_items),
        "user_profile": {
            "name": name,
            "age": age,
            "allergies": allergies,
            "preferred_items": preferred_items,
            "risk_factors": risk_factors,
            "food_cusine": food_cusine
        }
    })

# --- Start Flask in thread ---
def start_flask():
    app.run(host='0.0.0.0', port=8000, debug=False)

threading.Thread(target=start_flask, daemon=True).start()

# --- Start GUI ---
root.mainloop()
cap.release()
cv2.destroyAllWindows()
