# GitHub CMS

A modern, professional CMS platform powered entirely by GitHub Pages and GitHub API.

## Features

- 🎨 **Modern UI** - Netflix-style card interface
- 📝 **Professional Admin Panel** - Complete content management
- 🔍 **Advanced Search** - Real-time filtering and search
- 🔖 **Bookmark System** - Save favorite posts
- 📱 **Fully Responsive** - Works on all devices
- ⚡ **Fast & Lightweight** - No backend required
- 🔐 **Secure** - GitHub-based authentication

## Quick Setup

### 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., `my-blog`)
3. Make it **Public**
4. Create repository

### 2. Upload Files

1. Download all files from this package
2. Upload to your repository (drag & drop folder)
3. Commit changes

### 3. Enable GitHub Pages

1. Go to repository **Settings**
2. Navigate to **Pages** section
3. Source: **main branch** / **root**
4. Save

Your site will be available at: `https://username.github.io/repository-name`

### 4. Get GitHub Token

1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control)
4. Copy the token

### 5. Access Admin Panel

1. Visit: `https://username.github.io/repository-name/admin`
2. Enter your GitHub token
3. Enter repository name: `username/repository-name`
4. Click Login

## Creating Your First Post

1. Login to admin panel
2. Click "Create New Post"
3. Fill in the details:
   - Title
   - Category
   - Year
   - Rating
   - Tags
   - Thumbnail URL
   - Content (HTML)
4. Click "Save Post"
5. Post will appear on your homepage!

## File Structure
```
/
├── index.html              # Homepage
├── post.html               # Post page
├── search.html             # Search page
├── bookmarks.html          # Bookmarks page
├── admin/
│   └── index.html          # Admin panel
├── css/
│   ├── style.css           # Public styles
│   └── admin.css           # Admin styles
├── js/
│   ├── app.js              # Public logic
│   ├── admin.js            # Admin logic
│   └── github-api.js       # GitHub API wrapper
└── data/
    ├── config.json         # Site configuration
    ├── search-index.json   # Auto-generated index
    └── posts/              # Your posts (auto-generated)
```

## Configuration

Edit `data/config.json` to customize:

- Site name and tagline
- Categories
- Posts per page
- Features (search, bookmarks, etc.)

## Tips

- **Images**: Upload to `data/media/` or use external URLs
- **Content**: Use HTML in post content for rich formatting
- **SEO**: Each post gets a unique slug-based URL
- **Search**: Auto-updates when you create/edit/delete posts
- **Backup**: All content is in GitHub - built-in version control!

## Support

For issues or questions:
- Check GitHub Issues
- Read documentation at [your-site-url]/docs
- Contact support

## License

MIT License - Feel free to use for personal or commercial projects

---

Built with ❤️ using GitHub Pages
