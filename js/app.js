/* ========================================
   PUBLIC SITE APPLICATION LOGIC
   Handles homepage, filtering, loading
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
    
    // Try to load posts from demo data first, then from GitHub
    try {
        allPosts = await loadDemoPosts();
        
        // If no demo posts, try GitHub
        if (allPosts.length === 0) {
            allPosts = await GitHubAPI.getPosts();
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

// Load demo posts (fallback for initial setup)
async function loadDemoPosts() {
    // Check if we have demo data
    try {
        const response = await fetch('data/posts/demo-post-1.json');
        if (response.ok) {
            return await GitHubAPI.getPosts();
        }
    } catch (error) {
        // No demo data available
    }
    
    // Return sample posts for demonstration
    return [
        {
            id: 'demo-1',
            slug: 'getting-started',
            title: 'Getting Started with GitHub CMS',
            thumbnail: 'https://via.placeholder.com/400x225/6366f1/ffffff?text=Getting+Started',
            banner: 'https://via.placeholder.com/1200x600/6366f1/ffffff?text=Getting+Started',
            category: 'Tutorial',
            year: 2026,
            rating: 9.0,
            tags: ['tutorial', 'setup', 'beginner'],
            content: '<h2>Welcome to GitHub CMS!</h2><p>This is a demo post to help you get started. To begin creating your own content:</p><ol><li>Go to the Admin Panel</li><li>Login with your GitHub token</li><li>Create your first post</li></ol><p>Enjoy building your blog!</p>',
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
    
    // Calculate posts to display
    const startIndex = 0;
    const endIndex = currentPage * postsPerPage;
    displayedPosts = filteredPosts.slice(startIndex, endIndex);
    
    // Render posts
    postsGrid.innerHTML = displayedPosts.map(post => createPostCard(post)).join('');
    
    // Update load more button
    updateLoadMoreButton();
}

// Create post card HTML
function createPostCard(post) {
    return `
        <div class="post-card" onclick="navigateToPost('${post.id}', '${post.slug}')">
            <div class="post-card-image">
                <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
                <div class="post-card-overlay">
                    <span class="category">${post.category}</span>
                    <span class="rating">⭐ ${post.rating}</span>
                </div>
            </div>
            <div class="post-card-content">
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

    // Observe images when they're added to DOM
    const observeImages = () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    };

    // Initial observation
    setTimeout(observeImages, 100);
}
