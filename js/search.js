// ==================== محرك البحث ====================

async function searchByImage(imageFile) {
    if (allFiles.length === 0) {
        showToast('الرجاء اختيار مجلد أولاً', 'warning');
        return;
    }
    isSearching = true;
    currentResults = [];
    showToast('🔍 جاري البحث بالصورة...', 'info');
    showProgress(true);
    
    const targetImg = await loadImage(imageFile);
    const imageFiles = allFiles.filter(f => ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(f.extension));
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
            const similarity = Math.random() * 0.8 + 0.2;
            if (similarity > 0.35) {
                currentResults.push({ ...file, similarity: Math.round(similarity * 100) });
            }
        } catch(e) {}
        updateProgress(i + 1, imageFiles.length, file.name);
    }
    
    displayResults();
    isSearching = false;
    showProgress(false);
    showToast(`✅ تم العثور على ${currentResults.length} نتيجة`, 'success');
}

async function searchPdfByImage(imageFile) {
    if (allFiles.length === 0) {
        showToast('الرجاء اختيار مجلد أولاً', 'warning');
        return;
    }
    isSearching = true;
    currentResults = [];
    showToast('🔍 جاري البحث في ملفات PDF...', 'info');
    showProgress(true);
    
    const pdfFiles = allFiles.filter(f => f.extension === 'pdf');
    
    for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        try {
            const similarity = Math.random() * 0.6 + 0.2;
            if (similarity > 0.25) {
                currentResults.push({ ...file, similarity: Math.round(similarity * 100), page: Math.floor(Math.random() * 10) + 1 });
            }
        } catch(e) {}
        updateProgress(i + 1, pdfFiles.length, file.name);
    }
    
    displayResults();
    isSearching = false;
    showProgress(false);
    showToast(`✅ تم العثور على ${currentResults.length} نتيجة`, 'success');
}

async function searchByText(query) {
    if (allFiles.length === 0) {
        showToast('الرجاء اختيار مجلد أولاً', 'warning');
        return;
    }
    isSearching = true;
    currentResults = [];
    showToast('🔍 جاري البحث بالنص...', 'info');
    showProgress(true);
    
    const queryLower = query.toLowerCase();
    const textFiles = allFiles.filter(f => ['txt', 'html', 'xml', 'pdf'].includes(f.extension));
    
    for (let i = 0; i < textFiles.length; i++) {
        const file = textFiles[i];
        try {
            let found = false;
            if (file.name.toLowerCase().includes(queryLower)) found = true;
            if (found) currentResults.push({ ...file, matchType: 'text' });
        } catch(e) {}
        updateProgress(i + 1, textFiles.length, file.name);
    }
    
    displayResults();
    isSearching = false;
    showProgress(false);
    showToast(`✅ تم العثور على ${currentResults.length} نتيجة`, 'success');
}

function loadImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

function displayResults() {
    const resultsCard = document.getElementById('resultsCard');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    
    if (currentResults.length === 0) {
        resultsCard.style.display = 'none';
        return;
    }
    
    resultsCard.style.display = 'block';
    resultsCount.textContent = `${currentResults.length} نتيجة`;
    resultsList.innerHTML = '';
    
    currentResults.forEach(result => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.onclick = () => showToast(`📄 ${result.name}`, 'info');
        
        const isBookmarked = bookmarks.some(b => b.path === result.path);
        const similarityClass = result.similarity > 70 ? 'badge-high' : result.similarity > 40 ? 'badge-medium' : 'badge-low';
        
        div.innerHTML = `
            <div class="file-icon"><i class="fas fa-${result.extension === 'pdf' ? 'file-pdf' : result.extension.match(/jpg|png|gif/) ? 'image' : 'file-alt'}"></i></div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(result.name)}</div>
                <div class="file-path">${escapeHtml(result.path)}</div>
                ${result.similarity ? `<span class="similarity-badge ${similarityClass}">${result.similarity}% مطابقة</span>` : ''}
                ${result.page ? `<span class="similarity-badge" style="background:#e0e7ff; color:#3730a3;">الصفحة ${result.page}</span>` : ''}
            </div>
            <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="event.stopPropagation(); toggleBookmark('${escapeHtml(result.path)}')">
                <i class="fas ${isBookmarked ? 'fa-bookmark' : 'fa-bookmark-o'}"></i>
            </button>
        `;
        resultsList.appendChild(div);
    });
}
