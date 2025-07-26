// Configuration for the application
const CONFIG = {
    // Supabase configuration - replace with your actual Supabase URL and anon key
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    
    // API endpoints
    API_BASE_URL: window.location.origin,
    
    // File upload limits
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    
    // UI configuration
    POSTS_PER_PAGE: 10,
    MESSAGES_PER_PAGE: 50,
    TOAST_DURATION: 5000,
    
    // Brand colors
    BRAND_COLORS: {
        green: '#00C896',
        darkGreen: '#00A67C',
        light: '#F8FFFE',
        black: '#1A1A1A'
    }
};

// Initialize Supabase client
let supabase;

function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not loaded');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSupabase);