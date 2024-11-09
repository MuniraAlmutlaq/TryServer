import os
from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
import base64
import subprocess

app = Flask(__name__)
TEMP_DATABASE= 'Website/TemporaryDatabase'

#Ensuring TemporaryDatabase folder exists.
if not os.path.exists(TEMP_DATABASE):
    os.makedirs(TEMP_DATABASE)


@app.route('/')
def home():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


@app.route('/process-image', methods= ['POST'])
def process_image():
    data= request.get_json()
    image_data= data.get('image')

    if image_data:
        #Removing the prefix from base64 data.
        image_data= image_data.split(',')[1]
        image_bytes= base64.b64decode(image_data)

        #Saving the image as extracted_image.png.
        image_path= os.path.join(TEMP_DATABASE, 'extracted_image.png')
        with open(image_path, 'wb') as file:
            file.write(image_bytes)

        #Running ImageTextProcessing.py on the saved image.
        extract_command= ['python3', 'ImageTextProcessing.py', image_path]
        extracted_text= subprocess.run(extract_command, capture_output= True, text= True).stdout.strip()

        #Running Main.py with the extracted text to correct it.
        correct_command= ['python3', 'Main.py', extracted_text]
        subprocess.run(correct_command, capture_output= True, text= True)

        #Reading the corrected text from corrected_text.txt.
        corrected_text_file= os.path.join(TEMP_DATABASE, 'corrected_text.txt')
        with open(corrected_text_file, 'r', encoding= 'utf-8') as file:
            corrected_text= file.read()

        #Return the corrected text as response.
        return jsonify({'extracted_text': corrected_text})

    return jsonify({'error': 'No image data provided'}), 400


@app.route('/Website/TemporaryDatabase/<path:filename>', methods= ['GET'])
def download_file(filename):
    return send_from_directory(TEMP_DATABASE, filename)

@app.route('/reset', methods= ['POST'])
def reset():
    return redirect(url_for('home'))


if __name__ == '__main__':
    app.run(debug= True, port= 4000)