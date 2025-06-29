import os
from glob import glob

# Path to your Fruits-360 dataset root
root_dir = r'd:/Github/NutriFlow/Data/fruits-360_original-size/fruits-360-original-size'

# For each split (Training, Test, Validation)
for split in ['Training', 'Test', 'Validation']:
    split_dir = os.path.join(root_dir, split)
    if not os.path.isdir(split_dir):
        continue
    # Get sorted list of class folder names
    class_names = sorted([d for d in os.listdir(split_dir) if os.path.isdir(os.path.join(split_dir, d))])
    print(f"[{split}] Found {len(class_names)} classes.")
    for class_id, class_name in enumerate(class_names):
        class_dir = os.path.join(split_dir, class_name)
        # Find all images in this class
        for img_path in glob(os.path.join(class_dir, '*.jpg')):
            # YOLO label: class_id x_center y_center width height (all normalized)
            label = f"{class_id} 0.5 0.5 1.0 1.0\n"
            label_path = os.path.splitext(img_path)[0] + '.txt'
            with open(label_path, 'w') as f:
                f.write(label)
    # Optionally, save class_names for this split
    with open(os.path.join(split_dir, 'class_names.txt'), 'w') as f:
        for name in class_names:
            f.write(name + '\n')
print('YOLO label files generated for all classes!')
