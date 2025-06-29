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

Format your response EXACTLY like this:

MEAL 1: [Meal Name]
DESCRIPTION: [One sentence description]
CALORIES: [estimated calories per serving]
INGREDIENTS:
- [ingredient 1]
- [ingredient 2]
- [ingredient 3]
INSTRUCTIONS:
1. [step 1]
2. [step 2]
3. [step 3]

MEAL 2: [Meal Name]
DESCRIPTION: [One sentence description]
CALORIES: [estimated calories per serving]
INGREDIENTS:
- [ingredient 1]
- [ingredient 2]
INSTRUCTIONS:
1. [step 1]
2. [step 2]

MEAL 3: [Meal Name]
DESCRIPTION: [One sentence description]
CALORIES: [estimated calories per serving]
INGREDIENTS:
- [ingredient 1]
- [ingredient 2]
INSTRUCTIONS:
1. [step 1]
2. [step 2]

Make sure to:
- Avoid any allergens ({allergies})
- Focus on health benefits for {risk_factors}
- Include estimated calories per serving
- Use only the ingredients that were taken out
- Make recipes suitable for someone who is {age} years old
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

def check_allergies(taken_items):
    """Check if any taken items match user allergies"""
    allergy_warnings = []
    
    # Convert allergies to lowercase for comparison
    user_allergies = [allergy.lower() for allergy in allergies]
    
    for item in taken_items.keys():
        item_lower = item.lower()
        
        # Check direct matches
        for allergy in user_allergies:
            if allergy in item_lower or item_lower in allergy:
                allergy_warnings.append({
                    "item": item,
                    "allergy": allergy,
                    "warning": f"⚠️ WARNING: {item} may contain {allergy} which you're allergic to!"
                })
        
        # Check common allergen mappings
        allergen_mappings = {
            "milk": ["lactose", "dairy"],
            "cheese": ["lactose", "dairy"],
            "butter": ["lactose", "dairy"],
            "yogurt": ["lactose", "dairy"],
            "bread": ["gluten", "wheat"],
            "pasta": ["gluten", "wheat"],
            "nuts": ["peanuts", "tree nuts"],
            "peanut": ["peanuts"],
            "fish": ["fish"],
            "salmon": ["fish"],
            "tuna": ["fish"],
            "shrimp": ["shellfish"],
            "crab": ["shellfish"],
            "eggs": ["eggs"],
        }
        
        if item_lower in allergen_mappings:
            for potential_allergen in allergen_mappings[item_lower]:
                if potential_allergen in user_allergies:
                    allergy_warnings.append({
                        "item": item,
                        "allergy": potential_allergen,
                        "warning": f"⚠️ WARNING: {item} contains {potential_allergen} which you're allergic to!"
                    })
    
    return allergy_warnings

# --- GUI Setup ---
root = tk.Tk()
root.title("NutriFlow Fridge Tracker")
video_label = tk.Label(root)
video_label.pack()

status_label = tk.Label(root, text="Ready", bg="lightgray", font=("Arial", 10))
status_label.pack(fill="x", padx=10, pady=5)

cap = cv2.VideoCapture(2)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

def update_status(message):
    status_label.config(text=message)
    print(f"[STATUS] {message}")

def update_video():
    global current_frame
    ret, frame = cap.read()
    if ret:
        with frame_lock:
            current_frame = frame.copy()
        
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
            time.sleep(0.5)
    
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
    
    # Check for allergy warnings
    allergy_warnings = check_allergies(taken)
    
    if allergy_warnings:
        warning_messages = []
        for warning in allergy_warnings:
            warning_messages.append(warning["warning"])
            print(f"[ALLERGY WARNING] {warning['warning']}")
        
        # Show warning popup
        warning_text = "\n".join(warning_messages)
        warning_text += "\n\nDo you want to continue with meal suggestions anyway?"
        
        result = messagebox.askyesno("⚠️ ALLERGY WARNING", warning_text)
        if not result:
            update_status("Meal generation cancelled due to allergy concerns")
            return {
                "success": False, 
                "message": "Meal generation cancelled due to allergy warnings",
                "allergy_warnings": allergy_warnings
            }
    
    summary = "\n".join(f"{item}: {count}" for item, count in taken.items())
    update_status(f"Items taken: {', '.join(taken.keys())} - Generating meal suggestions...")
    
    print(f"[ANALYSIS] Items taken: {dict(taken)}")
    print("[LLM] Generating meal suggestions with calories...")
    
    result = generate_meal_suggestion(taken)
    update_status("Meal suggestions with calories generated successfully!")
    
    print(f"[LLM] Generated meal suggestions with nutritional info")
    
    return {
        "success": True, 
        "taken_items": dict(taken),
        "meal_suggestion": result,
        "summary": summary,
        "allergy_warnings": allergy_warnings if allergy_warnings else []
    }

# --- GUI Buttons ---
tk.Button(root, text="📷 Capture Full Fridge", command=handle_capture_before, width=30).pack(pady=10)
tk.Button(root, text="🍽 What Was Taken?", command=compare_and_summarize, width=30).pack(pady=10)

def clear_status():
    update_status("Ready")
    global capture_running
    capture_running = False

tk.Button(root, text="🔄 Clear Status", command=clear_status, width=30).pack(pady=5)

update_video()

# --- Flask Endpoints ---

@app.route('/video-feed')
def video_feed():
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
    print(f"[PROFILE] Allergies: {allergies}")
    return {"success": True}

@app.route('/get-profile', methods=['GET'])
def get_profile():
    return jsonify({
        "name": name,
        "allergies": allergies,
        "preferred_items": preferred_items,
        "risk_factors": risk_factors,
        "food_cusine": food_cusine,
        "age": age
    })

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

# --- Start Flask ---
def start_flask():
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)

flask_thread = threading.Thread(target=start_flask, daemon=True)
flask_thread.start()

print("🚀 NutriFlow Backend Started with Allergy Warnings!")
print("- Allergy checking: ENABLED")
print("- Calorie estimation: ENABLED")
print("- Flask API: http://localhost:8000")

try:
    root.mainloop()
except KeyboardInterrupt:
    print("Shutting down...")
finally:
    cap.release()
    cv2.destroyAllWindows()
