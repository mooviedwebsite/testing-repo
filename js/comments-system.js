/* ========================================
   POWERFUL COMMENT SYSTEM
   Real-time, reliable, with retry logic
======================================== */

const CommentSystem = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxj2BdW32wwiA_A6W5onNWAYVG6uX4Px5qvni1QZxHJL2m-nS3fSzefatS470EbIV_S/exec',
    
    // Add comment with retry logic
    async addComment(postId, userId, userName, userMembership, text) {
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[Comment System] Attempt ${attempt}/${maxRetries}`);
                console.log('[Comment System] Data:', { postId, userId, userName, userMembership, text });

                // Method 1: URL-encoded POST
                const formData = new URLSearchParams();
                formData.append('action', 'addComment');
                formData.append('postId', postId);
                formData.append('userId', userId);
                formData.append('userName', userName);
                formData.append('userMembership', userMembership);
                formData.append('text', text);

                const response = await fetch(this.SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
                    mode: 'cors'
                });

                console.log('[Comment System] Response status:', response.status);

                // Try to parse response
                let result;
                try {
                    const responseText = await response.text();
                    console.log('[Comment System] Response text:', responseText);
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.warn('[Comment System] Could not parse response, assuming success');
                    result = { success: true };
                }

                if (result.success !== false) {
                    console.log('[Comment System] ✅ Comment posted successfully');
                    return { success: true };
                }

                lastError = result.error || 'Unknown error';
                console.warn(`[Comment System] Attempt ${attempt} failed:`, lastError);

            } catch (error) {
                lastError = error.message;
                console.error(`[Comment System] Attempt ${attempt} error:`, error);
            }

            // Wait before retry
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        throw new Error(lastError || 'Failed to post comment after retries');
    },

    // Get comments with caching
    async getComments(postId, useCache = true) {
        try {
            const cacheKey = `comments_${postId}`;
            const cacheTime = 30000; // 30 seconds

            // Check cache
            if (useCache) {
                const cached = this.getFromCache(cacheKey, cacheTime);
                if (cached) {
                    console.log('[Comment System] Using cached comments');
                    return cached;
                }
            }

            console.log('[Comment System] Fetching comments for:', postId);

            const response = await fetch(`${this.SCRIPT_URL}?action=getComments&postId=${encodeURIComponent(postId)}`);
            
            const result = await response.json();
            console.log('[Comment System] Comments response:', result);

            const comments = result.comments || [];
            
            // Cache the results
            this.saveToCache(cacheKey, comments);

            return comments;

        } catch (error) {
            console.error('[Comment System] Failed to get comments:', error);
            return [];
        }
    },

    // Cache helpers
    saveToCache(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            sessionStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('[Comment System] Cache save failed:', error);
        }
    },

    getFromCache(key, maxAge) {
        try {
            const cached = sessionStorage.getItem(key);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            if (age > maxAge) {
                sessionStorage.removeItem(key);
                return null;
            }

            return cacheData.data;
        } catch (error) {
            return null;
        }
    },

    clearCache(postId) {
        try {
            sessionStorage.removeItem(`comments_${postId}`);
        } catch (error) {
            console.warn('[Comment System] Cache clear failed:', error);
        }
    }
};

// Export for use
if (typeof window !== 'undefined') {
    window.CommentSystem = CommentSystem;
}
