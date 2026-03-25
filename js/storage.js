// ==================== التخزين المحلي ====================

async function saveFilesToDB(files) {
    const tx = db.transaction(['files'], 'readwrite');
    const store = tx.objectStore('files');
    for (const file of files) store.put(file);
}

async function loadFilesFromDB() {
    return new Promise((resolve) => {
        const tx = db.transaction(['files'], 'readonly');
        const store = tx.objectStore('files');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
    });
}

async function saveBookmarkToDB(bookmark) {
    const tx = db.transaction(['bookmarks'], 'readwrite');
    const store = tx.objectStore('bookmarks');
    store.put(bookmark);
}

async function deleteBookmarkFromDB(path) {
    const tx = db.transaction(['bookmarks'], 'readwrite');
    const store = tx.objectStore('bookmarks');
    store.delete(path);
}

async function loadBookmarksFromDB() {
    return new Promise((resolve) => {
        const tx = db.transaction(['bookmarks'], 'readonly');
        const store = tx.objectStore('bookmarks');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
    });
}

async function toggleBookmark(path) {
    const existing = bookmarks.find(b => b.path === path);
    if (existing) {
        await deleteBookmarkFromDB(path);
        bookmarks = bookmarks.filter(b => b.path !== path);
        showToast('🗑️ تم الحذف من المفضلة', 'info');
    } else {
        const file = allFiles.find(f => f.path === path);
        if (file) {
            const bookmark = { ...file, addedAt: new Date().toISOString() };
            await saveBookmarkToDB(bookmark);
            bookmarks.push(bookmark);
            showToast('⭐ تم الإضافة إلى المفضلة', 'success');
        }
    }
    displayBookmarks();
    displayResults();
}

function displayBookmarks() {
    const container = document.getElementById('bookmarksList');
    if (bookmarks.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-star"></i><p>لا توجد ملفات في المفضلة</p><small>اضغط على نجمة بجانب أي نتيجة لإضافتها</small></div>`;
        return;
    }
    
    container.innerHTML = '';
    bookmarks.forEach(bookmark => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.onclick = () => showToast(`📄 ${bookmark.name}`, 'info');
        div.innerHTML = `
            <div class="file-icon"><i class="fas fa-bookmark"></i></div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(bookmark.name)}</div>
                <div class="file-path">${escapeHtml(bookmark.path)}</div>
                <small style="font-size: 9px; color: var(--gray);">${new Date(bookmark.addedAt).toLocaleDateString('ar')}</small>
            </div>
            <button class="bookmark-btn active" onclick="event.stopPropagation(); toggleBookmark('${escapeHtml(bookmark.path)}')">
                <i class="fas fa-bookmark"></i>
            </button>
        `;
        container.appendChild(div);
    });
}
