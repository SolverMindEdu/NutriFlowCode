# Real-time fruit detection and inventory tracking using YOLOv5, PyTorch, and OpenCV
# Make sure you have installed: torch, opencv-python, and yolov5 (from https://github.com/ultralytics/yolov5)

import cv2
import torch
from collections import defaultdict

# Load your halfway trained YOLOv5 model (change path if needed)
model = torch.hub.load('yolov5', 'custom', path='yolov5s.pt', source='local')

# Set model to evaluation mode
model.eval()

# Initialize webcam (0 is usually the default camera)
cap = cv2.VideoCapture(1)

# Inventory dictionary to count detected fruits
inventory = defaultdict(int)

# Font for drawing text
font = cv2.FONT_HERSHEY_SIMPLEX

while True:
    # Capture frame-by-frame
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Run YOLOv5 inference
    results = model(frame)
    detections = results.xyxy[0]  # Bounding boxes with scores and class

    # For each detection, draw rectangle and label
    for *box, conf, cls in detections:
        x1, y1, x2, y2 = map(int, box)
        label = model.names[int(cls)]
        # Update inventory
        inventory[label] += 1
        # Draw rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # Draw label
        cv2.putText(frame, f'{label} {conf:.2f}', (x1, y1 - 10), font, 0.7, (0, 255, 0), 2)

    # Display inventory on the frame
    y0 = 30
    for i, (fruit, count) in enumerate(inventory.items()):
        text = f'{fruit}: {count}'
        cv2.putText(frame, text, (10, y0 + 30 * i), font, 0.8, (255, 0, 0), 2)

    # Show the frame
    cv2.imshow('Fruit Detection', frame)

    # Exit if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
