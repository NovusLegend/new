// Main application logic
class SocialApp {
    constructor() {
        this.currentUser = null;
        this.isLoading = true;
        this.currentTab = 'feed';
        this.posts = [];
        this.users = [];
        this.suggestions = [];
        this.searchResults = [];
        this.currentProfile = null;
    }

    // Initialize the application
    async init() {
        try {
            // Initialize UI manager
            uiManager.init();
            
            // Setup auth state listener
            authManager.onAuthStateChange((user, loading) => {
                this.currentUser = user;
                this.isLoading = loading;
                this.handleAuthStateChange();
            });

            // Initialize auth
            await authManager.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            uiManager.showToast('Error', 'Failed to initialize application', 'error');
        }
    }

    // Handle authentication state changes
    handleAuthStateChange() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');

        if (this.isLoading) {
            loadingScreen.classList.remove('hidden');
            loginScreen.classList.add('hidden');
            mainApp.classList.add('hidden');
        } else if (this.currentUser) {
            loadingScreen.classList.add('hidden');
            loginScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            this.loadMainApp();
        } else {
            loadingScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            mainApp.classList.add('hidden');
        }
    }

    // Load main application data
    async loadMainApp() {
        try {
            // Update nav avatar
            const navAvatar = document.getElementById('nav-avatar');
            if (navAvatar && this.currentUser) {
                navAvatar.src = this.currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser.id}`;
            }

            // Load initial data
            await Promise.all([
                this.loadFeed(),
                this.loadUserCard(),
                this.loadSuggestions()
            ]);

        } catch (error) {
            console.error('Error loading main app:', error);
            uiManager.showToast('Error', 'Failed to load application data', 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Auth form submission
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', this.handleAuthSubmit.bind(this));
        }

        // Sign up toggle
        const signupToggle = document.getElementById('signup-toggle');
        if (signupToggle) {
            signupToggle.addEventListener('click', this.toggleAuthMode.bind(this));
        }

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Navigation buttons
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                uiManager.showModal('upload-modal');
            });
        }

        const messagesBtn = document.getElementById('messages-btn');
        if (messagesBtn) {
            messagesBtn.addEventListener('click', () => {
                uiManager.showModal('messaging-modal');
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                uiManager.closeModal(modal);
            });
        });

        // Upload modal
        this.setupUploadModal();

        // Search functionality
        this.setupSearch();

        // Profile navigation
        const navProfile = document.getElementById('nav-profile');
        if (navProfile) {
            navProfile.addEventListener('click', () => {
                this.switchTab('profile');
                this.loadProfile(this.currentUser.id);
            });
        }
    }

    // Handle authentication form submission
    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        const isSignUp = loginBtn.textContent.includes('Sign Up');

        try {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span>Loading...</span>';

            let result;
            if (isSignUp) {
                result = await authManager.signUp(email, password);
            } else {
                result = await authManager.signIn(email, password);
            }

            if (result.success) {
                if (isSignUp) {
                    uiManager.showToast('Success', 'Account created! Please check your email to verify your account.', 'success');
                } else {
                    uiManager.showToast('Success', 'Signed in successfully!', 'success');
                }
            } else {
                uiManager.showToast('Error', result.error, 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            uiManager.showToast('Error', 'Authentication failed', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = isSignUp ? 
                '<span>Sign Up</span><i data-lucide="arrow-right"></i>' : 
                '<span>Sign In</span><i data-lucide="arrow-right"></i>';
            lucide.createIcons();
        }
    }

    // Toggle between sign in and sign up
    toggleAuthMode() {
        const loginBtn = document.getElementById('login-btn');
        const signupToggle = document.getElementById('signup-toggle');
        const formTitle = document.querySelector('.login-form h2');
        const formSubtitle = document.querySelector('.login-form > p');

        if (loginBtn.textContent.includes('Sign In')) {
            // Switch to sign up mode
            loginBtn.innerHTML = '<span>Sign Up</span><i data-lucide="arrow-right"></i>';
            signupToggle.textContent = 'Already have an account? Sign In';
            formTitle.textContent = 'Create Account';
            formSubtitle.textContent = 'Join our social community today';
        } else {
            // Switch to sign in mode
            loginBtn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right"></i>';
            signupToggle.textContent = 'Create New Account';
            formTitle.textContent = 'Welcome Back';
            formSubtitle.textContent = 'Sign in to continue to your social space';
        }
        
        lucide.createIcons();
    }

    // Handle logout
    async handleLogout() {
        try {
            const result = await authManager.signOut();
            if (result.success) {
                uiManager.showToast('Success', 'Signed out successfully', 'success');
            } else {
                uiManager.showToast('Error', result.error, 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            uiManager.showToast('Error', 'Failed to sign out', 'error');
        }
    }

    // Switch tabs
    switchTab(tabName) {
        this.currentTab = tabName;
        uiManager.switchTab(tabName);

        // Load tab-specific data
        switch (tabName) {
            case 'feed':
                this.loadFeed();
                break;
            case 'search':
                // Search is handled by input events
                break;
            case 'profile':
                this.loadProfile(this.currentUser.id);
                break;
            case 'messages':
                // Messages modal handling
                break;
            case 'activity':
                // Activity feed - placeholder for now
                break;
        }
    }

    // Load feed data
    async loadFeed() {
        try {
            const feedContainer = document.getElementById('posts-feed');
            feedContainer.innerHTML = '<div class="loading-posts">Loading posts...</div>';

            const posts = await apiManager.getPosts();
            this.posts = posts;

            if (posts.length === 0) {
                feedContainer.innerHTML = `
                    <div class="empty-feed">
                        <div class="empty-icon">
                            <i data-lucide="camera"></i>
                        </div>
                        <h3>No posts yet</h3>
                        <p>Follow some users or create your first post to see content here.</p>
                        <button class="btn-primary" onclick="uiManager.showModal('upload-modal')">
                            Create Post
                        </button>
                    </div>
                `;
            } else {
                feedContainer.innerHTML = posts.map(post => uiManager.createPostCard(post)).join('');
                this.setupPostInteractions();
            }

            lucide.createIcons();
        } catch (error) {
            console.error('Error loading feed:', error);
            uiManager.showToast('Error', 'Failed to load posts', 'error');
        }
    }

    // Setup post interactions (like, comment, etc.)
    setupPostInteractions() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = e.currentTarget.dataset.postId;
                const isLiked = e.currentTarget.classList.contains('liked');
                
                try {
                    if (isLiked) {
                        await apiManager.unlikePost(postId);
                        e.currentTarget.classList.remove('liked');
                    } else {
                        await apiManager.likePost(postId);
                        e.currentTarget.classList.add('liked');
                    }
                } catch (error) {
                    console.error('Error toggling like:', error);
                    uiManager.showToast('Error', 'Failed to update like', 'error');
                }
            });
        });
    }

    // Load user card
    async loadUserCard() {
        try {
            if (!this.currentUser) return;

            const userCard = document.getElementById('user-card');
            const profile = await apiManager.getUserProfile(this.currentUser.id);
            
            userCard.innerHTML = `
                <div class="user-card-content">
                    <div class="user-card-header">
                        ${uiManager.createUserAvatar(this.currentUser, 'large')}
                        <div class="user-card-info">
                            <h3>${profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.email}</h3>
                            <p>${profile.email}</p>
                        </div>
                    </div>
                    
                    <div class="user-card-stats">
                        <div class="stat">
                            <span class="stat-number">${uiManager.formatNumber(profile.postsCount)}</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${uiManager.formatNumber(profile.followersCount)}</span>
                            <span class="stat-label">Followers</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${uiManager.formatNumber(profile.followingCount)}</span>
                            <span class="stat-label">Following</span>
                        </div>
                    </div>

                    <button class="btn-primary user-card-btn" onclick="app.switchTab('profile')">
                        View Profile
                    </button>
                </div>
            `;

            lucide.createIcons();
        } catch (error) {
            console.error('Error loading user card:', error);
        }
    }

    // Load suggestions
    async loadSuggestions() {
        try {
            const suggestionsList = document.getElementById('suggestions-list');
            const users = await apiManager.getUsers();
            
            // Filter out current user and limit to 3
            this.suggestions = users
                .filter(user => user.id !== this.currentUser.id)
                .slice(0, 3);

            suggestionsList.innerHTML = this.suggestions
                .map(user => uiManager.createUserSuggestion(user))
                .join('');

            // Setup follow buttons
            suggestionsList.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const userId = e.target.dataset.userId;
                    try {
                        await apiManager.followUser(userId);
                        e.target.textContent = 'Following';
                        e.target.disabled = true;
                        uiManager.showToast('Success', 'User followed successfully', 'success');
                    } catch (error) {
                        console.error('Error following user:', error);
                        uiManager.showToast('Error', 'Failed to follow user', 'error');
                    }
                });
            });

            lucide.createIcons();
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }

    // Load profile
    async loadProfile(userId) {
        try {
            const profileSection = document.getElementById('profile-section');
            profileSection.innerHTML = '<div class="loading-profile">Loading profile...</div>';

            const [profile, posts] = await Promise.all([
                apiManager.getUserProfile(userId),
                apiManager.getPosts(userId)
            ]);

            this.currentProfile = profile;

            const isOwnProfile = userId === this.currentUser.id;

            profileSection.innerHTML = `
                <div class="profile-content">
                    <div class="profile-header">
                        <div class="profile-avatar-large">
                            ${uiManager.createUserAvatar(profile, 'large')}
                        </div>
                        
                        <div class="profile-info">
                            <div class="profile-title">
                                <h1>${profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.email}</h1>
                                ${!isOwnProfile ? `
                                    <button class="btn-primary follow-profile-btn" data-user-id="${profile.id}">
                                        ${profile.isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                ` : ''}
                            </div>
                            
                            <div class="profile-stats">
                                <div class="profile-stat">
                                    <span class="stat-number">${uiManager.formatNumber(profile.postsCount)}</span>
                                    <span class="stat-label">Posts</span>
                                </div>
                                <div class="profile-stat">
                                    <span class="stat-number">${uiManager.formatNumber(profile.followersCount)}</span>
                                    <span class="stat-label">Followers</span>
                                </div>
                                <div class="profile-stat">
                                    <span class="stat-number">${uiManager.formatNumber(profile.followingCount)}</span>
                                    <span class="stat-label">Following</span>
                                </div>
                            </div>
                            
                            ${profile.bio ? `<p class="profile-bio">${profile.bio}</p>` : ''}
                        </div>
                    </div>

                    <div class="profile-posts">
                        <h2>Posts</h2>
                        ${posts.length === 0 ? `
                            <div class="empty-posts">
                                <div class="empty-icon">
                                    <i data-lucide="camera"></i>
                                </div>
                                <h3>No posts yet</h3>
                                <p>${isOwnProfile ? 'Share your first post!' : 'This user hasn\'t posted anything yet.'}</p>
                            </div>
                        ` : `
                            <div class="posts-grid">
                                ${posts.map(post => uiManager.createPostCard(post)).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;

            // Setup follow button for profile
            const followBtn = profileSection.querySelector('.follow-profile-btn');
            if (followBtn) {
                followBtn.addEventListener('click', async (e) => {
                    const userId = e.target.dataset.userId;
                    const isFollowing = e.target.textContent === 'Unfollow';
                    
                    try {
                        if (isFollowing) {
                            await apiManager.unfollowUser(userId);
                            e.target.textContent = 'Follow';
                        } else {
                            await apiManager.followUser(userId);
                            e.target.textContent = 'Unfollow';
                        }
                        uiManager.showToast('Success', `User ${isFollowing ? 'unfollowed' : 'followed'} successfully`, 'success');
                    } catch (error) {
                        console.error('Error toggling follow:', error);
                        uiManager.showToast('Error', 'Failed to update follow status', 'error');
                    }
                });
            }

            this.setupPostInteractions();
            lucide.createIcons();
        } catch (error) {
            console.error('Error loading profile:', error);
            uiManager.showToast('Error', 'Failed to load profile', 'error');
        }
    }

    // Setup search functionality
    setupSearch() {
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            const debouncedSearch = uiManager.debounce(this.handleSearch.bind(this), 300);
            userSearch.addEventListener('input', debouncedSearch);
        }

        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            const debouncedSearch = uiManager.debounce(this.handleSearch.bind(this), 300);
            globalSearch.addEventListener('input', debouncedSearch);
        }
    }

    // Handle search
    async handleSearch(e) {
        const query = e.target.value.trim();
        const resultsContainer = document.getElementById('search-results');
        
        if (!query) {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <i data-lucide="search"></i>
                    <p>Search for users to connect with</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        try {
            resultsContainer.innerHTML = '<div class="loading-search">Searching...</div>';
            
            const users = await apiManager.getUsers(query);
            this.searchResults = users.filter(user => user.id !== this.currentUser.id);

            if (this.searchResults.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="no-results">
                        <i data-lucide="search"></i>
                        <p>No users found</p>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <h3>Search Results</h3>
                    <div class="search-results-list">
                        ${this.searchResults.map(user => uiManager.createSearchResultItem(user)).join('')}
                    </div>
                `;

                // Setup click handlers for search results
                resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        const userId = e.currentTarget.dataset.userId;
                        this.switchTab('profile');
                        this.loadProfile(userId);
                        
                        // Clear search
                        e.target.closest('input').value = '';
                        this.handleSearch({ target: { value: '' } });
                    });
                });
            }

            lucide.createIcons();
        } catch (error) {
            console.error('Error searching users:', error);
            uiManager.showToast('Error', 'Search failed', 'error');
        }
    }

    // Setup upload modal
    setupUploadModal() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const uploadForm = document.getElementById('upload-form');
        const uploadPreview = document.getElementById('upload-preview');
        const previewImage = document.getElementById('preview-image');
        const uploadSubmit = document.getElementById('upload-submit');
        const uploadCancel = document.getElementById('upload-cancel');

        // File input handling
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Form submission
        uploadForm.addEventListener('submit', this.handleUploadSubmit.bind(this));

        // Cancel button
        uploadCancel.addEventListener('click', () => {
            uiManager.closeModal('upload-modal');
            this.resetUploadForm();
        });
    }

    // Handle file selection
    handleFileSelect(file) {
        const uploadArea = document.getElementById('upload-area');
        const uploadPreview = document.getElementById('upload-preview');
        const previewImage = document.getElementById('preview-image');
        const uploadSubmit = document.getElementById('upload-submit');

        // Validate file
        const errors = uiManager.validateFile(file);
        if (errors.length > 0) {
            uiManager.showToast('Error', errors.join(', '), 'error');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadArea.classList.add('hidden');
            uploadPreview.classList.remove('hidden');
            uploadSubmit.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Handle upload form submission
    async handleUploadSubmit(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('file-input');
        const caption = document.getElementById('caption').value;
        const uploadSubmit = document.getElementById('upload-submit');
        const uploadProgress = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        if (!fileInput.files[0]) {
            uiManager.showToast('Error', 'Please select a file', 'error');
            return;
        }

        try {
            uploadSubmit.disabled = true;
            uploadProgress.classList.remove('hidden');

            // Simulate upload progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress > 90) progress = 90;
                
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Uploading... ${Math.round(progress)}%`;
            }, 200);

            // Upload file
            const uploadResult = await apiManager.uploadFile(fileInput.files[0]);
            
            // Create post
            const post = await apiManager.createPost({
                image_url: uploadResult.url,
                caption: caption || null
            });

            // Complete progress
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressText.textContent = 'Upload complete!';

            // Close modal and refresh feed
            setTimeout(() => {
                uiManager.closeModal('upload-modal');
                this.resetUploadForm();
                this.loadFeed();
                uiManager.showToast('Success', 'Post created successfully!', 'success');
            }, 1000);

        } catch (error) {
            console.error('Error uploading post:', error);
            uiManager.showToast('Error', 'Failed to create post', 'error');
            uploadSubmit.disabled = false;
            uploadProgress.classList.add('hidden');
        }
    }

    // Reset upload form
    resetUploadForm() {
        const uploadForm = document.getElementById('upload-form');
        const uploadArea = document.getElementById('upload-area');
        const uploadPreview = document.getElementById('upload-preview');
        const uploadProgress = document.getElementById('upload-progress');
        const uploadSubmit = document.getElementById('upload-submit');

        uploadForm.reset();
        uploadArea.classList.remove('hidden');
        uploadPreview.classList.add('hidden');
        uploadProgress.classList.add('hidden');
        uploadSubmit.disabled = true;
    }
}

// Initialize the application
const app = new SocialApp();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
// In SocialApp.loadFeed or similar function in app.js
async loadFeed() {
    try {
        // ... other code
        const posts = await apiManager.getPosts();
        console.log("Fetched posts:", posts); // Inspect this
        posts.map(post => {
            // ...
            // The problematic line is likely within here, where post.user is expected
            this.uiManager.createPostCard(post, post.user, isLiked, commentsCount);
            // The UIManager.createUserAvatar is then called with post.user
        });
        // ...
    } catch (error) {
        console.error('Error loading feed:', error);
        this.uiManager.showToast('Failed to load feed.', 'error');
    }
}
