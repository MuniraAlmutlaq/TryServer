import cv2
import numpy as np
import pytesseract
import re
import os
from difflib import SequenceMatcher
# Testing
import matplotlib.pyplot as plt

TEMP_DATABASE= 'Website/TemporaryDatabase'

#Reading the uploaded image.
image_path= os.path.join(TEMP_DATABASE, 'extracted_image.png')
arabic_text_file = os.path.join(TEMP_DATABASE, 'arabic_text.txt')
image= cv2.imread(image_path)

def basic_preprocessing(image):
    gray= cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return gray

def equalization_clahe(image):
    gray= cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    equalized= cv2.equalizeHist(gray)
    clahe= cv2.createCLAHE(clipLimit= 3.6, tileGridSize= (4, 4))
    high_contrast= clahe.apply(equalized)
    return high_contrast

def gaussian_thresholding(image):
    gray= cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred= cv2.GaussianBlur(gray, (5, 5), 0)
    thresholded= cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 9, 4)
    return thresholded

def bilateral_thresholding(image):
    gray= cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    smoothed= cv2.bilateralFilter(gray, 9, 85, 75)
    thresholded= cv2.adaptiveThreshold(smoothed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return thresholded

def morphological_transform(image):
    gray= cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresholded= cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    kernel= np.ones((2, 2), np.uint8)
    dilated= cv2.morphologyEx(thresholded, cv2.MORPH_CLOSE, kernel)
    return dilated

def clahe_bilateral_morphology(image):
    gray= cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    equalized= cv2.equalizeHist(gray)
    clahe= cv2.createCLAHE(clipLimit= 2.0, tileGridSize= (8, 8))
    high_contrast= clahe.apply(equalized)
    smoothed= cv2.bilateralFilter(high_contrast, 9, 75, 75)
    kernel=  np.ones((2, 2), np.uint8)
    morph= cv2.morphologyEx(smoothed, cv2.MORPH_CLOSE, kernel)
    return morph

def extract_text(image, method):
    processed_image= method(image)
    text= pytesseract.image_to_string(processed_image, lang= 'ara', config= r'--oem 3')
    text= re.sub(r"[^\w\s,.?!\u0600-\u06FF]", "", text)
    return " ".join(text.split())  # Normalize spaces

def load_saved_text():
    with open(arabic_text_file, 'r', encoding='utf-8') as file:
        saved_text= file.read()
    return " ".join(saved_text.split())  # Normalize spaces

def compare_texts(extracted_text, saved_text):
    similarity= SequenceMatcher(None, extracted_text, saved_text).ratio()
    return similarity

# Load saved text
saved_text= load_saved_text()

# Applying each method and comparing output
methods= [
    basic_preprocessing,
    equalization_clahe,
    gaussian_thresholding,
    bilateral_thresholding,
    morphological_transform,
    clahe_bilateral_morphology
]

for method in methods:
    extracted_text= extract_text(image, method)
    accuracy= compare_texts(extracted_text, saved_text)
    print(f"Method {method.__name__}: {extracted_text}")
    print(f"Accuracy: {accuracy:.2%}\n")

with open(arabic_text_file, 'w', encoding= 'utf-8') as file:
    textMode= extract_text(image, bilateral_thresholding)
    file.write(textMode)
    print(f"\n\n{arabic_text_file} (Finished).")



