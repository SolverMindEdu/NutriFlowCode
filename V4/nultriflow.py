import cv2
from roboflow import Roboflow
import numpy as np
import tempfile
import os

# Initialize Roboflow
rf = Roboflow(api_key="2m3V3mUe7Ee3wfrVqwYS")
project = rf.workspace("frc10015").project("nutriflow-rzerp")
model = project.version(4).model

# Start webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Cannot access webcam")
    exit()

print("Starting real-time detection... Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Save frame to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp:
        temp_filename = temp.name

    cv2.imwrite(temp_filename, frame)

    try:
        predictions = model.predict(temp_filename, confidence=40, overlap=30).json()

        # Draw bounding boxes
        for pred in predictions["predictions"]:
            x, y = int(pred["x"]), int(pred["y"])
            w, h = int(pred["width"]), int(pred["height"])
            class_name = pred["class"]

            x1, y1 = x - w // 2, y - h // 2
            x2, y2 = x + w // 2, y + h // 2

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, class_name, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    except Exception as e:
        print("Detection error:", e)

    # Display the frame
    cv2.imshow("NutriFlow Detection", frame)

    # Clean up
    os.remove(temp_filename)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
