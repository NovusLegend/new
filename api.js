// API module for making requests to Supabase
class ApiManager {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    // Generic API request method
    async request(method, endpoint, data = null, options = {}) {
        try {
            const token = await authManager.getToken();
            
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers
                }
            };

            if (data && method !== 'GET') {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${response.status}: ${errorData.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // Supabase direct query methods
    async query(table, options = {}) {
        try {
            let query = supabase.from(table).select(options.select || '*');
            
            if (options.eq) {
                Object.entries(options.eq).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }
            
            if (options.order) {
                query = query.order(options.order.column, { ascending: options.order.ascending });
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            if (options.range) {
                query = query.range(options.range.from, options.range.to);
            }

            const { data, error } = await query;
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`Query Error [${table}]:`, error);
            throw error;
        }
    }

    async insert(table, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .insert(data)
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return result;
        } catch (error) {
            console.error(`Insert Error [${table}]:`, error);
            throw error;
        }
    }

    async update(table, id, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return result;
        } catch (error) {
            console.error(`Update Error [${table}]:`, error);
            throw error;
        }
    }

    async delete(table, id) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`Delete Error [${table}]:`, error);
            throw error;
        }
    }

    // Posts API
    async getPosts(userId = null) {
        try {
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    user:users(id, email, first_name, last_name, profile_image_url),
                    likes(user_id),
                    comments(count)
                `)
                .order('created_at', { ascending: false });
            
            if (userId) {
                query = query.eq('user_id', userId);
            }
            
            const { data, error } = await query;
            
            if (error) {
                throw error;
            }
            
            return data.map(post => ({
                ...post,
                likesCount: post.likes?.length || 0,
                isLiked: post.likes?.some(like => like.user_id === authManager.getCurrentUser()?.id) || false,
                commentsCount: post.comments?.[0]?.count || 0
            }));
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    }

    async createPost(postData) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert({
                    ...postData,
                    user_id: authManager.getCurrentUser()?.id
                })
                .select(`
                    *,
                    user:users(id, email, first_name, last_name, profile_image_url)
                `)
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    async likePost(postId) {
        try {
            const userId = authManager.getCurrentUser()?.id;
            
            const { error } = await supabase
                .from('likes')
                .insert({ post_id: postId, user_id: userId });
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    }

    async unlikePost(postId) {
        try {
            const userId = authManager.getCurrentUser()?.id;
            
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error('Error unliking post:', error);
            throw error;
        }
    }

    // Users API
    async getUsers(search = '') {
        try {
            let query = supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (search) {
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
            }
            
            const { data, error } = await query;
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        try {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (userError) {
                throw userError;
            }

            // Get posts count
            const { count: postsCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Get followers count
            const { count: followersCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId);

            // Get following count
            const { count: followingCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId);

            // Check if current user follows this user
            let isFollowing = false;
            const currentUserId = authManager.getCurrentUser()?.id;
            if (currentUserId && currentUserId !== userId) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('*')
                    .eq('follower_id', currentUserId)
                    .eq('following_id', userId)
                    .single();
                
                isFollowing = !!followData;
            }

            return {
                ...user,
                postsCount: postsCount || 0,
                followersCount: followersCount || 0,
                followingCount: followingCount || 0,
                isFollowing
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    async followUser(userId) {
        try {
            const currentUserId = authManager.getCurrentUser()?.id;
            
            const { error } = await supabase
                .from('follows')
                .insert({ follower_id: currentUserId, following_id: userId });
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    }

    async unfollowUser(userId) {
        try {
            const currentUserId = authManager.getCurrentUser()?.id;
            
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUserId)
                .eq('following_id', userId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    }

    // Stories API
    async getStories() {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select(`
                    *,
                    user:users(id, email, first_name, last_name, profile_image_url)
                `)
                .gte('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching stories:', error);
            throw error;
        }
    }

    // File upload
    async uploadFile(file) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            if (file.size > CONFIG.MAX_FILE_SIZE) {
                throw new Error('File size exceeds 5MB limit');
            }

            if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { data, error } = await supabase.storage
                .from('posts')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath);

            return {
                url: publicUrl,
                path: filePath
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
}

// Create global API manager instance
const apiManager = new ApiManager();