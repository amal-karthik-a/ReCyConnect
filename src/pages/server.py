
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io
import google.generativeai as genai
import torch
import logging
import time
import socket

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini with a valid API key
API_KEY = 'AIzaSyAbYLgSA4hAyUTbOxrF5G0NhE3hYKDhP8I'
genai.configure(api_key=API_KEY)
try:
    model = genai.GenerativeModel('gemini-2.0-flash-001')  # Updated to a lighter preview model
    # Comment out test to save quota during development
    # test_response = model.generate_content("Test API key")
    logger.info("Gemini model initialized, API key test skipped in development")
except Exception as e:
    logger.error(f"Failed to initialize Gemini model or validate API key: {e}")
    if "429" in str(e):
        logger.warning("Quota exceeded. Retrying after delay...")
        time.sleep(60)  # Increased delay to 60 seconds
        # test_response = model.generate_content("Test API key")  # Uncomment if needed after quota reset
        logger.info("Retry successful or skipped")
    else:
        raise

# Load YOLO model
try:
    yolo_model = torch.hub.load('ultralytics/yolov5', 'custom', path='waste_model.pt')
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    raise

# Define waste categories
WASTE_CATEGORIES = {
    'plastic_bottle': {'category': 'Plastic', 'biodegradable': False},
    'paper': {'category': 'Paper', 'biodegradable': True},
    'metal_can': {'category': 'Metal', 'biodegradable': False},
    'glass_bottle': {'category': 'Glass', 'biodegradable': False},
    'organic_waste': {'category': 'Organic', 'biodegradable': True},
    'vase': {'category': 'Unknown', 'biodegradable': False}
}

def check_network():
    try:
        socket.create_connection(("www.google.com", 80), timeout=5)
        return True
    except socket.error:
        return False

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if not check_network():
        return jsonify({'error': 'Network unavailable. Please check your internet connection.'}), 503

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    img_bytes = file.read()
    
    try:
        img = Image.open(io.BytesIO(img_bytes))
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        results = yolo_model(img_cv)
        detections = results.pandas().xyxy[0]
        
        if len(detections) == 0:
            return jsonify({'error': 'No waste detected'}), 400
        
        primary_detection = detections.iloc[0]
        waste_type = primary_detection['name']
        logger.debug(f"Detected waste type: {waste_type}")
        
        category_info = WASTE_CATEGORIES.get(waste_type, {
            'category': 'Unknown',
            'biodegradable': False
        })
        
        prompt = f"""
        Provide detailed information about {waste_type} waste:
        1. Environmental impact
        2. Proper disposal methods
        3. Harmful effects if not disposed properly
        4. Whether it's commonly recyclable
        Respond in a structured format with each point on a new line.
        If {waste_type} is not a recognized waste type, provide general information for an unknown waste item.
        """
        
        try:
            response = model.generate_content(prompt)
            environmental_info = response.text.split('\n')
            logger.debug(f"Raw Gemini response: {environmental_info}")
            environmental_impact = environmental_info[0].replace('1. ', '') if environmental_info and len(environmental_info) > 0 else "Could not generate additional information."
            disposal_recommendations = environmental_info[1].replace('2. ', '') if len(environmental_info) > 1 else "N/A"
            additional_info = "\n".join([line.replace(f'{i+3}. ', '') for i, line in enumerate(environmental_info[2:])]) if len(environmental_info) > 2 else "N/A"
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            if "429" in str(e):
                return jsonify({'error': 'Quota exceeded. Please wait or upgrade your plan at https://ai.google.dev/gemini-api/docs/rate-limits.'}), 429
            environmental_impact = "Could not generate additional information."
            disposal_recommendations = "N/A"
            additional_info = "N/A"
        
        return jsonify({
            'wasteType': waste_type,
            'category': category_info['category'],
            'biodegradable': category_info['biodegradable'],
            'environmentalImpact': environmental_impact,
            'disposalRecommendations': disposal_recommendations,
            'additionalInfo': additional_info
        })
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return jsonify({'error': 'Error processing image'}), 500

if __name__ == '__main__':
    app.run(debug=True)
