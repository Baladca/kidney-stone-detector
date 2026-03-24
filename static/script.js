document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const confSlider = document.getElementById('confSlider');
    const confVal = document.getElementById('confVal');
    const loader = document.getElementById('loader');
    const detectionInfo = document.getElementById('detectionInfo');
    const patientIDInput = document.getElementById('patientID');
    const previewImg = document.getElementById('preview');
    const outputImg = document.getElementById('outputImage');

    const generateCaseID = () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `BOOBALAN-${dateStr}-${randomSuffix}`;
    };

    if (patientIDInput) patientIDInput.value = generateCaseID();

    confSlider.addEventListener('input', (e) => {
        confVal.textContent = parseFloat(e.target.value).toFixed(2);
    });

    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (JPEG, PNG, etc.).');
            return;
        }

        dropZone.querySelector('p').innerHTML = `
            <span style="color: var(--primary); font-size: 2rem;">🖼️</span><br>
            <strong>Selected:</strong> ${file.name}<br>
            <span style="font-size: 0.85rem; color: var(--text-muted)">Click or drag to change image</span>
        `;

        previewImg.src = URL.createObjectURL(file);
        outputImg.src = ''; 
        outputImg.parentElement.setAttribute('data-label', 'AI Analysis (Pending...)');
        
        detectionInfo.innerHTML = "Scan loaded successfully. Ready for AI inference.";
        downloadPdfBtn.style.display = "none"; 
    };

    dropZone.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--primary)';
            dropZone.style.backgroundColor = '#eff6ff';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.backgroundColor = '#f8fafc';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            imageInput.files = files; 
            handleFile(files[0]);
        }
    });

    uploadBtn.addEventListener('click', async () => {
        if (!imageInput.files.length) {
            alert("Please select a CT scan image first!");
            return;
        }

        loader.style.display = "block";
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = "⌛ Running Inference...";
        downloadPdfBtn.style.display = "none";
        detectionInfo.innerHTML = "Processing radiological scan through YOLO model...";
        outputImg.parentElement.setAttribute('data-label', 'Analyzing...');

        const formData = new FormData();
        formData.append("file", imageInput.files[0]);
        formData.append("conf", confSlider.value);

        try {
            const response = await fetch("/predict", { method: "POST", body: formData });
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            const resultImg = "data:image/jpeg;base64," + data.annotated_image;
            outputImg.src = resultImg;
            outputImg.parentElement.setAttribute('data-label', 'AI Analysis (Complete)');
            
            let infoHTML = `<strong>Total Calculi Detected:</strong> <span style="color: var(--primary); font-size: 1.2rem; font-weight: bold;">${data.stones_detected}</span><br><br>`;
            
            if (data.stones && data.stones.length > 0) {
                infoHTML += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
                data.stones.forEach((s, i) => {
                    infoHTML += `<div style="padding: 10px; background: white; border: 1px solid var(--border); border-radius: 6px; border-left: 4px solid var(--primary);">
                        <strong>Stone ${i + 1}:</strong> ${parseFloat(s.size_mm).toFixed(2)}mm diameter <br>
                        <span style="font-size: 0.85rem; color: var(--text-muted)">Location Coordinates: ${s.location}</span>
                    </div>`;
                });
                infoHTML += `</div>`;
            } else {
                infoHTML += `<div style="padding: 10px; background: #ecfdf5; color: var(--success); border-radius: 6px; font-weight: 500;">
                    ✅ No significant kidney stones detected at the ${confSlider.value} confidence threshold.
                </div>`;
            }
            
            detectionInfo.innerHTML = infoHTML;
            downloadPdfBtn.style.display = "flex"; 

        } catch (err) {
            detectionInfo.innerHTML = `<span style="color: var(--danger); font-weight: bold;">⚠️ Analysis Error:</span> ${err.message || "Failed to connect to the prediction server."}`;
            outputImg.parentElement.setAttribute('data-label', 'Analysis Failed');
        } finally {
            loader.style.display = "none";
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = "⚡ Analyze Scan";
        }
    });

    downloadPdfBtn.addEventListener('click', () => {
        const originalText = downloadPdfBtn.innerHTML;
        downloadPdfBtn.innerHTML = "⌛ Compiling PDF...";
        downloadPdfBtn.disabled = true;

        const element = document.getElementById('pdfTemplate');
        const caseID = patientIDInput.value || "BOOBALAN-GENERIC";
        
        document.getElementById('pdfPatient').innerText = caseID;
        document.getElementById('pdfDate').innerText = new Date().toLocaleString();
        document.getElementById('pdfText').innerHTML = detectionInfo.innerHTML;
        document.getElementById('pdfImg').src = outputImg.src;

        element.style.display = 'block';

        const options = {
            margin: 10,
            filename: `AI_Diagnostic_Report_${caseID}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save().then(() => {
            element.style.display = 'none'; 
            downloadPdfBtn.innerHTML = originalText;
            downloadPdfBtn.disabled = false;
        }).catch(err => {
            console.error("PDF Generation Error:", err);
            element.style.display = 'none';
            downloadPdfBtn.innerHTML = "⚠️ Error Generating PDF";
            setTimeout(() => {
                downloadPdfBtn.innerHTML = originalText;
                downloadPdfBtn.disabled = false;
            }, 3000);
        });
    });
});