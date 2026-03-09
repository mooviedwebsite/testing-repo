/* ========================================
   PREMIUM NETFLIX CARD SYSTEM
   Exact match to your design
======================================== */

const NetflixCards = {
    
   // Create premium card with exact design - USING REGISTRY DATA
createCard(post) {
    const isSaved = this.isSaved(post.id);
    
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-post-id', post.id);
    
    // Use registry data with fallbacks
    const imdbRating = post.rating || 8.8;
    const rtScore = post.rottenTomatoes || Math.round(imdbRating * 10);
    const quality = post.quality || 'UHD 4K';
    const duration = post.duration || '2h 30m';
    
    card.innerHTML = `
        <div class="poster">
            <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
            <div class="overlay"></div>
            
            <!-- Ratings -->
            <div class="ratings-container">
                <div class="rating-ring imdb-ring">
                    <svg class="ring-svg" viewBox="0 0 48 48">
                        <circle class="ring-track" cx="24" cy="24" r="20"/>
                        <circle class="ring-fill" cx="24" cy="24" r="20"/>
                    </svg>
                    <div class="ring-center">
                        <span class="ring-score">${imdbRating}</span>
                        <span class="ring-label">IMDb</span>
                    </div>
                    <div class="ring-halo"></div>
                </div>
                <div class="rating-ring rt-ring">
                    <svg class="ring-svg" viewBox="0 0 48 48">
                        <circle class="ring-track" cx="24" cy="24" r="20"/>
                        <circle class="ring-fill" cx="24" cy="24" r="20"/>
                    </svg>
                    <div class="ring-center">
                        <span class="ring-score">${rtScore}%</span>
                        <span class="ring-label">RT</span>
                    </div>
                    <div class="ring-halo"></div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="card-content">
                <div class="title-row">
                    <h2>${post.title}</h2>
                    <span class="quality-inline">${quality}</span>
                </div>
                <p class="meta">${post.year || '2024'} • ${post.category || 'Movie'} • ${duration}</p>
                
                <div class="buttons">
                    <!-- Play Button with SVG -->
                    <button class="play-btn" onclick="NetflixCards.openPost('${post.id}', '${post.file || post.slug}')">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        Play
                    </button>
                    
                    <!-- More Info Button with SVG -->
                    <button class="info-btn" onclick="NetflixCards.showInfo('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        More Info
                    </button>
                    
                    <!-- Save Button with SVG Icons -->
                    <button class="save-btn ${isSaved ? 'saved' : ''}" 
                            id="save-${post.id}"
                            onclick="NetflixCards.toggleSave('${post.id}', event)"
                            aria-label="Add to My List">
                        <span class="ico ico-plus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round">
                                <line x1="12" y1="4" x2="12" y2="20"/>
                                <line x1="4" y1="12" x2="20" y2="12"/>
                            </svg>
                        </span>
                        <span class="ico ico-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#e50914" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="4 13 9 18 20 6"/>
                            </svg>
                        </span>
                        <span class="save-tip">${isSaved ? 'Saved ✓' : 'My List'}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
},
    // Create skeleton loading card
    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'movie-card skeleton';
        card.style.cssText = `
            background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            height: clamp(300px, 60vw, 510px);
            border-radius: clamp(16px, 4vw, 28px);
        `;
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

        // Animate rating rings after render
        setTimeout(() => this.animateRatings(), 100);
    },

    // Animate rating rings
    animateRatings() {
        document.querySelectorAll('.ring-score').forEach(el => {
            const value = parseFloat(el.textContent);
            const suffix = el.textContent.includes('%') ? '%' : '';
            this.countUp(el, 0, value, suffix, 1400, 300);
        });
    },

    // Count-up animation
    countUp(el, from, to, suffix, duration, delay) {
        setTimeout(() => {
            const startTime = performance.now();
            const animate = (currentTime) => {
                const progress = Math.min((currentTime - startTime) / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = from + (to - from) * easeOut;
                
                if (suffix === '%') {
                    el.textContent = Math.round(current) + '%';
                } else {
                    el.textContent = current.toFixed(1);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }, delay);
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

    // Toggle save with heart particles
    toggleSave(postId, event) {
        event.stopPropagation();
        
        if (!UserAuth || !UserAuth.currentUser) {
            alert('Please login to save content');
            window.location.href = 'auth.html';
            return;
        }

        let saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        const index = saved.findIndex(id => id === postId);
        
        const button = document.getElementById('save-' + postId);
        const tip = button.querySelector('.save-tip');
        
        if (index > -1) {
            // Remove from saved
            saved.splice(index, 1);
            button.classList.remove('saved', 'burst');
            tip.textContent = 'My List';
            this.showToast('Removed from your list');
        } else {
            // Add to saved
            saved.push(postId);
            button.classList.add('saved');
            button.classList.remove('burst');
            void button.offsetWidth; // Force reflow
            button.classList.add('burst');
            tip.textContent = 'Saved ✓';
            this.spawnHearts(button);
            this.showToast('Added to your list');
        }
        
        localStorage.setItem('netflix_saved', JSON.stringify(saved));
        
        // Show tooltip on mobile
        if (window.matchMedia('(hover: none)').matches) {
            tip.style.cssText = 'opacity: 1; transform: translateX(-50%) translateY(0);';
            setTimeout(() => {
                tip.style.cssText = '';
            }, 1800);
        }
    },

    // Spawn heart particles
    spawnHearts(button) {
        [-13, 0, 13].forEach((offset, i) => {
            setTimeout(() => {
                const heart = document.createElement('span');
                heart.className = 'heart-particle';
                heart.textContent = '❤';
                heart.style.cssText = `
                    left: calc(50% + ${offset}px - 7px);
                    bottom: 105%;
                    color: #e50914;
                `;
                button.appendChild(heart);
                setTimeout(() => heart.remove(), 920);
            }, i * 70);
        });
    },

    // Check if saved
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
            font-family: 'Poppins', sans-serif;
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

// Add loading animation keyframe
const style = document.createElement('style');
style.textContent = `
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 100%); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes slideDown {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, 100%); }
    }
`;
document.head.appendChild(style);

// Export
if (typeof window !== 'undefined') {
    window.NetflixCards = NetflixCards;
}
