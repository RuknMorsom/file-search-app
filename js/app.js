// ==================== التطبيق الرئيسي ====================

let allFiles = [];
let currentResults = [];
let bookmarks = [];
let currentImageFile = null;
let currentPdfImageFile = null;
let isSearching = false;
let db = null;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupEventListeners();
    setupTabs();
    setupImageUpload();
    loadSavedData();
});

// تهيئة قاعدة البيانات
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FileSearchApp', 3);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('bookmarks')) {
                db.createObjectStore('bookmarks', { keyPath: 'path' });
            }
        };
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    document.getElementById('selectRootBtn').onclick = () => selectFolder('root');
    document.getElementById('selectDownloadBtn').onclick = () => selectFolder('download');
    document.getElementById('selectPicturesBtn').onclick = () => selectFolder('pictures');
    document.getElementById('selectDocumentsBtn').onclick = () => selectFolder('documents');
    document.getElementById('clearFolderBtn').onclick = clearAllFiles;
    document.getElementById('searchImageBtn').onclick = () => searchByImage(currentImageFile);
    document.getElementById('searchPdfImageBtn').onclick = () => searchPdfByImage(currentPdfImageFile);
    document.getElementById('searchTextBtn').onclick = () => {
        const query = document.getElementById('textQuery').value;
        if (query.trim()) searchByText(query);
        else showToast('الرجاء إدخال النص المطلوب', 'warning');
    };
}

// إعداد التبويبات
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        };
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById('imageTab').style.display = tabId === 'image' ? 'block' : 'none';
    document.getElementById('pdfImageTab').style.display = tabId === 'pdf-image' ? 'block' : 'none';
    document.getElementById('textTab').style.display = tabId === 'text' ? 'block' : 'none';
}

// إعداد رفع الصور
function setupImageUpload() {
    const imageUpload = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageFileInput');
    imageUpload.onclick = () => imageInput.click();
    imageInput.onchange = (e) => {
        if (e.target.files[0]) {
            currentImageFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('imagePreview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
                document.getElementById('searchImageBtn').disabled = false;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const pdfUpload = document.getElementById('pdfImageUploadArea');
    const pdfInput = document.getElementById('pdfImageFileInput');
    pdfUpload.onclick = () => pdfInput.click();
    pdfInput.onchange = (e) => {
        if (e.target.files[0]) {
            currentPdfImageFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('pdfImagePreview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
                document.getElementById('searchPdfImageBtn').disabled = false;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
}

// تحميل البيانات المحفوظة
async function loadSavedData() {
    allFiles = await loadFilesFromDB();
    bookmarks = await loadBookmarksFromDB();
    if (allFiles.length > 0) {
        updateStats();
        document.getElementById('folderInfo').style.display = 'flex';
        document.getElementById('folderName').textContent = 'الملفات المحفوظة';
        document.getElementById('folderPath').textContent = `من الجلسة السابقة`;
        document.getElementById('fileCount').textContent = `${allFiles.length} ملف`;
        showToast(`📁 تم استعادة ${allFiles.length} ملف`, 'info');
    }
    displayBookmarks();
}

// اختيار مجلد
async function selectFolder(type) {
    showToast('🔍 جاري مسح المجلد...', 'info');
    showProgress(true);
    
    setTimeout(() => {
        const mockFiles = generateMockFiles();
        allFiles = mockFiles;
        saveFilesToDB(allFiles);
        
        document.getElementById('folderInfo').style.display = 'flex';
        document.getElementById('folderName').textContent = getFolderName(type);
        document.getElementById('folderPath').textContent = getFolderPath(type);
        document.getElementById('fileCount').textContent = `${allFiles.length} ملف`;
        
        updateStats();
        showProgress(false);
        showToast(`✅ تم العثور على ${allFiles.length} ملف`, 'success');
    }, 2000);
}

function generateMockFiles() {
    const files = [];
    const extensions = ['jpg', 'png', 'pdf', 'txt'];
    const names = ['صورة', 'مستند', 'ملف', 'صفحة', 'بيان', 'تقرير'];
    for (let i = 0; i < 50; i++) {
        const ext = extensions[Math.floor(Math.random() * extensions.length)];
        files.push({
            id: Date.now() + i,
            name: `${names[Math.floor(Math.random() * names.length)]}_${i + 1}.${ext}`,
            path: `/storage/emulated/0/${ext === 'jpg' ? 'DCIM' : 'Documents'}/file_${i + 1}.${ext}`,
            size: Math.floor(Math.random() * 5000000),
            extension: ext,
            addedAt: new Date().toISOString()
        });
    }
    return files;
}

function getFolderName(type) {
    const names = { root: 'التخزين الداخلي', download: 'مجلد التنزيلات', pictures: 'مجلد الصور', documents: 'مجلد المستندات' };
    return names[type] || 'المجلد المختار';
}

function getFolderPath(type) {
    const paths = { root: '/storage/emulated/0', download: '/storage/emulated/0/Download', pictures: '/storage/emulated/0/DCIM', documents: '/storage/emulated/0/Documents' };
    return paths[type] || '/storage/emulated/0';
}

async function clearAllFiles() {
    if (confirm('هل تريد مسح جميع الملفات المحفوظة؟')) {
        const tx = db.transaction(['files'], 'readwrite');
        tx.objectStore('files').clear();
        allFiles = [];
        document.getElementById('folderInfo').style.display = 'none';
        document.getElementById('statsGrid').style.display = 'none';
        showToast('🗑️ تم مسح جميع الملفات', 'success');
    }
}

function updateStats() {
    const images = allFiles.filter(f => ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(f.extension)).length;
    const pdfs = allFiles.filter(f => f.extension === 'pdf').length;
    const texts = allFiles.filter(f => ['txt', 'html', 'xml'].includes(f.extension)).length;
    document.getElementById('statFiles').textContent = allFiles.length;
    document.getElementById('statImages').textContent = images;
    document.getElementById('statPdfs').textContent = pdfs;
    document.getElementById('statTexts').textContent = texts;
    document.getElementById('statsGrid').style.display = 'grid';
}

function showProgress(show) {
    const container = document.getElementById('progressContainer');
    container.style.display = show ? 'block' : 'none';
    if (!show) document.getElementById('progressFill').style.width = '0%';
}

function updateProgress(current, total, fileName = '') {
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const percent = (current / total) * 100;
    fill.style.width = `${percent}%`;
    text.textContent = `معالجة: ${current}/${total} - ${fileName}`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#1f2937';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
              }
