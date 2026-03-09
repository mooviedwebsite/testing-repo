/* ========================================
   NETFLIX CARD SYSTEM
======================================== */

const NetflixCards = {
    
    // Create a Netflix-style card
    createCard(post) {
        const isSaved = this.isSaved(post.id);
        
        const card = document.createElement('div');
        card.className = 'netflix-card';
        card.setAttribute('data-post-id', post.id);
        
        card.innerHTML = `
            <div class="netflix-card-image">
                <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
                ${post.rating ? `<div class="netflix-card-badge">⭐ ${post.rating}</div>` : ''}
            </div>
            <div class="netflix-card-overlay">
                <h3 class="netflix-card-title">${post.title}</h3>
                <div class="netflix-card-meta">
                    ${post.year ? `<span class="netflix-card-year">${post.year}</span>` : ''}
                    ${post.rating ? `<span class="netflix-card-rating">⭐ ${post.rating}</span>` : ''}
                    ${post.category ? `<span class="netflix-card-category">${post.category}</span>` : ''}
                </div>
                <div class="netflix-card-actions">
                    <button class="netflix-btn netflix-btn-play" onclick="NetflixCards.openPost('${post.id}', '${post.file || post.slug}')">
                        ▶ Play
                    </button>
                    <button class="netflix-btn netflix-btn-icon ${isSaved ? 'saved' : ''}" 
                            onclick="NetflixCards.toggleSave('${post.id}', event)" 
                            title="${isSaved ? 'Remove from list' : 'Add to list'}">
                        ${isSaved ? '✓' : '+'}
                    </button>
                    <button class="netflix-btn netflix-btn-icon" 
                            onclick="NetflixCards.showInfo('${post.id}')" 
                            title="More info">
                        ℹ
                    </button>
                </div>
            </div>
        `;
        
        return card;
    },

    // Create skeleton loading card
    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'netflix-card skeleton';
        return card;
    },

    // Render cards to container
    renderCards(posts, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="netflix-empty">
                    <div class="netflix-empty-icon">📽️</div>
                    <div class="netflix-empty-text">No content found</div>
                    <div class="netflix-empty-subtext">Check back later for new additions</div>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const card = this.createCard(post);
            container.appendChild(card);
        });
    },

    // Show loading skeletons
    showLoading(containerId, count = 12) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createSkeletonCard());
        }
    },

    // Open post page
    openPost(postId, file) {
        const url = file.startsWith('posts/') ? file : `posts/${file}`;
        window.location.href = url;
    },

    // Toggle save/bookmark
    toggleSave(postId, event) {
        event.stopPropagation();
        
        if (!UserAuth || !UserAuth.currentUser) {
            alert('Please login to save content');
            window.location.href = 'auth.html';
            return;
        }

        let saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        const index = saved.findIndex(id => id === postId);
        
        const button = event.currentTarget;
        
        if (index > -1) {
            saved.splice(index, 1);
            button.classList.remove('saved');
            button.textContent = '+';
            button.title = 'Add to list';
            this.showToast('Removed from your list');
        } else {
            saved.push(postId);
            button.classList.add('saved');
            button.textContent = '✓';
            button.title = 'Remove from list';
            this.showToast('Added to your list');
        }
        
        localStorage.setItem('netflix_saved', JSON.stringify(saved));
        
        // Update saved count in navbar
        if (typeof UserAuth !== 'undefined' && UserAuth.updateUserIcon) {
            UserAuth.updateUserIcon();
        }
    },

    // Check if post is saved
    isSaved(postId) {
        const saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        return saved.includes(postId);
    },

    // Get saved posts
    getSavedPosts(allPosts) {
        const saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        return allPosts.filter(post => saved.includes(post.id));
    },

    // Show info modal
    showInfo(postId) {
        // Find post data
        fetch('data/posts-registry.json')
            .then(r => r.json())
            .then(data => {
                const post = data.posts.find(p => p.id === postId);
                if (post) {
                    alert(`
📽️ ${post.title}

📅 Year: ${post.year}
⭐ Rating: ${post.rating}
🎭 Category: ${post.category}
🏷️ Tags: ${post.tags ? post.tags.join(', ') : 'None'}

Click "Play" to watch or "+" to save to your list!
                    `.trim());
                }
            });
    },

    // Show toast notification
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'netflix-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            font-size: 0.875rem;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

// Toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 100%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 100%);
        }
    }
`;
document.head.appendChild(style);

// Export for use in other files
if (typeof window !== 'undefined') {
    window.NetflixCards = NetflixCards;
}
