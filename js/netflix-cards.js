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

 /* ========================================
   NETFLIX MODAL FUNCTIONS
======================================== */

// Show Netflix-style info modal
showInfo(postId) {
    fetch('data/posts-registry.json')
        .then(r => r.json())
        .then(data => {
            const post = data.posts.find(p => p.id === postId);
            if (post) {
                this.openModal(post, data.posts);
            }
        })
        .catch(error => {
            console.error('Failed to load post info:', error);
        });
},

// Open modal
openModal(post, allPosts) {
    // Get similar posts (same category, exclude current)
    const similar = allPosts
        .filter(p => p.id !== post.id && p.category === post.category)
        .slice(0, 6);
    
    const isSaved = this.isSaved(post.id);
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'netflix-modal-overlay';
    overlay.id = 'netflix-modal';
    
    overlay.innerHTML = `
        <div class="netflix-modal">
            <button class="netflix-modal-close" onclick="NetflixCards.closeModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            
            <div class="netflix-modal-content">
                <!-- Hero Section -->
                <div class="netflix-modal-hero" style="background-image: url('${post.banner}')">
                    <div class="netflix-modal-hero-gradient"></div>
                    <div class="netflix-modal-hero-content">
                        <h2 class="netflix-modal-title">${post.title}</h2>
                        <div class="netflix-modal-meta">
                            <span class="netflix-modal-match">${Math.round(post.rating * 10)}% Match</span>
                            <span class="netflix-modal-year">${post.year}</span>
                            <span class="netflix-modal-duration">${post.duration || '2h 30m'}</span>
                            <span class="netflix-modal-quality">${post.quality || 'UHD 4K'}</span>
                        </div>
                        
                        <div class="netflix-modal-actions">
                            <button class="netflix-modal-btn netflix-modal-btn-play" onclick="NetflixCards.openPost('${post.id}', '${post.file}')">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                Play
                            </button>
                            <button class="netflix-modal-btn netflix-modal-btn-add ${isSaved ? 'saved' : ''}" 
                                    id="modal-save-${post.id}"
                                    onclick="NetflixCards.toggleSaveModal('${post.id}', event)">
                                ${isSaved ? `
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="4 13 9 18 20 6"/>
                                    </svg>
                                ` : `
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                `}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Body Content -->
                <div class="netflix-modal-body">
                    <p class="netflix-modal-description">
                        ${this.getDescription(post)}
                    </p>
                    
                    <div class="netflix-modal-info-grid">
                        <div>
                            <!-- Tags -->
                            ${post.tags && post.tags.length > 0 ? `
                                <div class="netflix-modal-tags">
                                    ${post.tags.map(tag => `
                                        <span class="netflix-modal-tag">#${tag}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <!-- Ratings -->
                            <div class="netflix-modal-ratings">
                                <div class="netflix-modal-rating-item">
                                    <div class="netflix-modal-rating-badge imdb">${post.rating || '8.8'}</div>
                                    <span class="netflix-modal-rating-label">IMDb Rating</span>
                                </div>
                                <div class="netflix-modal-rating-item">
                                    <div class="netflix-modal-rating-badge rt">${post.rottenTomatoes || '94'}%</div>
                                    <span class="netflix-modal-rating-label">Rotten Tomatoes</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <!-- Info Items -->
                            <div class="netflix-modal-info-item">
                                <div class="netflix-modal-info-label">Category</div>
                                <div class="netflix-modal-info-value">${post.category}</div>
                            </div>
                            <div class="netflix-modal-info-item">
                                <div class="netflix-modal-info-label">Release Year</div>
                                <div class="netflix-modal-info-value">${post.year}</div>
                            </div>
                            <div class="netflix-modal-info-item">
                                <div class="netflix-modal-info-label">Quality</div>
                                <div class="netflix-modal-info-value">${post.quality || 'UHD 4K'}</div>
                            </div>
                            <div class="netflix-modal-info-item">
                                <div class="netflix-modal-info-label">Duration</div>
                                <div class="netflix-modal-info-value">${post.duration || '2h 30m'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Similar Content -->
                ${similar.length > 0 ? `
                    <div class="netflix-modal-similar">
                        <h3 class="netflix-modal-similar-title">More Like This</h3>
                        <div class="netflix-modal-similar-grid">
                            ${similar.map(item => `
                                <div class="netflix-modal-similar-card" onclick="NetflixCards.openPost('${item.id}', '${item.file}')">
                                    <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                                    <div class="netflix-modal-similar-card-content">
                                        <div class="netflix-modal-similar-card-title">${item.title}</div>
                                        <div class="netflix-modal-similar-card-meta">
                                            <span>${item.year}</span>
                                            <span>⭐ ${item.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Activate modal after small delay for animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            this.closeModal();
        }
    });
    
    // Close on ESC key
    this.modalEscListener = (e) => {
        if (e.key === 'Escape') {
            this.closeModal();
        }
    };
    document.addEventListener('keydown', this.modalEscListener);
},

// Close modal
closeModal() {
    const modal = document.getElementById('netflix-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
    
    if (this.modalEscListener) {
        document.removeEventListener('keydown', this.modalEscListener);
        this.modalEscListener = null;
    }
},

// Toggle save in modal
toggleSaveModal(postId, event) {
    event.stopPropagation();
    
    if (!UserAuth || !UserAuth.currentUser) {
        alert('Please login to save content');
        this.closeModal();
        window.location.href = 'auth.html';
        return;
    }

    let saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
    const index = saved.findIndex(id => id === postId);
    
    const button = document.getElementById('modal-save-' + postId);
    
    if (index > -1) {
        saved.splice(index, 1);
        button.classList.remove('saved');
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
        `;
        this.showToast('Removed from your list');
    } else {
        saved.push(postId);
        button.classList.add('saved');
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="4 13 9 18 20 6"/>
            </svg>
        `;
        this.showToast('Added to your list');
    }
    
    localStorage.setItem('netflix_saved', JSON.stringify(saved));
    
    // Update card button if exists
    const cardButton = document.getElementById('save-' + postId);
    if (cardButton) {
        if (index > -1) {
            cardButton.classList.remove('saved', 'burst');
        } else {
            cardButton.classList.add('saved', 'burst');
        }
    }
},

// Get description (placeholder)
getDescription(post) {
    const descriptions = {
        'inception-2010': 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
        'avatar-way-of-water': 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
        'the-dark-knight': 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        'interstellar': 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        'the-shawshank-redemption': 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        'pulp-fiction': 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.'
    };
    
    return descriptions[post.id] || `Discover the thrilling story of ${post.title}, a must-watch ${post.category} masterpiece from ${post.year}. Experience stunning visuals in ${post.quality || 'UHD 4K'} quality.`;
},

   

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
