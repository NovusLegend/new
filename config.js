// Configuration for the application
const CONFIG = {
    // Supabase configuration - replace with your actual Supabase URL and anon key
    SUPABASE_URL: 'https://ccualarmtcpjgbmahsvl.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdWFsYXJtdGNwamdibWFoc3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTYzMTAsImV4cCI6MjA2OTEzMjMxMH0.qLfA8Cl-jF9OhGwsJbRlkFYbk7tg-1NsZ5FGt4EYO9Y',
    
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
