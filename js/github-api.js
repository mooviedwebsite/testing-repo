/* ========================================
   GITHUB API WRAPPER
   Handles all GitHub REST API operations
======================================== */

const GitHubAPI = {
    config: {
        token: null,
        repo: null,
        owner: null,
        branch: 'main'
    },

    // Initialize API
    init(token, repo) {
        this.config.token = token;
        const [owner, repoName] = repo.split('/');
        this.config.owner = owner;
        this.config.repo = repoName;
    },

    // Generic API request
    async request(endpoint, method = 'GET', data = null) {
        const url = `https://api.github.com${endpoint}`;
        const headers = {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        const options = {
            method,
            headers
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API Request Failed:', error);
            throw error;
        }
    },

    // Get file content
    async getFile(path) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
        const response = await this.request(endpoint);
        
        // Decode base64 content
        const content = atob(response.content);
        return {
            content: content,
            sha: response.sha
        };
    },

    // Get JSON file
    async getJSON(path) {
        try {
            const file = await this.getFile(path);
            return JSON.parse(file.content);
        } catch (error) {
            console.error(`Failed to get JSON from ${path}:`, error);
            return null;
        }
    },

    // Create or update file
    async createOrUpdateFile(path, content, message, sha = null) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
        
        const data = {
            message: message,
            content: btoa(unescape(encodeURIComponent(content))), // Encode to base64
            branch: this.config.branch
        };

        if (sha) {
            data.sha = sha;
        }

        return await this.request(endpoint, 'PUT', data);
    },

    // Delete file
    async deleteFile(path, message) {
        const file = await this.getFile(path);
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
        
        const data = {
            message: message,
            sha: file.sha,
            branch: this.config.branch
        };

        return await this.request(endpoint, 'DELETE', data);
    },

    // Get all posts
    async getPosts() {
        try {
            const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/data/posts`;
            const files = await this.request(endpoint);
            
            const posts = [];
            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    const post = await this.getJSON(`data/posts/${file.name}`);
                    if (post) {
                        posts.push(post);
                    }
                }
            }

            // Sort by creation date (newest first)
            posts.sort((a, b) => new Date(b.metadata.created) - new Date(a.metadata.created));
            
            return posts;
        } catch (error) {
            console.error('Failed to get posts:', error);
            return [];
        }
    },

    // Get single post
    async getPost(postId) {
        try {
            return await this.getJSON(`data/posts/${postId}.json`);
        } catch (error) {
            console.error(`Failed to get post ${postId}:`, error);
            return null;
        }
    },

    // Create post
    async createPost(postData) {
        // Generate ID if not provided
        if (!postData.id) {
            postData.id = 'post-' + Date.now();
        }

        // Generate slug if not provided
        if (!postData.slug) {
            postData.slug = this.generateSlug(postData.title);
        }

        // Add metadata
        if (!postData.metadata) {
            postData.metadata = {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                author: 'admin',
                published: true
            };
        }

        // Save post
        const path = `data/posts/${postData.id}.json`;
        const content = JSON.stringify(postData, null, 2);
        await this.createOrUpdateFile(path, content, `Create post: ${postData.title}`);

        // Update search index
        await this.updateSearchIndex();

        return postData;
    },

    // Update post
    async updatePost(postId, postData) {
        postData.metadata.updated = new Date().toISOString();
        
        const path = `data/posts/${postId}.json`;
        const content = JSON.stringify(postData, null, 2);
        
        // Get current file SHA
        const file = await this.getFile(path);
        
        await this.createOrUpdateFile(path, content, `Update post: ${postData.title}`, file.sha);

        // Update search index
        await this.updateSearchIndex();

        return postData;
    },

    // Delete post
    async deletePost(postId) {
        const path = `data/posts/${postId}.json`;
        await this.deleteFile(path, `Delete post: ${postId}`);

        // Update search index
        await this.updateSearchIndex();
    },

    // Update search index
    async updateSearchIndex() {
        const posts = await this.getPosts();
        
        const searchIndex = {
            posts: posts.map(post => ({
                id: post.id,
                slug: post.slug,
                title: post.title,
                category: post.category,
                year: post.year,
                rating: post.rating,
                tags: post.tags,
                searchText: [
                    post.title,
                    post.category,
                    ...post.tags
                ].join(' ').toLowerCase()
            })),
            lastUpdated: new Date().toISOString()
        };

        const path = 'data/search-index.json';
        const content = JSON.stringify(searchIndex, null, 2);
        
        try {
            const file = await this.getFile(path);
            await this.createOrUpdateFile(path, content, 'Update search index', file.sha);
        } catch {
            // File doesn't exist, create it
            await this.createOrUpdateFile(path, content, 'Create search index');
        }
    },

    // Get config
    async getConfig() {
        try {
            return await this.getJSON('data/config.json');
        } catch (error) {
            // Return default config if file doesn't exist
            return {
                site: {
                    name: 'GitHub CMS',
                    tagline: 'Powered by GitHub',
                    theme: 'dark'
                },
                github: {
                    repo: `${this.config.owner}/${this.config.repo}`,
                    branch: 'main'
                },
                homepage: {
                    layout: 'cards',
                    postsPerPage: 12,
                    categories: ['Action', 'Drama', 'Sci-Fi', 'Horror', 'Comedy']
                }
            };
        }
    },

    // Update config
    async updateConfig(configData) {
        const path = 'data/config.json';
        const content = JSON.stringify(configData, null, 2);
        
        try {
            const file = await this.getFile(path);
            await this.createOrUpdateFile(path, content, 'Update config', file.sha);
        } catch {
            await this.createOrUpdateFile(path, content, 'Create config');
        }
    },

    // Upload media
    async uploadMedia(file, fileName) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Get base64 content (remove data URL prefix)
                    const base64Content = e.target.result.split(',')[1];
                    
                    const path = `data/media/${fileName}`;
                    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
                    
                    const data = {
                        message: `Upload media: ${fileName}`,
                        content: base64Content,
                        branch: this.config.branch
                    };

                    await this.request(endpoint, 'PUT', data);
                    
                    // Return URL to uploaded file
                    const url = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;
                    resolve(url);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Get media files
    async getMediaFiles() {
        try {
            const endpoint = `/repos/${this.config.owner}/${this.config.repo}/contents/data/media`;
            const files = await this.request(endpoint);
            
            return files.map(file => ({
                name: file.name,
                url: file.download_url,
                size: file.size
            }));
        } catch (error) {
            console.error('Failed to get media files:', error);
            return [];
        }
    },

    // Helper: Generate slug from title
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    },

    // Helper: Generate unique ID
    generateId() {
        return 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubAPI;
}
