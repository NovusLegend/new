// Authentication module using Supabase
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoading = true;
        this.callbacks = [];
    }

    // Subscribe to auth state changes
    onAuthStateChange(callback) {
        this.callbacks.push(callback);
        
        // Call immediately with current state
        callback(this.currentUser, this.isLoading);
        
        // Return unsubscribe function
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    // Notify all subscribers of auth state changes
    notifyStateChange() {
        this.callbacks.forEach(callback => {
            callback(this.currentUser, this.isLoading);
        });
    }

    // Initialize auth state
    async initialize() {
        try {
            this.isLoading = true;
            this.notifyStateChange();

            if (!supabase) {
                throw new Error('Supabase not initialized');
            }

            // Get current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error getting session:', error);
                this.currentUser = null;
            } else if (session) {
                this.currentUser = session.user;
                await this.upsertUser(session.user);
            } else {
                this.currentUser = null;
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (session) {
                    this.currentUser = session.user;
                    await this.upsertUser(session.user);
                } else {
                    this.currentUser = null;
                }
                this.notifyStateChange();
            });

        } catch (error) {
            console.error('Error initializing auth:', error);
            this.currentUser = null;
        } finally {
            this.isLoading = false;
            this.notifyStateChange();
        }
    }

    // Create or update user in database
    async upsertUser(user) {
        try {
            const userData = {
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || null,
                last_name: user.user_metadata?.last_name || null,
                profile_image_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('users')
                .upsert(userData, { 
                    onConflict: 'id',
                    ignoreDuplicates: false 
                });

            if (error) {
                console.error('Error upserting user:', error);
            }
        } catch (error) {
            console.error('Error in upsertUser:', error);
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign up with email and password
    async signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                throw error;
            }

            this.currentUser = null;
            this.notifyStateChange();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Get auth token
    async getToken() {
        try {
            if (!this.currentUser) {
                return null;
            }

            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                throw error;
            }

            return session?.access_token || null;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }
}

// Create global auth manager instance
const authManager = new AuthManager();