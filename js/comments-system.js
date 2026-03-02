/* ========================================
   POWERFUL COMMENT SYSTEM WITH EDIT & DELETE
======================================== */

const CommentSystem = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxxhGkwRbJErCE05Z-TejfARFrdmQlp4ijNCSPSfnRlntgmk4re-fXUZiOFEAKLaEtz/exec',
    
   // Add comment with retry logic - FIXED CORS
async addComment(postId, userId, userName, userMembership, text) {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Comment System] Attempt ${attempt}/${maxRetries}`);

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
                body: formData.toString()
            });

            console.log('[Comment System] Response status:', response.status);

            // For Apps Script, we can't always read the response due to CORS
            // If status is 200, assume success
            if (response.status === 200 || response.ok) {
                console.log('[Comment System] ✅ Comment posted successfully');
                return { success: true };
            }

            // Try to read error
            try {
                const result = await response.json();
                lastError = result.error || 'Unknown error';
            } catch (e) {
                // If we can't parse response but got 200, it's success
                if (response.status === 200) {
                    return { success: true };
                }
                lastError = 'Network error';
            }

        } catch (error) {
            lastError = error.message;
            console.error(`[Comment System] Attempt ${attempt} error:`, error);
        }

        // Wait before retry
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }

    throw new Error(lastError || 'Failed to post comment');
},

    // Edit comment
    async editComment(commentId, userId, newText) {
        try {
            console.log('[Comment System] Editing comment:', commentId);

            const formData = new URLSearchParams();
            formData.append('action', 'editComment');
            formData.append('commentId', commentId);
            formData.append('userId', userId);
            formData.append('text', newText);

            const response = await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                mode: 'cors'
            });

            const result = await response.json();

            if (result.success) {
                console.log('[Comment System] ✅ Comment edited successfully');
                return { success: true };
            } else {
                throw new Error(result.error || 'Failed to edit comment');
            }

        } catch (error) {
            console.error('[Comment System] Edit failed:', error);
            throw error;
        }
    },

    // Delete comment
    async deleteComment(commentId, userId) {
        try {
            console.log('[Comment System] Deleting comment:', commentId);

            const formData = new URLSearchParams();
            formData.append('action', 'deleteComment');
            formData.append('commentId', commentId);
            formData.append('userId', userId);

            const response = await fetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                mode: 'cors'
            });

            const result = await response.json();

            if (result.success) {
                console.log('[Comment System] ✅ Comment deleted successfully');
                return { success: true };
            } else {
                throw new Error(result.error || 'Failed to delete comment');
            }

        } catch (error) {
            console.error('[Comment System] Delete failed:', error);
            throw error;
        }
    },

    // Get comments with caching
    async getComments(postId, useCache = true) {
        try {
            const cacheKey = `comments_${postId}`;
            const cacheTime = 30000; // 30 seconds

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
            const comments = result.comments || [];
            
            this.saveToCache(cacheKey, comments);
            return comments;

        } catch (error) {
            console.error('[Comment System] Failed to get comments:', error);
            return [];
        }
    },

    // Get all comments (for admin)
    async getAllComments() {
        try {
            const response = await fetch(`${this.SCRIPT_URL}?action=getAllComments`);
            const result = await response.json();
            return result.comments || [];
        } catch (error) {
            console.error('[Comment System] Failed to get all comments:', error);
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

if (typeof window !== 'undefined') {
    window.CommentSystem = CommentSystem;
}
