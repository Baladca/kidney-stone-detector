---
title: Kidney Stone Detector (YOLO)
emoji: 🩺
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🩺 Kidney Stone Detection Engine (YOLO)

[![Hugging Face Spaces](https://img.shields.io/badge/🤗%20Hugging%20Face-Live%20Demo-blue)](https://huggingface.co/spaces/boobalandca/kidney-stone-detector)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2.0-ee4c2c.svg)](https://pytorch.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

An end-to-end, highly optimized AI diagnostic dashboard for detecting and measuring renal calculi (kidney stones) in high-resolution CT scans. Powered by a custom-trained YOLO model, this tool provides real-time clinical findings, bounding box annotations, and automated PDF reporting.

Developed by: Boobalan E. | Research Associate, SIMATS  

---

## 🚀 Live Demo
Try the interactive application directly on Hugging Face Spaces:
[Kidney Stone Detector - Live App](https://huggingface.co/spaces/boobalandca/kidney-stone-detector)

---

## ✨ Key Features

Advanced Medical Dashboard:** A sleek, responsive, vanilla HTML/CSS/JS frontend featuring drag-and-drop uploads and dynamic confidence threshold sliders.
Automated PDF Reporting:** Instantly generates a downloadable diagnostic report containing the annotated scan, case ID, detection metrics, and timestamp using `html2pdf.js`.
Extreme Memory Optimization:** The Flask backend utilizes a pure OpenCV/NumPy pipeline, decoding byte streams directly into arrays. By bypassing heavy intermediate libraries like PIL, it prevents Out-Of-Memory (OOM) crashes during high-resolution image processing.
Production-Ready Concurrency:** Deployed via a single-worker Gunicorn setup with thread-safe (`gthread`) model locking, allowing the application to handle concurrent inference requests without RAM spiking.

---

## 🛠️ Technology Stack

Machine Learning: PyTorch, Ultralytics (YOLO)
Image Processing: OpenCV (`cv2`), NumPy
Backend: Python, Flask, Gunicorn
Frontend: HTML5, CSS3, JavaScript
Deployment: Docker, Hugging Face Spaces

---

## 🐳 Quick Start (Docker - Recommended)

The easiest way to run this application locally without worrying about PyTorch/CUDA dependencies is via Docker.

**1. Clone the repository:**
```bash
git clone [https://github.com/Baladca/kidney-stone-detector.git](https://github.com/Baladca/kidney-stone-detector.git)
cd kidney-stone-detector
