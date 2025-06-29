import tkinter as tk
from tkinter import messagebox
import cv2
from PIL import Image, ImageTk
from ultralytics import YOLO
from collections import Counter
import threading
import requests
import time

# Load YOLO model
model = YOLO("D:/Github/NutriFlow/V4/weights.pt")

# Buffers
before_items = []
after_items = []
capture_running = False
latest_after_frame = None

# User profile
name = "John"
allergies = ["peanuts", "lactose"]
preferred_items = ["low-carb", "high-protein", "vegetables"]
risk_factors = ["heart disease", "diabetes"]
food_cusine = ["Italian", "Mexican", "Indian"]
age = 30

# Meal generation prompt
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

# GUI
root = tk.Tk()
root.title("NutriFlow Fridge Tracker")

video_label = tk.Label(root)
video_label.pack()

cap = cv2.VideoCapture(2)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

def update_video():
    ret, frame = cap.read()
    if ret:
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
        return
    before_items = detect_items_from_frame(frame)
    messagebox.showinfo("Captured", f"Full fridge:\n{Counter(before_items)}")
    start_capture_loop()

def compare_and_summarize():
    global capture_running, latest_after_frame, after_items
    capture_running = False

    if latest_after_frame is None:
        messagebox.showerror("Error", "No frame captured after fridge open.")
        return

    after_items = detect_items_from_frame(latest_after_frame)
    before_count = Counter(before_items)
    after_count = Counter(after_items)
    taken = before_count - after_count

    if not taken:
        messagebox.showinfo("No Change", "Nothing was taken out.")
        return

    summary = "\n".join(f"{item}: {count}" for item, count in taken.items())
    print("[LLM INPUT]:", taken)

    # LLM result
    result = generate_meal_suggestion(taken)
    messagebox.showinfo("Meal Suggestions", f"You removed:\n{summary}\n\n{result}")

# Buttons
tk.Button(root, text="📷 Capture Full Fridge", command=handle_capture_before, width=30).pack(pady=10)
tk.Button(root, text="🍽 What Was Taken?", command=compare_and_summarize, width=30).pack(pady=10)

update_video()
root.mainloop()

cap.release()
cv2.destroyAllWindows()
