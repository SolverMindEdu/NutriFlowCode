import tkinter as tk
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
current_frame = None
frame_lock = threading.Lock()

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

# Add status label to show what's happening instead of popups
status_label = tk.Label(root, text="Ready", bg="lightgray", font=("Arial", 10))
status_label.pack(fill="x", padx=10, pady=5)

cap = cv2.VideoCapture(2)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

def update_status(message):
    """Update status label instead of showing popups"""
    status_label.config(text=message)
    print(f"[STATUS] {message}")

def update_video():
    global current_frame
    ret, frame = cap.read()
    if ret:
        with frame_lock:
            current_frame = frame.copy()
        
        # Update GUI
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
    update_status("Monitoring fridge - take items out when ready")
    
    def loop():
        while capture_running:
            with frame_lock:
                if current_frame is not None:
                    latest_after_frame = current_frame.copy()
            time.sleep(1)
    
    threading.Thread(target=loop, daemon=True).start()

def handle_capture_before():
    global before_items
    
    with frame_lock:
        if current_frame is None:
            update_status("ERROR: No camera frame available")
            return {"success": False, "error": "No camera frame available"}
        
        frame_to_analyze = current_frame.copy()
    
    before_items = detect_items_from_frame(frame_to_analyze)
    before_count = Counter(before_items)
    
    # Log to console and status instead of popup
    update_status(f"Captured full fridge: {len(before_items)} items detected")
    print(f"[CAPTURE] Full fridge items: {dict(before_count)}")
    
    start_capture_loop()
    return {"success": True, "before_items": before_items}

def compare_and_summarize():
    global capture_running, latest_after_frame, after_items
    capture_running = False
    update_status("Analyzing what was taken...")
    
    frame_to_analyze = None
    with frame_lock:
        if latest_after_frame is not None:
            frame_to_analyze = latest_after_frame.copy()
        elif current_frame is not None:
            frame_to_analyze = current_frame.copy()
    
    if frame_to_analyze is None:
        update_status("ERROR: No frame available for analysis")
        return {"success": False, "error": "No frame available for analysis"}
    
    after_items = detect_items_from_frame(frame_to_analyze)
    before_count = Counter(before_items)
    after_count = Counter(after_items)
    taken = before_count - after_count
    
    if not taken:
        update_status("No items were taken from the fridge")
        return {"success": False, "message": "Nothing was taken out"}
    
    summary = "\n".join(f"{item}: {count}" for item, count in taken.items())
    update_status(f"Items taken: {', '.join(taken.keys())} - Generating meal suggestions...")
    
    print(f"[ANALYSIS] Items taken: {dict(taken)}")
    print("[LLM] Generating meal suggestions...")
    
    result = generate_meal_suggestion(taken)
    update_status("Meal suggestions generated successfully!")
    
    print(f"[LLM] Generated meal suggestions")
    
    return {
        "success": True, 
        "taken_items": dict(taken),
        "meal_suggestion": result,
        "summary": summary
    }

# --- GUI Buttons ---
tk.Button(root, text="📷 Capture Full Fridge", command=handle_capture_before, width=30).pack(pady=10)
tk.Button(root, text="🍽 What Was Taken?", command=compare_and_summarize, width=30).pack(pady=10)

# Add clear button
def clear_status():
    update_status("Ready")
    global capture_running
    capture_running = False

tk.Button(root, text="🔄 Clear Status", command=clear_status, width=30).pack(pady=5)

update_video()

# --- Flask Endpoints ---

@app.route('/video-feed')
def video_feed():
    """Video streaming route"""
    def generate_frames():
        while True:
            with frame_lock:
                if current_frame is not None:
                    frame_to_send = current_frame.copy()
                else:
                    continue
            
            ret, buffer = cv2.imencode('.jpg', frame_to_send, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.033)
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video-frame')
def video_frame():
    """Get single frame as base64"""
    with frame_lock:
        if current_frame is not None:
            frame_to_send = current_frame.copy()
        else:
            return jsonify({"error": "No frame available"}), 404
    
    ret, buffer = cv2.imencode('.jpg', frame_to_send)
    if ret:
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        return jsonify({"frame": frame_base64})
    return jsonify({"error": "Failed to encode frame"}), 500

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
    
    print(f"[PROFILE] Updated user profile for {name}")
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
    with frame_lock:
        camera_active = current_frame is not None
    
    return jsonify({
        "capture_running": capture_running,
        "camera_active": camera_active,
        "before_items_count": len(before_items),
        "current_status": status_label.cget("text"),
        "user_profile": {
            "name": name,
            "age": age,
            "allergies": allergies,
            "preferred_items": preferred_items,
            "risk_factors": risk_factors,
            "food_cusine": food_cusine
        }
    })

@app.route('/test')
def test():
    return jsonify({"message": "Backend is working!", "timestamp": time.time()})

# --- Start Flask in thread ---
def start_flask():
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)

flask_thread = threading.Thread(target=start_flask, daemon=True)
flask_thread.start()

print("🚀 NutriFlow Backend Started!")
print("- GUI: Running (No popups mode)")
print("- Flask API: http://localhost:8000")
print("- Video Stream: http://localhost:8000/video-feed")
print("- Status updates will show in console and GUI status bar")

# --- Start GUI ---
try:
    root.mainloop()
except KeyboardInterrupt:
    print("Shutting down...")
finally:
    cap.release()
    cv2.destroyAllWindows()