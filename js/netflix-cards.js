/* ========================================
   PREMIUM NETFLIX CARD SYSTEM - FIXED
======================================== */

const NetflixCards = {
    modalEscListener: null,
    allPostsCache: null,
    
    createCard(post) {
        const isSaved = this.isSaved(post.id);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('data-post-id', post.id);
        
        const imdbRating = post.rating || 8.8;
        const rtScore = post.rottenTomatoes || Math.round(imdbRating * 10);
        const quality = post.quality || 'UHD 4K';
        const duration = post.duration || '2h 30m';
        
        card.innerHTML = `
            <div class="poster">
                <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
                <div class="overlay"></div>
                
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
                
                <div class="card-content">
                    <div class="title-row">
                        <h2>${post.title}</h2>
                        <span class="quality-inline">${quality}</span>
                    </div>
                    <p class="meta">${post.year || '2024'} • ${post.category || 'Movie'} • ${duration}</p>
                    
                    <div class="buttons">
                        <button class="play-btn" onclick="NetflixCards.openPost('${post.id}', '${post.file || post.slug}')">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            Play
                        </button>
                        
                        <button class="info-btn" onclick="NetflixCards.showInfo('${post.id}')">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                            </svg>
                            More Info
                        </button>
                        
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

    renderCards(posts, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[NetflixCards] Container not found:', containerId);
            return;
        }

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

        setTimeout(() => this.animateRatings(), 100);
    },

    animateRatings() {
        document.querySelectorAll('.ring-score').forEach(el => {
            const value = parseFloat(el.textContent);
            const suffix = el.textContent.includes('%') ? '%' : '';
            this.countUp(el, 0, value, suffix, 1400, 300);
        });
    },

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

    showLoading(containerId, count = 12) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createSkeletonCard());
        }
    },

    openPost(postId, file) {
        const url = file.startsWith('posts/') ? file : `posts/${file}`;
        window.location.href = url;
    },

    toggleSave(postId, event) {
        event.stopPropagation();
        
        if (typeof UserAuth === 'undefined' || !UserAuth.currentUser) {
            alert('Please login to save content');
            window.location.href = 'auth.html';
            return;
        }

        let saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        const index = saved.findIndex(id => id === postId);
        
        const button = document.getElementById('save-' + postId);
        if (!button) return;
        
        const tip = button.querySelector('.save-tip');
        
        if (index > -1) {
            saved.splice(index, 1);
            button.classList.remove('saved', 'burst');
            if (tip) tip.textContent = 'My List';
            this.showToast('Removed from your list');
        } else {
            saved.push(postId);
            button.classList.add('saved');
            button.classList.remove('burst');
            void button.offsetWidth;
            button.classList.add('burst');
            if (tip) tip.textContent = 'Saved ✓';
            this.spawnHearts(button);
            this.showToast('Added to your list');
        }
        
        localStorage.setItem('netflix_saved', JSON.stringify(saved));
        
        if (window.matchMedia('(hover: none)').matches && tip) {
            tip.style.cssText = 'opacity: 1; transform: translateX(-50%) translateY(0);';
            setTimeout(() => { tip.style.cssText = ''; }, 1800);
        }
    },

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

    isSaved(postId) {
        const saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        return saved.includes(postId);
    },

    getSavedPosts(allPosts) {
        const saved = JSON.parse(localStorage.getItem('netflix_saved') || '[]');
        return allPosts.filter(post => saved.includes(post.id));
    },

    showInfo(postId) {
        if (this.allPostsCache) {
            const post = this.allPostsCache.find(p => p.id === postId);
            if (post) {
                this.openModal(post, this.allPostsCache);
                return;
            }
        }
        
        fetch('data/posts-registry.json')
            .then(r => r.json())
            .then(data => {
                this.allPostsCache = data.posts;
                const post = data.posts.find(p => p.id === postId);
                if (post) {
                    this.openModal(post, data.posts);
                }
            })
            .catch(error => {
                console.error('[NetflixCards] Error:', error);
                alert('Failed to load content information');
            });
    },

openModal(post, allPosts) {
    const existing = document.getElementById('netflix-modal');
    if (existing) existing.remove();
    
    const similar = allPosts.filter(p => p.id !== post.id && p.category === post.category).slice(0, 6);
    const isSaved = this.isSaved(post.id);
    
    const overlay = document.createElement('div');
    overlay.className = 'netflix-modal-overlay';
    overlay.id = 'netflix-modal';
    
    const matchScore = Math.round((post.rating || 8.8) * 10);
    const tagline = post.tagline || `"${post.title} - ${post.category} masterpiece"`;
    
    overlay.innerHTML = `
        <div class="netflix-modal">
            <button class="netflix-modal-close" onclick="NetflixCards.closeModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            
            <div class="netflix-modal-hero">
                <img class="netflix-modal-hero-img" src="${post.banner}" alt="${post.title}" loading="eager"/>
                <div class="netflix-modal-hero-content">
                    <div class="netflix-modal-hero-logo">${post.title.toUpperCase()}</div>
                    <div class="netflix-modal-hero-tagline">${tagline}</div>
                    <div class="netflix-modal-btn-row">
                        <button class="netflix-modal-btn netflix-modal-btn-play" onclick="NetflixCards.openPost('${post.id}', '${post.file}')">
                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                            Play
                        </button>
                        <button class="netflix-modal-btn netflix-modal-btn-add ${isSaved ? 'saved' : ''}" id="modal-save-${post.id}" onclick="NetflixCards.toggleSaveModal('${post.id}', event)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                                ${isSaved ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
                            </svg>
                            <span>${isSaved ? 'Added' : 'My List'}</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="netflix-modal-body">
                <div class="netflix-modal-left">
                    <div class="netflix-modal-meta-row">
                        <span class="netflix-modal-match-score">${matchScore}% Match</span>
                        <span class="netflix-modal-year">${post.year || '2024'}</span>
                        <span class="netflix-modal-badge netflix-modal-badge-hd">${post.quality || 'UHD 4K'}</span>
                        <span class="netflix-modal-runtime">${post.duration || '2h 30m'}</span>
                    </div>
                    
                    <div class="netflix-modal-ratings">
                        <div class="netflix-modal-rating-pill netflix-modal-rating-imdb">
                            <span>⭐</span>
                            <span>IMDb ${post.rating || '8.8'}</span>
                        </div>
                        <div class="netflix-modal-rating-pill netflix-modal-rating-rt">
                            <span>🍅</span>
                            <span>RT ${post.rottenTomatoes || '94'}%</span>
                        </div>
                    </div>
                    
                    <p class="netflix-modal-description">${this.getDescription(post)}</p>
                    
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="netflix-modal-tags">
                            ${post.tags.map(tag => `<span class="netflix-modal-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="netflix-modal-info-grid">
                        <div><div class="netflix-modal-info-label">Category</div><div class="netflix-modal-info-value">${post.category || 'Movie'}</div></div>
                        <div><div class="netflix-modal-info-label">Year</div><div class="netflix-modal-info-value">${post.year || '2024'}</div></div>
                        <div><div class="netflix-modal-info-label">Quality</div><div class="netflix-modal-info-value">${post.quality || 'UHD 4K'}</div></div>
                        <div><div class="netflix-modal-info-label">Duration</div><div class="netflix-modal-info-value">${post.duration || '2h 30m'}</div></div>
                    </div>
                </div>
                
                <div class="netflix-modal-sidebar">
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="netflix-modal-sidebar-block">
                            <div class="netflix-modal-sidebar-label">Genres</div>
                            <div class="netflix-modal-sidebar-value">${post.tags.slice(0, 4).join(' · ')}</div>
                        </div>
                    ` : ''}
                    <div class="netflix-modal-sidebar-block">
                        <div class="netflix-modal-sidebar-label">Rating</div>
                        <div class="netflix-modal-sidebar-value">⭐ ${post.rating || '8.8'}/10</div>
                    </div>
                    <div class="netflix-modal-sidebar-block">
                        <div class="netflix-modal-sidebar-label">Language</div>
                        <div class="netflix-modal-sidebar-value">English</div>
                    </div>
                </div>
            </div>
            
            ${similar.length > 0 ? `
                <div class="netflix-modal-divider"></div>
                <div class="netflix-modal-similar">
                    <div class="netflix-modal-section-title">More Like This</div>
                    <div class="netflix-modal-similar-grid">
                        ${similar.map(item => `
                            <div class="netflix-modal-similar-card" onclick="NetflixCards.openPost('${item.id}', '${item.file}')">
                                <img class="netflix-modal-similar-thumb" src="${item.thumbnail}" alt="${item.title}"/>
                                <div class="netflix-modal-card-overlay">▶</div>
                                <div class="netflix-modal-similar-info">
                                    <div class="netflix-modal-similar-meta">
                                        <span class="netflix-modal-similar-match">${Math.round((item.rating || 8.8) * 10)}% Match</span>
                                        <span class="netflix-modal-similar-duration">${item.year || '2024'}</span>
                                    </div>
                                    <div class="netflix-modal-similar-title">${item.title}</div>
                                    <div class="netflix-modal-similar-desc">${this.getDescription(item).substring(0, 100)}...</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => overlay.classList.add('active'), 10);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
    });
    
    this.modalEscListener = (e) => {
        if (e.key === 'Escape') this.closeModal();
    };
    document.addEventListener('keydown', this.modalEscListener);
},

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

    toggleSaveModal(postId, event) {
        event.stopPropagation();
        
        if (typeof UserAuth === 'undefined' || !UserAuth.currentUser) {
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
            button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
            this.showToast('Removed from your list');
        } else {
            saved.push(postId);
            button.classList.add('saved');
            button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 13 9 18 20 6"/></svg>';
            this.showToast('Added to your list');
        }
        
        localStorage.setItem('netflix_saved', JSON.stringify(saved));
        
        const cardButton = document.getElementById('save-' + postId);
        if (cardButton) {
            const tip = cardButton.querySelector('.save-tip');
            if (index > -1) {
                cardButton.classList.remove('saved', 'burst');
                if (tip) tip.textContent = 'My List';
            } else {
                cardButton.classList.add('saved', 'burst');
                if (tip) tip.textContent = 'Saved ✓';
            }
        }
    },

    getDescription(post) {
        const descriptions = {
            'inception-2010': 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
            'avatar-way-of-water': 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
            'the-dark-knight': 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
            'interstellar': 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
            'the-shawshank-redemption': 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
            'pulp-fiction': 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.'
        };
        
        return descriptions[post.id] || `Discover ${post.title}, a ${post.category} masterpiece from ${post.year}. Experience it in ${post.quality || 'UHD 4K'} quality.`;
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9); color: white; padding: 1rem 2rem;
            border-radius: 4px; font-size: 0.875rem; font-family: 'Poppins', sans-serif;
            z-index: 10000; animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

// Animations - FIXED (added semicolon before this)
(function() {
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
})();

// Export
if (typeof window !== 'undefined') {
    window.NetflixCards = NetflixCards;
}
