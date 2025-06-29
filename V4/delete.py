import os
import tempfile
import cv2
from PIL import Image

# Inside your webcam loop:
with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp:
    temp_filename = temp.name

cv2.imwrite(temp_filename, frame)  # Save frame to file

# Now predict on the saved image
predictions = model.predict(temp_filename, confidence=40, overlap=30).json()

# Clean up the temporary file after prediction
os.remove(temp_filename)
