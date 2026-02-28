/* ========================================
   PUBLIC SITE APPLICATION LOGIC
   Loads posts from registry + GitHub
======================================== */

// State
let allPosts = [];
let filteredPosts = [];
let displayedPosts = [];
let currentPage = 1;
const postsPerPage = 12;
let currentFilter = 'all';

// Initialize
async function init() {
    showLoading();
    
    try {
        // Load posts from registry
        allPosts = await loadPostsFromRegistry();
        
        if (allPosts.length === 0) {
            // Fallback: Try to load from GitHub
            try {
                allPosts = await GitHubAPI.getPosts();
            } catch (error) {
                console.log('No GitHub posts available');
            }
        }
        
        // If still no posts, show demo posts
        if (allPosts.length === 0) {
            allPosts = getDemoPosts();
        }
        
        filteredPosts = allPosts;
        displayPosts();
        hideLoading();
    } catch (error) {
        console.error('Failed to load posts:', error);
        hideLoading();
        showError();
    }
}

// Load posts from registry
async function loadPostsFromRegistry() {
    try {
        const response = await fetch('data/posts-registry.json');
        
        if (!response.ok) {
            throw new Error('Registry not found');
        }
        
        const data = await response.json();
        console.log('Loaded posts from registry:', data.posts.length);
        return data.posts || [];
    } catch (error) {
        console.error('Failed to load posts registry:', error);
        return [];
    }
}

// Demo posts (fallback)
function getDemoPosts() {
    return [
        {
            id: 'inception-2010',
            slug: 'inception-2010',
            title: 'Inception',
            thumbnail: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            banner: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
            category: 'Sci-Fi',
            year: 2010,
            rating: 8.8,
            tags: ['thriller', 'mind-bending', 'nolan'],
            file: 'posts/inception-2010',
            metadata: {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                author: 'admin',
                published: true
            }
        },
        {
            id: 'demo-getting-started',
            slug: 'getting-started',
            title: 'Getting Started with GitHub CMS',
            thumbnail: 'https://via.placeholder.com/400x600/6366f1/ffffff?text=Getting+Started',
            banner: 'https://via.placeholder.com/1200x600/6366f1/ffffff?text=Getting+Started',
            category: 'Tutorial',
            year: 2026,
            rating: 9.0,
            tags: ['tutorial', 'setup', 'beginner'],
            file: 'post.html?id=demo-getting-started',
            metadata: {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                author: 'admin',
                published: true
            }
        }
    ];
}

// Display posts
function displayPosts() {
    const postsGrid = document.getElementById('posts-grid');
    
    if (!postsGrid) {
        console.error('Posts grid not found');
        return;
    }
    
    // Calculate posts to display
    const startIndex = 0;
    const endIndex = currentPage * postsPerPage;
    displayedPosts = filteredPosts.slice(startIndex, endIndex);
    
    console.log('Displaying posts:', displayedPosts.length);
    
    // Render posts
    if (displayedPosts.length === 0) {
        postsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <h3>No posts found</h3>
                <p style="color: var(--text-secondary); margin: 1rem 0;">
                    ${currentFilter === 'all' ? 'No posts available yet.' : 'Try a different category.'}
                </p>
            </div>
        `;
    } else {
        postsGrid.innerHTML = displayedPosts.map(post => createPostCard(post)).join('');
    }
    
    // Update load more button
    updateLoadMoreButton();
}

// Create post card HTML
function createPostCard(post) {
    const isBookmarked = UserAuth.currentUser ? UserAuth.isBookmarked(post.id) : false;
    
    // Determine post link
    let postLink = post.file || `post.html?id=${post.id}&slug=${post.slug}`;
    
    // If file doesn't have protocol or starts with /, make it relative
    if (post.file && !post.file.startsWith('http') && !post.file.startsWith('/')) {
        postLink = post.file;
    }
    
    return `
        <div class="post-card">
            ${UserAuth.currentUser ? `
                <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                        onclick="handleBookmark(event, '${post.id}')"
                        title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                </button>
            ` : ''}
            
            <div class="post-card-image" onclick="window.location='${postLink}'">
                <img src="${post.thumbnail}" alt="${post.title}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/400x600/333/fff?text=No+Image'">
                <div class="post-card-overlay">
                    <span class="category">${post.category}</span>
                    <span class="rating">⭐ ${post.rating}</span>
                </div>
            </div>
            <div class="post-card-content" onclick="window.location='${postLink}'">
                <h3 class="post-card-title">${post.title}</h3>
                <div class="post-card-meta">
                    <span>${post.year}</span>
                    <span>${post.tags.slice(0, 2).map(t => '#' + t).join(' ')}</span>
                </div>
            </div>
        </div>
    `;
}

// Navigate to post
function navigateToPost(id, slug) {
    window.location.href = `post.html?id=${id}&slug=${slug}`;
}

// Filter posts
function filterPosts(category) {
    currentFilter = category;
    currentPage = 1;
    
    if (category === 'all') {
        filteredPosts = allPosts;
    } else {
        filteredPosts = allPosts.filter(post => post.category === category);
    }
    
    displayPosts();
    updateFilterButtons();
}

// Update filter buttons
function updateFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        btn.classList.toggle('active', filter === currentFilter);
    });
}

// Load more posts
function loadMore() {
    currentPage++;
    displayPosts();
}

// Update load more button
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more');
    const container = document.querySelector('.load-more-container');
    
    if (!loadMoreBtn || !container) return;
    
    const hasMore = displayedPosts.length < filteredPosts.length;
    container.style.display = hasMore ? 'block' : 'none';
}

// Handle bookmark button click
function handleBookmark(event, postId) {
    event.stopPropagation();
    
    if (!UserAuth.currentUser) {
        alert('Please login to bookmark posts');
        window.location.href = 'auth.html';
        return;
    }

    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const isBookmarked = UserAuth.toggleBookmark(post);
    
    const btn = event.target.closest('.bookmark-btn');
    if (isBookmarked) {
        btn.classList.add('bookmarked');
        btn.title = 'Remove bookmark';
        showToast('✅ Added to bookmarks');
    } else {
        btn.classList.remove('bookmarked');
        btn.title = 'Add bookmark';
        showToast('❌ Removed from bookmarks');
    }
}

// Toast notification
function showToast(message) {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
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

// Show/Hide loading
function showLoading() {
    const loading = document.getElementById('loading');
    const postsGrid = document.getElementById('posts-grid');
    if (loading) loading.style.display = 'flex';
    if (postsGrid) postsGrid.style.display = 'none';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    const postsGrid = document.getElementById('posts-grid');
    if (loading) loading.style.display = 'none';
    if (postsGrid) postsGrid.style.display = 'grid';
}

// Show error
function showError() {
    const postsGrid = document.getElementById('posts-grid');
    if (postsGrid) {
        postsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <h3>Failed to load posts</h3>
                <p style="color: var(--text-secondary); margin: 1rem 0;">
                    Please check your connection or try again later.
                </p>
                <button onclick="location.reload()" class="btn-primary">Retry</button>
            </div>
        `;
        postsGrid.style.display = 'grid';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing homepage...');
    
    // Initialize
    init();
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterPosts(filter);
        });
    });
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }
});

// Lazy loading images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                observer.unobserve(img);
            }
        });
    });

    const observeImages = () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    };

    setTimeout(observeImages, 100);
}
