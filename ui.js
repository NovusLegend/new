// UI utility functions and components
class UIManager {
    constructor() {
        this.toastContainer = null;
        this.activeModals = new Set();
    }

    // Initialize UI components
    init() {
        this.toastContainer = document.getElementById('toast-container');
        this.initializeLucideIcons();
        this.setupEventListeners();
    }

    // Initialize Lucide icons
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Setup global event listeners
    setupEventListeners() {
        // Modal close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Modal close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    // Toast notifications
    showToast(title, message, type = 'success') {
        const toastId = Date.now().toString();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = `toast-${toastId}`;

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="uiManager.closeToast('${toastId}')">
                <i data-lucide="x"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);
        
        // Initialize icons for the new toast
        lucide.createIcons();

        // Auto close after duration
        setTimeout(() => {
            this.closeToast(toastId);
        }, CONFIG.TOAST_DURATION);

        return toastId;
    }

    closeToast(toastId) {
        const toast = document.getElementById(`toast-${toastId}`);
        if (toast) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.activeModals.add(modalId);
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalElement) {
        if (typeof modalElement === 'string') {
            modalElement = document.getElementById(modalElement);
        }
        
        if (modalElement) {
            modalElement.classList.add('hidden');
            this.activeModals.delete(modalElement.id);
            
            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }
    }

    closeAllModals() {
        this.activeModals.forEach(modalId => {
            this.closeModal(modalId);
        });
    }

    // Tab management
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Add active class to selected tab button
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }
    }

    // Loading states
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>${text}</p>
                </div>
            `;
        }
    }

    // Format time ago
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Format numbers (1000 -> 1K, etc.)
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Create user avatar element
    createUserAvatar(user, size = 'medium') {
        const sizeClasses = {
            small: 'w-8 h-8',
            medium: 'w-12 h-12',
            large: 'w-16 h-16'
        };

        const avatarUrl = user.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
        const displayName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.email;

        return `
            <div class="profile-avatar ${sizeClasses[size]}">
                <img src="${avatarUrl}" alt="${displayName}" class="w-full h-full object-cover rounded-full">
            </div>
        `;
    }

    // Create post card element
    createPostCard(post) {
        const user = post.user;
        const timeAgo = this.formatTimeAgo(post.created_at);
        const likesCount = this.formatNumber(post.likesCount || 0);
        const commentsCount = this.formatNumber(post.commentsCount || 0);

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-user-info">
                        ${this.createUserAvatar(user, 'medium')}
                        <div class="post-user-details">
                            <h4 class="post-username">${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}</h4>
                            <p class="post-time">${timeAgo}</p>
                        </div>
                    </div>
                    <button class="post-menu-btn">
                        <i data-lucide="more-horizontal"></i>
                    </button>
                </div>
                
                <div class="post-content">
                    <img src="${post.image_url}" alt="Post image" class="post-image">
                </div>
                
                <div class="post-actions">
                    <div class="post-action-buttons">
                        <button class="post-action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                            <i data-lucide="heart"></i>
                        </button>
                        <button class="post-action-btn comment-btn" data-post-id="${post.id}">
                            <i data-lucide="message-circle"></i>
                        </button>
                        <button class="post-action-btn share-btn" data-post-id="${post.id}">
                            <i data-lucide="send"></i>
                        </button>
                    </div>
                    <button class="post-action-btn bookmark-btn" data-post-id="${post.id}">
                        <i data-lucide="bookmark"></i>
                    </button>
                </div>
                
                <div class="post-stats">
                    <p class="post-likes">${likesCount} likes</p>
                </div>
                
                ${post.caption ? `
                    <div class="post-caption">
                        <span class="post-caption-username">${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}</span>
                        ${post.caption}
                    </div>
                ` : ''}
                
                ${post.commentsCount > 0 ? `
                    <button class="post-comments-link" data-post-id="${post.id}">
                        View all ${commentsCount} comments
                    </button>
                ` : ''}
            </div>
        `;
    }

    // Create user suggestion card
    createUserSuggestion(user) {
        return `
            <div class="suggestion-item" data-user-id="${user.id}">
                <div class="suggestion-user-info">
                    ${this.createUserAvatar(user, 'small')}
                    <div class="suggestion-user-details">
                        <h5 class="suggestion-username">${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}</h5>
                        <p class="suggestion-followers">${this.formatNumber(user.followersCount || 0)} followers</p>
                    </div>
                </div>
                <button class="follow-btn" data-user-id="${user.id}">Follow</button>
            </div>
        `;
    }

    // Create search result item
    createSearchResultItem(user) {
        return `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="search-result-info">
                    ${this.createUserAvatar(user, 'medium')}
                    <div class="search-result-details">
                        <h4 class="search-result-username">${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}</h4>
                        <p class="search-result-email">${user.email}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Animate elements
    animateIn(element, animationClass = 'fadeIn') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.style.animation = `${animationClass} 0.3s ease forwards`;
        }
    }

    animateOut(element, animationClass = 'fadeOut') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.style.animation = `${animationClass} 0.3s ease forwards`;
        }
    }

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Validate file
    validateFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return errors;
        }

        if (file.size > CONFIG.MAX_FILE_SIZE) {
            errors.push(`File size must be less than ${this.formatFileSize(CONFIG.MAX_FILE_SIZE)}`);
        }

        if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
            errors.push('Only image files are allowed');
        }

        return errors;
    }
}

// Create global UI manager instance
const uiManager = new UIManager();