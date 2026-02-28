/* ========================================
   MANUAL POST PAGE LOGIC
======================================== */

// Initialize post page
document.addEventListener('DOMContentLoaded', () => {
    loadPostData();
    loadComments();
    loadRelatedPosts();
    setupBookmarkButton();
});

// Load post data into page
function loadPostData() {
    if (typeof POST_DATA === 'undefined') {
        console.error('POST_DATA not defined');
        return;
    }

    // Update page elements
    document.getElementById('post-banner-img').src = POST_DATA.banner;
    document.getElementById('post-category-badge').textContent = POST_DATA.category;
    document.getElementById('post-year-badge').textContent = POST_DATA.year;
    document.getElementById('post-rating-badge').textContent = '⭐ ' + POST_DATA.rating;
    document.getElementById('post-title-display').textContent = POST_DATA.title;
    document.getElementById('post-date-display').textContent = new Date(POST_DATA.metadata.created).toLocaleDateString();
    document.getElementById('post-author-display').textContent = POST_DATA.metadata.author;

    // Tags
    const tagsContainer = document.getElementById('post-tags-display');
    tagsContainer.innerHTML = POST_DATA.tags.map(tag => 
        `<span class="tag">#${tag}</span>`
    ).join('');

    // Update page title
    document.title = POST_DATA.title + ' - GitHub CMS';

    // Save to recent posts
    saveToRecentPosts();
}

// Setup bookmark button
function setupBookmarkButton() {
    const btn = document.getElementById('bookmark-btn-top');
    
    if (!UserAuth.currentUser) {
        btn.onclick = () => {
            alert('Please login to bookmark posts');
            window.location.href = '../auth.html';
        };
        return;
    }

    // Check if already bookmarked
    updateBookmarkButton();

    btn.onclick = () => {
        const isBookmarked = UserAuth.toggleBookmark(POST_DATA);
        updateBookmarkButton();
        
        if (isBookmarked) {
            showToast('✅ Added to bookmarks');
        } else {
            showToast('❌ Removed from bookmarks');
        }
    };
}

function updateBookmarkButton() {
    const btn = document.getElementById('bookmark-btn-top');
    const isBookmarked = UserAuth.isBookmarked(POST_DATA.id);
    
    if (isBookmarked) {
        btn.classList.add('bookmarked');
        btn.querySelector('.bookmark-text').textContent = 'Bookmarked';
    } else {
        btn.classList.remove('bookmarked');
        btn.querySelector('.bookmark-text').textContent = 'Bookmark';
    }
}

// Load comments
async function loadComments() {
    if (typeof GoogleSheetsAPI === 'undefined') return;

    try {
        const comments = await GoogleSheetsAPI.getComments(POST_DATA.id);
        
        document.getElementById('comments-count').textContent = comments.length;
        
        const commentsList = document.getElementById('comments-list');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No comments yet. Be the first to comment!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-avatar">
                        ${comment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div class="comment-user">
                        <div class="comment-user-name">
                            ${comment.userName}
                            ${comment.userMembership !== 'free' ? `
                                <span class="comment-badge badge-${comment.userMembership}">
                                    ${comment.userMembership.toUpperCase()}
                                </span>
                            ` : ''}
                        </div>
                        <div class="comment-time">${new Date(comment.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load comments:', error);
    }
}

// Submit comment
async function submitComment() {
    if (!UserAuth.currentUser) {
        alert('Please login to comment');
        window.location.href = '../auth.html';
        return;
    }

    const input = document.getElementById('comment-input');
    const text = input.value.trim();

    if (!text) {
        alert('Please write a comment');
        return;
    }

    try {
        await GoogleSheetsAPI.addComment({
            postId: POST_DATA.id,
            userId: UserAuth.currentUser.userId,
            userName: UserAuth.currentUser.fullName,
            userMembership: UserAuth.currentUser.membership,
            text: text
        });

        input.value = '';
        loadComments();
        showToast('✅ Comment posted!');

    } catch (error) {
        console.error('Failed to post comment:', error);
        alert('Failed to post comment. Please try again.');
    }
}

// Load related posts
async function loadRelatedPosts() {
    try {
        // Get all posts from localStorage or API
        const recentPosts = JSON.parse(localStorage.getItem('recent_posts') || '[]');
        
        const related = recentPosts
            .filter(p => p.id !== POST_DATA.id && p.category === POST_DATA.category)
            .slice(0, 3);

        const grid = document.getElementById('related-posts-grid');
        
        if (related.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No related posts found.</p>';
            return;
        }

        grid.innerHTML = related.map(post => `
            <div class="post-card" onclick="window.location='${post.slug}.html'">
                <div class="post-card-image">
                    <img src="${post.thumbnail}" alt="${post.title}">
                    <div class="post-card-overlay">
                        <span class="category">${post.category}</span>
                        <span class="rating">⭐ ${post.rating}</span>
                    </div>
                </div>
                <div class="post-card-content">
                    <h3 class="post-card-title">${post.title}</h3>
                    <div class="post-card-meta">
                        <span>${post.year}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load related posts:', error);
    }
}

// Save to recent posts (for related posts feature)
function saveToRecentPosts() {
    let recentPosts = JSON.parse(localStorage.getItem('recent_posts') || '[]');
    
    // Remove if already exists
    recentPosts = recentPosts.filter(p => p.id !== POST_DATA.id);
    
    // Add to beginning
    recentPosts.unshift(POST_DATA);
    
    // Keep only last 20
    recentPosts = recentPosts.slice(0, 20);
    
    localStorage.setItem('recent_posts', JSON.stringify(recentPosts));
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
