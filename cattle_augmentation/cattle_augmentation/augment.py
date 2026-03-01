from tensorflow.keras.preprocessing.image import ImageDataGenerator, load_img, img_to_array
import numpy as np
import os

# Load image
img = load_img("D:\\cattle_augmentation\\cattle_augmentation\\input\\Holstein-cow.webp", target_size=(224, 224))
img_array = img_to_array(img)
img_array = np.expand_dims(img_array, axis=0)

# Augmentation configuration
datagen = ImageDataGenerator(
    rotation_range=30,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.2,
    shear_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

# Output folder
output_dir = "output"
os.makedirs(output_dir, exist_ok=True)

# Generate & save augmented images
count = 0
for batch in datagen.flow(
        img_array,
        batch_size=1,
        save_to_dir=output_dir,
        save_prefix="cattle_aug",
        save_format="jpg"):
    count += 1
    if count == 10:   # number of images to generate
        break

print("Augmentation completed successfully!")