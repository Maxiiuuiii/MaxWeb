
class ObamaImageTransformer {
    constructor() {
        this.currentFile = null;
        this.originalImage = null;
        this.transformedCanvas = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File input and upload zone
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        // Fix: Ensure click on upload zone triggers file input
        uploadZone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });

        // Prevent default click behavior on the input itself to avoid double triggers
        fileInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Control buttons
        document.getElementById('clearFile').addEventListener('click', () => this.clearFile());
        document.getElementById('transformBtn').addEventListener('click', () => this.startTransformation());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadResult());
        document.getElementById('newImageBtn').addEventListener('click', () => this.resetApp());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only remove dragover if we're actually leaving the upload zone
        if (!e.currentTarget.contains(e.relatedTarget)) {
            document.getElementById('uploadZone').classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Hide any previous error messages
        document.getElementById('errorMessage').classList.add('hidden');

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Bitte wählen Sie eine gültige Bilddatei (JPG oder PNG).');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('Die Datei ist zu groß. Maximum: 10MB.');
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);
        this.showPreview(file);
    }

    showFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileInfo').classList.remove('hidden');
    }

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('originalImage');
            img.src = e.target.result;
            img.onload = () => {
                this.originalImage = img;
                document.getElementById('previewSection').classList.remove('hidden');
                document.getElementById('previewSection').classList.add('fade-in');
                // Scroll to preview section
                document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        };
        reader.readAsDataURL(file);
    }

    clearFile() {
        this.currentFile = null;
        this.originalImage = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').classList.add('hidden');
        document.getElementById('previewSection').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        document.getElementById('processingSection').classList.add('hidden');
    }

    async startTransformation() {
        if (!this.originalImage) return;

        this.showProcessingSection();
        await this.simulateProcessing();
        this.performTransformation();
        this.showResults();
    }

    showProcessingSection() {
        document.getElementById('previewSection').classList.add('hidden');
        document.getElementById('processingSection').classList.remove('hidden');
        document.getElementById('processingSection').classList.add('fade-in');
        // Scroll to processing section
        document.getElementById('processingSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async simulateProcessing() {
        const steps = [
            { text: 'Gesichtserkennung...', duration: 1000 },
            { text: 'Hautton-Analyse...', duration: 1200 },
            { text: 'Obama-Transformation...', duration: 1500 },
            { text: 'Feinabstimmung...', duration: 800 },
            { text: 'Finalisierung...', duration: 500 }
        ];

        const progressFill = document.getElementById('progressFill');
        const statusEl = document.getElementById('processingStatus');
        const percentageEl = document.getElementById('processingPercentage');

        let totalProgress = 0;
        const totalSteps = steps.length;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            statusEl.textContent = step.text;
            
            // Animate progress
            const startProgress = totalProgress;
            const endProgress = ((i + 1) / totalSteps) * 100;
            
            await this.animateProgress(progressFill, percentageEl, startProgress, endProgress, step.duration);
            totalProgress = endProgress;
        }
    }

    animateProgress(progressEl, percentageEl, start, end, duration) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const progressDiff = end - start;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentProgress = start + (progressDiff * progress);

                progressEl.style.width = currentProgress + '%';
                percentageEl.textContent = Math.round(currentProgress) + '%';

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    performTransformation() {
        const canvas = document.getElementById('afterCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match original image proportionally
        const img = this.originalImage;
        const maxSize = 250; // Max display size
        const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
        
        canvas.width = img.naturalWidth * ratio;
        canvas.height = img.naturalHeight * ratio;
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
        
        // Draw original image scaled
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Apply Obama-like transformations
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply color transformations to simulate Obama-like appearance
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to grayscale first
            const gray = (r + g + b) / 3;
            
            // Apply sepia-like warming effect
            let newR = Math.min(255, gray + 40);
            let newG = Math.min(255, gray + 20);
            let newB = Math.max(0, gray - 10);
            
            // Enhance skin tones (detect skin-like colors)
            if (this.isSkinTone(r, g, b)) {
                // Make skin warmer and slightly darker (Obama-like complexion)
                newR = Math.min(255, newR * 0.9 + 30);
                newG = Math.min(255, newG * 0.8 + 15);
                newB = Math.max(0, newB * 0.7);
            }
            
            // Increase contrast
            newR = this.adjustContrast(newR, 1.2);
            newG = this.adjustContrast(newG, 1.2);
            newB = this.adjustContrast(newB, 1.2);
            
            data[i] = newR;
            data[i + 1] = newG;
            data[i + 2] = newB;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Apply additional CSS filters for final touch
        canvas.style.filter = 'contrast(1.1) brightness(0.95) saturate(1.3)';
        
        this.transformedCanvas = canvas;
    }

    isSkinTone(r, g, b) {
        // Simple skin tone detection
        return r > 95 && g > 40 && b > 20 && 
               Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
               Math.abs(r - g) > 15 && r > g && r > b;
    }

    adjustContrast(color, contrast) {
        return Math.max(0, Math.min(255, ((color - 128) * contrast) + 128));
    }

    showResults() {
        document.getElementById('processingSection').classList.add('hidden');
        
        // Set up comparison images
        const beforeImg = document.getElementById('beforeImage');
        beforeImg.src = this.originalImage.src;
        
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('resultsSection').classList.add('fade-in');
        
        // Scroll to results section
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    downloadResult() {
        if (!this.transformedCanvas) return;
        
        // Create download link
        this.transformedCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'obama-transformed-' + Date.now() + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    resetApp() {
        this.clearFile();
        document.getElementById('uploadZone').classList.remove('dragover');
        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        const errorTextEl = document.getElementById('errorText');
        errorTextEl.textContent = message;
        errorEl.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ObamaImageTransformer();
});

// Add some fun easter eggs
document.addEventListener('keydown', (e) => {
    // Konami Code easter egg
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    if (!window.konamiProgress) window.konamiProgress = 0;
    
    if (e.keyCode === konamiCode[window.konamiProgress]) {
        window.konamiProgress++;
        if (window.konamiProgress === konamiCode.length) {
            document.querySelector('.header__title').innerHTML = '🇺🇸 Obama Image Transformer <span style="font-size: 0.5em;">- Yes We Can!</span>';
            window.konamiProgress = 0;
        }
    } else {
        window.konamiProgress = 0;
    }
});
