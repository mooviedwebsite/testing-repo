/* ========================================
   ADMIN PANEL APPLICATION LOGIC
   Complete admin functionality
======================================== */

// State
let isAuthenticated = false;
let currentPosts = [];
let currentEditingPost = null;

// Initialize Admin Panel
function initAdmin() {
    // Check if already authenticated
    const savedToken = localStorage.getItem('github_token');
    const savedRepo = localStorage.getItem('github_repo');
    
    if (savedToken && savedRepo) {
        login(savedToken, savedRepo);
    } else {
        showAuthScreen();
    }
}

// Show auth screen
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

// Show admin panel
function showAdminPanel() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
}

// Login
async function login(token, repo) {
    try {
        // Initialize GitHub API
        GitHubAPI.init(token, repo);
        
        // Test connection
        await GitHubAPI.getConfig();
        
        // Save credentials
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_repo', repo);
        
        isAuthenticated = true;
        showAdminPanel();
        
        // Load dashboard
        loadDashboard();
        
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your token and repository name.');
        logout();
    }
}

// Logout
function logout() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_repo');
    isAuthenticated = false;
    showAuthScreen();
}

// Load Dashboard
async function loadDashboard() {
    try {
        const posts = await GitHubAPI.getPosts();
        currentPosts = posts;
        
        // Update stats
        document.getElementById('total-posts').textContent = posts.length;
        
        const avgRating = posts.length > 0 
            ? (posts.reduce((sum, p) => sum + p.rating, 0) / posts.length).toFixed(1)
            : 0;
        document.getElementById('avg-rating').textContent = avgRating;
        
        // Update activity
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = posts.slice(0, 5).map(post => `
            <div class="activity-item">
                📝 Post "${post.title}" - ${new Date(post.metadata.updated).toLocaleDateString()}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Load Posts Page
async function loadPostsPage() {
    try {
        const posts = await GitHubAPI.getPosts();
        currentPosts = posts;
        
        const postsList = document.getElementById('posts-list');
        
        if (posts.length === 0) {
            postsList.innerHTML = `
                <div style="padding: 3rem; text-align: center; color: var(--admin-text-muted);">
                    <p>No posts yet. Create your first post!</p>
                </div>
            `;
            return;
        }
        
        postsList.innerHTML = `
            <div class="table-row table-header">
                <div>ID</div>
                <div>Title</div>
                <div>Category</div>
                <div>Status</div>
                <div>Actions</div>
            </div>
            ${posts.map(post => `
                <div class="table-row">
                    <div class="table-cell">${post.id.substring(0, 8)}...</div>
                    <div class="table-cell"><strong>${post.title}</strong></div>
                    <div class="table-cell">${post.category}</div>
                    <div class="table-cell">
                        <span style="color: ${post.metadata.published ? 'var(--admin-success)' : 'var(--admin-warning)'}">
                            ${post.metadata.published ? '✓ Published' : '○ Draft'}
                        </span>
                    </div>
                    <div class="table-cell table-actions">
                        <button class="btn-secondary btn-sm" onclick="editPost('${post.id}')">Edit</button>
                        <button class="btn-danger btn-sm" onclick="deletePost('${post.id}')">Delete</button>
                    </div>
                </div>
            `).join('')}
        `;
        
    } catch (error) {
        console.error('Failed to load posts:', error);
    }
}

// Open Post Editor (Create)
function openPostEditor() {
    currentEditingPost = null;
    
    document.getElementById('editor-title').textContent = 'Create New Post';
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = 'Action';
    document.getElementById('post-year').value = new Date().getFullYear();
    document.getElementById('post-rating').value = '7.5';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-thumbnail').value = '';
    document.getElementById('post-banner').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-published').checked = true;
    
    showModal('post-editor-modal');
    updatePreview();
}

// Edit Post
async function editPost(postId) {
    try {
        const post = await GitHubAPI.getPost(postId);
        currentEditingPost = post;
        
        document.getElementById('editor-title').textContent = 'Edit Post';
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-year').value = post.year;
        document.getElementById('post-rating').value = post.rating;
        document.getElementById('post-tags').value = post.tags.join(', ');
        document.getElementById('post-thumbnail').value = post.thumbnail;
        document.getElementById('post-banner').value = post.banner || '';
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-published').checked = post.metadata.published;
        
        showModal('post-editor-modal');
        updatePreview();
        
    } catch (error) {
        console.error('Failed to load post for editing:', error);
        alert('Failed to load post');
    }
}

// Save Post
async function savePost() {
    try {
        const postData = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            year: parseInt(document.getElementById('post-year').value),
            rating: parseFloat(document.getElementById('post-rating').value),
            tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
            thumbnail: document.getElementById('post-thumbnail').value,
            banner: document.getElementById('post-banner').value,
            content: document.getElementById('post-content').value,
            metadata: {
                published: document.getElementById('post-published').checked
            }
        };
        
        // Validate
        if (!postData.title || !postData.thumbnail || !postData.content) {
            alert('Please fill in all required fields (Title, Thumbnail, Content)');
            return;
        }
        
        // Show loading
        const saveBtn = document.getElementById('save-post-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        // Save or update
        if (currentEditingPost) {
            await GitHubAPI.updatePost(currentEditingPost.id, {
                ...currentEditingPost,
                ...postData
            });
        } else {
            await GitHubAPI.createPost(postData);
        }
        
        // Success
        alert('Post saved successfully!');
        hideModal('post-editor-modal');
        loadPostsPage();
        
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        
    } catch (error) {
        console.error('Failed to save post:', error);
        alert('Failed to save post. Please try again.');
        
        const saveBtn = document.getElementById('save-post-btn');
        saveBtn.textContent = 'Save Post';
        saveBtn.disabled = false;
    }
}

// Delete Post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        await GitHubAPI.deletePost(postId);
        alert('Post deleted successfully!');
        loadPostsPage();
    } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post');
    }
}

// Update Preview
function updatePreview() {
    const content = document.getElementById('post-content').value;
    document.getElementById('content-preview').innerHTML = content;
}

// Insert HTML helper for editor
function insertHTML(openTag, closeTag) {
    const textarea = document.getElementById('post-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || 'text';
    
    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
    textarea.value = newText;
    
    // Update cursor position
    textarea.selectionStart = start + openTag.length;
    textarea.selectionEnd = start + openTag.length + selectedText.length;
    textarea.focus();
    
    updatePreview();
}

// Load Media Page
async function loadMediaPage() {
    try {
        const files = await GitHubAPI.getMediaFiles();
        const mediaGrid = document.getElementById('media-grid');
        
        if (files.length === 0) {
            mediaGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--admin-text-muted);">
                    <p>No media files yet. Upload your first image!</p>
                </div>
            `;
            return;
        }
        
        mediaGrid.innerHTML = files.map(file => `
            <div class="media-item">
                <img src="${file.url}" alt="${file.name}">
                <div class="media-overlay">
                    <button class="btn-secondary btn-sm" onclick="copyToClipboard('${file.url}')">Copy URL</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load media:', error);
    }
}

// Upload Media
async function uploadMedia(files) {
    try {
        const uploadBtn = document.getElementById('upload-media-btn');
        uploadBtn.textContent = 'Uploading...';
        uploadBtn.disabled = true;
        
        for (const file of files) {
            const fileName = Date.now() + '-' + file.name;
            await GitHubAPI.uploadMedia(file, fileName);
        }
        
        alert('Media uploaded successfully!');
        loadMediaPage();
        
        uploadBtn.textContent = '+ Upload Media';
        uploadBtn.disabled = false;
        
    } catch (error) {
        console.error('Failed to upload media:', error);
        alert('Failed to upload media');
        
        const uploadBtn = document.getElementById('upload-media-btn');
        uploadBtn.textContent = '+ Upload Media';
        uploadBtn.disabled = false;
    }
}

// Load Settings Page
async function loadSettingsPage() {
    try {
        const config = await GitHubAPI.getConfig();
        
        document.getElementById('site-name').value = config.site.name;
        document.getElementById('site-tagline').value = config.site.tagline;
        document.getElementById('site-theme').value = config.site.theme;
        
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save Settings
async function saveSettings() {
    try {
        const config = await GitHubAPI.getConfig();
        
        config.site.name = document.getElementById('site-name').value;
        config.site.tagline = document.getElementById('site-tagline').value;
        config.site.theme = document.getElementById('site-theme').value;
        
        await GitHubAPI.updateConfig(config);
        
        alert('Settings saved successfully!');
        
    } catch (error) {
        console.error('Failed to save settings:', error);
        alert('Failed to save settings');
    }
}

// Navigation
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        posts: 'Posts',
        pages: 'Pages',
        media: 'Media',
        settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[page];
    
    // Load page data
    if (page === 'posts') loadPostsPage();
    if (page === 'media') loadMediaPage();
    if (page === 'settings') loadSettingsPage();
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('URL copied to clipboard!');
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    initAdmin();
    
    // Login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const token = document.getElementById('token-input').value;
            const repo = document.getElementById('repo-input').value;
            
            if (!token || !repo) {
                alert('Please enter both token and repository');
                return;
            }
            
            login(token, repo);
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    // Create post
    const createPostBtn = document.getElementById('create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', openPostEditor);
    }
    
    // Save post
    const savePostBtn = document.getElementById('save-post-btn');
    if (savePostBtn) {
        savePostBtn.addEventListener('click', savePost);
    }
    
    // Content preview
    const contentInput = document.getElementById('post-content');
    if (contentInput) {
        contentInput.addEventListener('input', updatePreview);
    }
    
    // Modal close
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(btn.closest('.modal').id);
        });
    });
    
    // Upload media
    const uploadMediaBtn = document.getElementById('upload-media-btn');
    const mediaUploadInput = document.getElementById('media-upload-input');
    
    if (uploadMediaBtn && mediaUploadInput) {
        uploadMediaBtn.addEventListener('click', () => {
            mediaUploadInput.click();
        });
        
        mediaUploadInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                uploadMedia(files);
            }
        });
    }
    
    // Save settings
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Sync button
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            syncBtn.textContent = '⏳';
            await loadDashboard();
            setTimeout(() => {
                syncBtn.textContent = '🔄';
            }, 1000);
        });
    }
});
