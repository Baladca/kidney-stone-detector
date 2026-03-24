import time
import threading
import traceback
import base64
import numpy as np

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from ultralytics import YOLO
import cv2
import torch

# Configuration
MODEL_PATH = "best.pt"          
PIXEL_TO_MM = 0.264             
DEFAULT_CONF = 0.5
RETURN_IMAGE_DEFAULT = True
MAX_IMAGE_DIMENSION = 4096            

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
USE_FP16 = DEVICE == "cuda"

# Disable gradients to save memory
torch.set_grad_enabled(False)

app = Flask(__name__)
CORS(app)

# Load Model Globally
try:
    model = YOLO(MODEL_PATH)
    model.to(DEVICE)
    if USE_FP16:
        model.model.half()
    MODEL_READY = True
except Exception as e:
    MODEL_READY = False
    MODEL_ERROR = str(e)
    print(f"Failed to load YOLO model: {MODEL_ERROR}")

model_lock = threading.Lock()

def encode_image(img_cv):
    _, buffer = cv2.imencode(".jpg", img_cv, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buffer).decode("utf-8")

def decode_image_bytes(image_bytes):
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_cv = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if img_cv is None:
        raise ValueError("Invalid or corrupted image file.")
        
    height, width = img_cv.shape[:2]
    if max(height, width) > MAX_IMAGE_DIMENSION:
        raise ValueError(f"Image dimensions ({width}x{height}) exceed maximum allowed.")
        
    return img_cv, width, height

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if MODEL_READY else "error",
        "device": DEVICE,
        "fp16": USE_FP16,
        "model_loaded": MODEL_READY,
        "cuda_available": torch.cuda.is_available()
    })

@app.route("/predict", methods=["POST"])
def predict():
    start_time = time.time()

    if not MODEL_READY:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        image_bytes = file.read()

        conf_thres = float(request.form.get("conf", DEFAULT_CONF))
        return_image = request.form.get("return_image", str(RETURN_IMAGE_DEFAULT)).lower() == "true"

        img_cv, width, height = decode_image_bytes(image_bytes)

        with model_lock:
            results = model(img_cv, conf=conf_thres, device=DEVICE, verbose=False)

        detections = results[0].boxes
        stones = []

        if detections is not None and len(detections) > 0:
            for box in detections:
                x1, y1, x2, y2 = map(float, box.xyxy[0])
                confidence = round(float(box.conf[0]), 3)

                w_mm = (x2 - x1) * PIXEL_TO_MM
                h_mm = (y2 - y1) * PIXEL_TO_MM
                size_mm = round(max(w_mm, h_mm), 2)

                center_x = (x1 + x2) / 2
                location = "Left Kidney" if center_x < width / 2 else "Right Kidney"

                stones.append({
                    "size_mm": size_mm,
                    "location": location,
                    "confidence": confidence,
                    "bbox_px": [int(x1), int(y1), int(x2), int(y2)]
                })

                label = f"{size_mm}mm | {location.split()[0]} | {confidence}"
                cv2.rectangle(img_cv, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                cv2.putText(img_cv, label, (int(x1), max(25, int(y1) - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        response = {
            "stones_detected": len(stones),
            "stones": stones,
            "inference_time_ms": round((time.time() - start_time) * 1000, 2)
        }

        if return_image:
            response["annotated_image"] = encode_image(img_cv)

        del img_cv
        del image_bytes

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, threaded=True)