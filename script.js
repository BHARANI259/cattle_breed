/* ============================================================
   CattleVision AI — script.js
   Handles: Dark Mode, Language, Upload, Camera, Prediction,
            Comparison, History, Dashboard, Animations
   ============================================================ */

'use strict';

// ===================== BREED DATABASE =====================
const BREEDS = {
  gir: {
    name: 'Gir Cow',
    origin: 'Gujarat',
    type: 'Dairy',
    milk: '6–8 L/day',
    climate: 'Hot & Arid',
    traits: 'Disease resistant, heat tolerant, known for A2 milk with medicinal value',
    diseases: 'Foot & Mouth, Mastitis',
    feed: 'Green fodder, dry fodder, mineral mix'
  },
  sahiwal: {
    name: 'Sahiwal',
    origin: 'Punjab / Haryana',
    type: 'Dairy',
    milk: '8–16 L/day',
    climate: 'Tropical',
    traits: 'High milk yield, tick resistant, calm temperament',
    diseases: 'Tick fever, TB',
    feed: 'Green fodder, concentrate'
  },
  ongole: {
    name: 'Ongole',
    origin: 'Andhra Pradesh',
    type: 'Dual Purpose',
    milk: '3–5 L/day',
    climate: 'Hot & Humid',
    traits: 'Draught power, disease resistant, white coat',
    diseases: 'FMD, BQ',
    feed: 'Dry fodder, oilcake'
  },
  holstein: {
    name: 'Holstein Friesian',
    origin: 'Netherlands',
    type: 'Dairy',
    milk: '25–30 L/day',
    climate: 'Temperate',
    traits: 'Highest milk yield globally, black & white patches',
    diseases: "Mastitis, Johne's Disease",
    feed: 'High energy concentrate'
  },
  jersey: {
    name: 'Jersey',
    origin: 'Jersey Island',
    type: 'Dairy',
    milk: '15–20 L/day',
    climate: 'Temperate',
    traits: 'High butterfat content, small size, light fawn color',
    diseases: 'Ketosis, Milk fever',
    feed: 'Pasture, silage, concentrate'
  },
  tharparkar: {
    name: 'Tharparkar',
    origin: 'Rajasthan',
    type: 'Dual Purpose',
    milk: '4–6 L/day',
    climate: 'Arid & Dry',
    traits: 'Drought tolerant, white to grey coat, high adaptability',
    diseases: 'Tick fever',
    feed: 'Dry fodder, crop residue'
  },
  kankrej: {
    name: 'Kankrej',
    origin: 'Gujarat',
    type: 'Draught',
    milk: '3–4 L/day',
    climate: 'Hot & Arid',
    traits: 'Fast walker, strong draught animal, steel-grey coat',
    diseases: 'FMD',
    feed: 'Dry fodder, hay, concentrate'
  }
};

// Comparison table field definitions
const COMPARE_FIELDS = [
  ['Origin State',         'origin'],
  ['Breed Type',           'type'],
  ['Avg. Milk Yield',      'milk'],
  ['Climate Suitability',  'climate'],
  ['Special Traits',       'traits'],
  ['Common Diseases',      'diseases'],
  ['Feed Recommendation',  'feed']
];

// ===================== STATE =====================
let predHistory = JSON.parse(localStorage.getItem('cattleHistory') || '[]');
let pieChart     = null;
let cameraStream = null;

// Backend base URL — override by setting `window.BACKEND_URL` in the page
const BACKEND_BASE = (function(){
  if (window.BACKEND_URL) return window.BACKEND_URL.replace(/\/+$/, '');
  // When served over http(s) use same origin, otherwise default to localhost:8000
  try {
    if (location.protocol && location.protocol.startsWith('http') && location.host) {
      return `${location.protocol}//${location.host}`;
    }
  } catch(e) {}
  return 'http://localhost:8000';
})();

// ===================== DARK MODE =====================
/**
 * Toggle between light and dark theme.
 */
function toggleDark() {
  const html    = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Apply saved theme on load
(function applySavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// ===================== MOBILE MENU =====================
/**
 * Show/hide the mobile navigation overlay.
 */
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// ===================== MULTI-LANGUAGE =====================
const i18n = {
  en: {
    'badge':           'AI-Powered Classification',
    'hero-title-1':    'Identify Cattle Breeds',
    'hero-title-2':    'Instantly with AI',
    'hero-tagline':    'Upload an image to identify cattle breed instantly using our deep learning model trained on 30+ Indian and international breeds.',
    'start-btn':       'Start Prediction',
    'dashboard-btn':   'View Dashboard',
    'stat1':           'Accuracy',
    'stat2':           'Breeds',
    'stat3':           'Avg. Speed',
    'stat4':           'Images',
    'hero-img-label':  'AI Vision Active',
    'upload-label':    'Image Upload',
    'upload-title':    'Upload Your Cattle Image',
    'upload-sub':      'Use any of the options below — drag & drop, browse files, or capture directly from your camera.',
    'drop-title':      'Drag & Drop Your Image Here',
    'drop-sub':        'Supports JPG, PNG, WEBP — Max 10MB',
    'browse-btn':      'Browse Files',
    'camera-btn':      'Use Camera',
    'predict-btn':     '🔬 Predict Breed',
    'tip1-title':      'Best Image Quality',
    'tip1-desc':       "Use clear, well-lit photos with the cattle's full body visible for accurate classification.",
    'tip2-title':      'Side Profile Works Best',
    'tip2-desc':       'A lateral view of the animal provides the most distinguishing features for the model.',
    'tip3-title':      'Outdoor Lighting',
    'tip3-desc':       'Natural daylight or uniform indoor lighting significantly improves prediction accuracy.',
    'tip4-title':      'Supported Breeds',
    'tip4-desc':       'Gir, Sahiwal, Ongole, Holstein Friesian, Jersey, Murrah Buffalo, Tharparkar and 25+ more breeds.',
    'results-label':   'Prediction Results',
    'results-title':   'Classification Analysis',
    'identified-breed':'Identified Breed',
    'confidence':      'Confidence Score',
    'top3':            'Top 3 Predicted Breeds',
    'pred-time':       'Prediction time:',
    'breed-info':      'Breed Information',
    'origin':          'Origin State',
    'type':            'Breed Type',
    'milk':            'Avg. Milk Yield',
    'climate':         'Climate Suitability',
    'traits':          'Special Characteristics',
    'diseases':        'Common Diseases',
    'feed':            'Feed Recommendation',
    'compare-label':   'Breed Comparison',
    'compare-title':   'Compare Cattle Breeds',
    'compare-sub':     'Select two breeds to compare their characteristics side by side.',
    'history-label':   'Prediction History',
    'history-title':   'Recent Predictions',
    'download-btn':    'Download Report',
    'clear-btn':       'Clear',
    'no-history':      'No predictions yet. Upload an image to get started!',
    'dashboard-label': 'Admin Dashboard',
    'dashboard-title': 'System Analytics',
    'dash1':           'Total Images Processed',
    'dash2':           'Most Detected Breed',
    'dash3':           'Model Accuracy',
    'dash4':           'Avg. Prediction Time',
    'chart-title':     'Breed Detection Distribution'
  },
  ta: {
    'badge':           'AI-சக்தி வகைப்பாடு',
    'hero-title-1':    'மாட்டு இனங்களை',
    'hero-title-2':    'AI மூலம் உடனடியாக கண்டறியுங்கள்',
    'hero-tagline':    'படத்தை பதிவேற்றி, AI மூலம் மாட்டு இனத்தை உடனடியாக அடையாளம் காணுங்கள்.',
    'start-btn':       'தொடங்குக',
    'dashboard-btn':   'டாஷ்போர்ட் காண்க',
    'stat1':           'துல்லியம்',
    'stat2':           'இனங்கள்',
    'stat3':           'வேகம்',
    'stat4':           'படங்கள்',
    'hero-img-label':  'AI பார்வை செயலில்',
    'upload-label':    'படம் பதிவேற்றம்',
    'upload-title':    'மாட்டு படத்தை பதிவேற்றுங்கள்',
    'upload-sub':      'கீழே உள்ள விருப்பங்களை பயன்படுத்துங்கள் — இழுத்து விடுங்கள், கோப்பு தேர்ந்தெடுங்கள் அல்லது கேமரா பயன்படுத்துங்கள்.',
    'drop-title':      'இங்கே படத்தை இழுத்து விடுங்கள்',
    'drop-sub':        'JPG, PNG, WEBP ஆதரிக்கப்படும் — அதிகபட்சம் 10MB',
    'browse-btn':      'கோப்புகளை உலாவுக',
    'camera-btn':      'கேமரா பயன்படுத்துக',
    'predict-btn':     '🔬 இனம் கண்டறி',
    'tip1-title':      'சிறந்த படத் தரம்',
    'tip1-desc':       'மாட்டின் முழு உடல் தெரியும் வகையில் தெளிவான படங்களை பயன்படுத்துங்கள்.',
    'tip2-title':      'பக்கவாட்டு காட்சி',
    'tip2-desc':       'விலங்கின் பக்கவாட்டு காட்சி மிகவும் துல்லியமான முடிவுகளை தரும்.',
    'tip3-title':      'வெளிப்புற வெளிச்சம்',
    'tip3-desc':       'இயற்கை அல்லது சீரான உள் வெளிச்சம் நல்ல முடிவுகளை தரும்.',
    'tip4-title':      'ஆதரிக்கப்படும் இனங்கள்',
    'tip4-desc':       'கிர், சாஹிவால், ஓங்கோல், ஹோல்ஸ்டைன் மற்றும் 25+ இனங்கள்.',
    'results-label':   'கணிப்பு முடிவுகள்',
    'results-title':   'வகைப்பாடு பகுப்பாய்வு',
    'identified-breed':'கண்டறியப்பட்ட இனம்',
    'confidence':      'நம்பிக்கை மதிப்பெண்',
    'top3':            'முதல் 3 கணிப்புகள்',
    'pred-time':       'கணிப்பு நேரம்:',
    'breed-info':      'இன தகவல்',
    'origin':          'தோற்றம்',
    'type':            'இன வகை',
    'milk':            'சராசரி பால் உற்பத்தி',
    'climate':         'காலநிலை',
    'traits':          'சிறப்பு குணாதிசயங்கள்',
    'diseases':        'பொதுவான நோய்கள்',
    'feed':            'தீவன பரிந்துரை',
    'compare-label':   'இன ஒப்பீடு',
    'compare-title':   'மாட்டு இனங்களை ஒப்பிடுக',
    'compare-sub':     'இரண்டு இனங்களை தேர்ந்தெடுத்து ஒப்பிடுங்கள்.',
    'history-label':   'கணிப்பு வரலாறு',
    'history-title':   'சமீபத்திய கணிப்புகள்',
    'download-btn':    'அறிக்கை பதிவிறக்கம்',
    'clear-btn':       'அழி',
    'no-history':      'இன்னும் கணிப்புகள் இல்லை. படத்தை பதிவேற்றி தொடங்குங்கள்!',
    'dashboard-label': 'நிர்வாக டாஷ்போர்ட்',
    'dashboard-title': 'கணினி பகுப்பாய்வு',
    'dash1':           'மொத்த படங்கள் செயலாக்கம்',
    'dash2':           'அதிகம் கண்டறியப்பட்ட இனம்',
    'dash3':           'மாதிரி துல்லியம்',
    'dash4':           'சராசரி கணிப்பு நேரம்',
    'chart-title':     'இன கண்டறிதல் விநியோகம்'
  },
  hi: {
    'badge':           'AI-संचालित वर्गीकरण',
    'hero-title-1':    'मवेशी नस्लों को',
    'hero-title-2':    'AI से तुरंत पहचानें',
    'hero-tagline':    'एक छवि अपलोड करें और हमारे डीप लर्निंग मॉडल से मवेशी नस्ल को तुरंत पहचानें।',
    'start-btn':       'शुरू करें',
    'dashboard-btn':   'डैशबोर्ड देखें',
    'stat1':           'सटीकता',
    'stat2':           'नस्लें',
    'stat3':           'औसत गति',
    'stat4':           'छवियां',
    'hero-img-label':  'AI दृष्टि सक्रिय',
    'upload-label':    'छवि अपलोड',
    'upload-title':    'अपनी मवेशी छवि अपलोड करें',
    'upload-sub':      'नीचे दिए गए किसी भी विकल्प का उपयोग करें — ड्रैग और ड्रॉप, फ़ाइल चुनें, या कैमरा का उपयोग करें।',
    'drop-title':      'यहाँ अपनी छवि खींचें और छोड़ें',
    'drop-sub':        'JPG, PNG, WEBP समर्थित — अधिकतम 10MB',
    'browse-btn':      'फ़ाइलें खोजें',
    'camera-btn':      'कैमरा उपयोग करें',
    'predict-btn':     '🔬 नस्ल पहचानें',
    'tip1-title':      'सर्वोत्तम छवि गुणवत्ता',
    'tip1-desc':       'सटीक वर्गीकरण के लिए पशु के पूरे शरीर के साथ स्पष्ट तस्वीरें उपयोग करें।',
    'tip2-title':      'साइड प्रोफाइल सर्वोत्तम',
    'tip2-desc':       'पशु का पार्श्व दृश्य मॉडल के लिए सबसे अधिक विशेषताएं प्रदान करता है।',
    'tip3-title':      'बाहरी रोशनी',
    'tip3-desc':       'प्राकृतिक दिन की रोशनी या समान इनडोर रोशनी सटीकता में सुधार करती है।',
    'tip4-title':      'समर्थित नस्लें',
    'tip4-desc':       'गिर, साहीवाल, ओंगोल, होल्स्टीन फ्रीजियन, जर्सी और 25+ नस्लें।',
    'results-label':   'पूर्वानुमान परिणाम',
    'results-title':   'वर्गीकरण विश्लेषण',
    'identified-breed':'पहचानी गई नस्ल',
    'confidence':      'विश्वास स्कोर',
    'top3':            'शीर्ष 3 अनुमानित नस्लें',
    'pred-time':       'पूर्वानुमान समय:',
    'breed-info':      'नस्ल जानकारी',
    'origin':          'मूल राज्य',
    'type':            'नस्ल प्रकार',
    'milk':            'औसत दूध उत्पादन',
    'climate':         'जलवायु अनुकूलता',
    'traits':          'विशेष लक्षण',
    'diseases':        'सामान्य रोग',
    'feed':            'चारा अनुशंसा',
    'compare-label':   'नस्ल तुलना',
    'compare-title':   'मवेशी नस्लों की तुलना करें',
    'compare-sub':     'दो नस्लें चुनें और उनकी विशेषताओं की तुलना करें।',
    'history-label':   'पूर्वानुमान इतिहास',
    'history-title':   'हाल के अनुमान',
    'download-btn':    'रिपोर्ट डाउनलोड',
    'clear-btn':       'साफ़ करें',
    'no-history':      'अभी तक कोई अनुमान नहीं। शुरू करने के लिए एक छवि अपलोड करें!',
    'dashboard-label': 'एडमिन डैशबोर्ड',
    'dashboard-title': 'सिस्टम विश्लेषण',
    'dash1':           'कुल प्रसंस्कृत छवियां',
    'dash2':           'सबसे अधिक पहचानी गई नस्ल',
    'dash3':           'मॉडल सटीकता',
    'dash4':           'औसत पूर्वानुमान समय',
    'chart-title':     'नस्ल पहचान वितरण'
  }
};

/**
 * Apply selected language to all data-i18n elements.
 * @param {string} lang - 'en' | 'ta' | 'hi'
 */
function setLanguage(lang) {
  const t = i18n[lang];
  if (!t) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
}

// ===================== DRAG AND DROP =====================
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('dragover');
}

function handleDragLeave() {
  document.getElementById('drop-zone').classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processFile(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

/**
 * Read an image file and show preview.
 * @param {File} file
 */
function processFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('preview-img').src        = e.target.result;
    document.getElementById('preview-wrapper').style.display = 'block';
    document.getElementById('img-filename').textContent = file.name;
    document.getElementById('img-filesize').textContent = (file.size / 1024).toFixed(1) + ' KB';
    window._currentImageData = e.target.result;
    showToast('✅ Image loaded successfully!');
  };
  reader.readAsDataURL(file);
}

// ===================== CAMERA =====================
/**
 * Open camera modal and start video stream.
 */
function openCamera() {
  const modal = document.getElementById('camera-modal');
  const errEl = document.getElementById('camera-error');
  const captureBtn = document.getElementById('capture-btn');

  // show modal and reset UI
  modal.classList.add('open');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  if (captureBtn) captureBtn.disabled = true;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const msg = 'Camera not supported in this browser.';
    if (errEl) { errEl.style.display = 'block'; errEl.textContent = msg; }
    showToast('❌ ' + msg);
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      cameraStream = stream;
      const video = document.getElementById('camera-video');
      video.srcObject = stream;
      // enable capture when video is ready
      video.onloadedmetadata = () => {
        video.play().catch(()=>{});
        if (captureBtn) captureBtn.disabled = false;
      };
    })
    .catch((err) => {
      const msg = (err && err.name) ? ('Camera error: ' + err.name) : 'Camera access denied';
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = msg + '. Check site permissions or use https/localhost.'; }
      showToast('❌ ' + msg);
    });
}

/**
 * Stop camera stream and close modal.
 */
function closeCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  cameraStream = null;
  const modal = document.getElementById('camera-modal');
  modal.classList.remove('open');
  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) captureBtn.disabled = true;
}

/**
 * Capture current camera frame as image.
 */
function capturePhoto() {
  const video  = document.getElementById('camera-video');
  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  document.getElementById('preview-img').src        = dataUrl;
  document.getElementById('preview-wrapper').style.display = 'block';
  document.getElementById('img-filename').textContent = 'camera-capture.png';
  document.getElementById('img-filesize').textContent = (dataUrl.length * 0.75 / 1024).toFixed(1) + ' KB';
  window._currentImageData = dataUrl;

  // show retake button
  const retake = document.getElementById('retake-btn');
  if (retake) retake.style.display = 'inline-block';

  closeCamera();
  showToast('📷 Photo captured!');
}

/**
 * Try to start camera again (used by Retry button)
 */
function tryCameraAgain() {
  // Re-open camera modal and attempt to get stream again
  openCamera();
}

// ===================== PREDICTION =====================
const ALL_BREED_KEYS = Object.keys(BREEDS);

/**
 * Call real AI prediction API.
 */
async function runPrediction() {
  const btn     = document.getElementById('predict-btn');
  const spinner = document.getElementById('predict-spinner');
  const label   = document.getElementById('predict-label');
  const fileInput = document.getElementById('file-input');
  
  // Use either file input or captured data
  let fileToUpload = fileInput.files[0];
  
  if (!fileToUpload && window._currentImageData) {
    // Convert dataURL to Blob
    const response = await fetch(window._currentImageData);
    fileToUpload = await response.blob();
  }

  if (!fileToUpload) {
    showToast('❌ Please select or capture an image first.');
    return;
  }

  btn.disabled         = true;
  spinner.style.display = 'inline-block';
  label.textContent    = 'Analyzing...';

  const formData = new FormData();
  formData.append('file', fileToUpload, 'upload.jpg');

  try {
    const response = await fetch(BACKEND_BASE + '/predict', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    
    showResults(data.breed_info, data.top3, data.confidence, `${data.prediction_time_seconds}s`);
    
    // Refresh history and dashboard from server
    await syncWithBackend();
    
    showToast('✅ Breed identified: ' + data.breed_name);
  } catch (error) {
    console.error('Prediction error:', error);
    showToast('❌ Prediction failed. Check backend connection.');
  } finally {
    btn.disabled          = false;
    spinner.style.display = 'none';
    label.textContent     = '🔬 Predict Breed';
  }
}

async function syncWithBackend() {
    try {
        const [historyRes, dashboardRes] = await Promise.all([
          fetch(BACKEND_BASE + '/history'),
          fetch(BACKEND_BASE + '/dashboard')
        ]);
        
        if (historyRes.ok) {
            const historyData = await historyRes.json();
            predHistory = historyData.map(h => ({
              id: h.prediction_id,
              breed: h.breed_name,
              conf: h.confidence,
              predTime: h.timestamp, // reusing timestamp as placeholder for predTime in UI
              date: new Date(h.timestamp).toLocaleString(),
              img: h.image_url ? (h.image_url.startsWith('/') ? (BACKEND_BASE + h.image_url) : h.image_url) : null
            }));
            renderHistory();
        }
        
        if (dashboardRes.ok) {
            const dashboardData = await dashboardRes.json();
            updateDashboardWithData(dashboardData);
        }
    } catch (e) {
        console.warn('Sync failed:', e);
    }
}

function updateDashboardWithData(data) {
    document.getElementById('total-processed').textContent = data.total_processed;
    document.getElementById('most-detected').textContent = data.most_detected || '—';
    
    // Update accuracy and time if elements exist
    const accEl = document.querySelector('.dash-card:nth-child(3) .dash-value');
    if (accEl) accEl.textContent = data.model_accuracy + '%';
    
    const timeEl = document.querySelector('.dash-card:nth-child(4) .dash-value');
    if (timeEl) timeEl.textContent = data.avg_pred_time + 's';

    // Rebuild pie chart
    if (pieChart) pieChart.destroy();

    const labels = Object.keys(data.breed_distribution);
    const values = Object.values(data.breed_distribution);
    const isDark  = document.documentElement.getAttribute('data-theme') === 'dark';

    pieChart = new Chart(document.getElementById('pie-chart'), {
        type: 'doughnut',
        data: {
            labels:   labels.length ? labels   : ['No data yet'],
            datasets: [{
                data:            values.length ? values   : [1],
                backgroundColor: labels.length ? CHART_COLORS.slice(0, labels.length) : ['#e0e0e0'],
                borderWidth:     2,
                borderColor:     isDark ? '#0a140b' : '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font:  { family: 'Plus Jakarta Sans', size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text')
                    }
                }
            }
        }
    });
}

/**
 * Populate the results section with prediction data.
 */
function showResults(breed, top3, conf, predTime) {
  const sec = document.getElementById('results');
  sec.style.display = 'block';

  document.getElementById('result-breed').textContent = breed.name;
  document.getElementById('result-conf').textContent  = conf + '%';

  // Animate progress bar
  setTimeout(() => {
    document.getElementById('conf-bar').style.width = conf + '%';
  }, 100);

  // Top 3 bars
  document.getElementById('top3-container').innerHTML = top3.map(b => `
    <div class="breed-bar-item">
      <div class="breed-bar-name">
        <span>${b.name}</span>
        <span>${b.conf.toFixed(1)}%</span>
      </div>
      <div class="breed-bar-track">
        <div class="breed-bar-fill" style="width:${b.conf}%"></div>
      </div>
    </div>
  `).join('');

  document.getElementById('pred-time-val').textContent = predTime;

  // Breed info panel
  document.getElementById('info-origin').textContent   = breed.origin;
  document.getElementById('info-type').textContent     = breed.type;
  document.getElementById('info-milk').textContent     = breed.milk;
  document.getElementById('info-climate').textContent  = breed.climate;
  document.getElementById('info-traits').textContent   = breed.traits;
  document.getElementById('info-diseases').textContent = breed.diseases;
  document.getElementById('info-feed').textContent     = breed.feed;

  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================== COMPARISON =====================
/**
 * Build and render the breed comparison table.
 */
function updateComparison() {
  const keyA = document.getElementById('compare-a').value;
  const keyB = document.getElementById('compare-b').value;
  const a    = BREEDS[keyA];
  const b    = BREEDS[keyB];

  document.getElementById('th-a').textContent = a.name;
  document.getElementById('th-b').textContent = b.name;

  document.getElementById('compare-body').innerHTML = COMPARE_FIELDS.map(([label, key]) => `
    <tr>
      <td>${label}</td>
      <td>${a[key]}</td>
      <td>${b[key]}</td>
    </tr>
  `).join('');
}

// ===================== PREDICTION HISTORY =====================
/**
 * Save a new prediction entry to localStorage.
 */
function addHistory(breed, conf, predTime) {
  const entry = {
    id:       Date.now(),
    breed,
    conf,
    predTime,
    date:     new Date().toLocaleString(),
    img:      window._currentImageData || null
  };
  predHistory.unshift(entry);
  if (predHistory.length > 50) predHistory.pop();
  localStorage.setItem('cattleHistory', JSON.stringify(predHistory));
  renderHistory();
  updateDashboard();
}

/**
 * Render history items in the DOM.
 */
function renderHistory() {
  const list = document.getElementById('history-list');
  if (predHistory.length === 0) {
    list.innerHTML = `
      <div class="history-empty">
        <span class="empty-icon">🔍</span>
        <span>No predictions yet. Upload an image to get started!</span>
      </div>`;
    return;
  }
  list.innerHTML = predHistory.map(e => `
    <div class="history-item">
      ${e.img
        ? `<img src="${e.img}" class="history-thumb" alt="${e.breed}" />`
        : `<div class="history-thumb-placeholder">🐄</div>`}
      <div class="history-info">
        <div class="history-breed">${e.breed}</div>
        <div class="history-meta">📅 ${e.date} &nbsp;·&nbsp; ⏱️ ${e.predTime}</div>
      </div>
      <div class="history-conf">${e.conf.toFixed(1)}%</div>
    </div>
  `).join('');
}

/**
 * Clear all stored history.
 */
function clearHistory() {
  predHistory = [];
  localStorage.removeItem('cattleHistory');
  renderHistory();
  updateDashboard();
  showToast('🗑️ History cleared');
}

/**
 * Placeholder: connect to backend to generate a PDF report.
 */
function downloadReport() {
  showToast('⬇️ Report download triggered (connect to backend)');
}

// ===================== DASHBOARD =====================
const CHART_COLORS = ['#1a7a35','#2eb85c','#42d472','#0d5c28','#5de68a','#0a4020','#7fffa0'];

/**
 * Refresh dashboard stats and pie chart.
 */
function updateDashboard() {
  const total = predHistory.length;
  document.getElementById('total-processed').textContent = total;

  // Count breeds
  const breedCount = {};
  predHistory.forEach(e => {
    breedCount[e.breed] = (breedCount[e.breed] || 0) + 1;
  });
  const topEntry = Object.entries(breedCount).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('most-detected').textContent = topEntry ? topEntry[0] : '—';

  // Rebuild pie chart
  if (pieChart) pieChart.destroy();

  const labels = Object.keys(breedCount);
  const values = Object.values(breedCount);
  const isDark  = document.documentElement.getAttribute('data-theme') === 'dark';

  pieChart = new Chart(document.getElementById('pie-chart'), {
    type: 'doughnut',
    data: {
      labels:   labels.length ? labels   : ['No data yet'],
      datasets: [{
        data:            values.length ? values   : [1],
        backgroundColor: labels.length ? CHART_COLORS.slice(0, labels.length) : ['#e0e0e0'],
        borderWidth:     2,
        borderColor:     isDark ? '#0a140b' : '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font:  { family: 'Plus Jakarta Sans', size: 11 },
            color: getComputedStyle(document.documentElement).getPropertyValue('--text')
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.raw} prediction${ctx.raw !== 1 ? 's' : ''}`
          }
        }
      }
    }
  });
}

// ===================== ANIMATED COUNTERS =====================
/**
 * Animate all .counter elements from 0 to their data-target.
 */
function animateCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix || '';
    const duration = 1800;
    const start    = Date.now();

    const timer = setInterval(() => {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const val      = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
      if (progress >= 1) clearInterval(timer);
    }, 16);
  });
}

// ===================== SCROLL ANIMATIONS =====================
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

// Trigger counters when hero enters view
const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounters();
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

heroObserver.observe(document.getElementById('hero'));

// ===================== TOAST =====================
/**
 * Show a brief notification toast.
 * @param {string} msg
 */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===================== INITIALISE =====================
updateComparison();
renderHistory();
updateDashboard();