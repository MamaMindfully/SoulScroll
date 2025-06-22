-- Database indexes for optimal query performance
-- Run these after deploying the schema

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Journal entries indexes
CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_journal_emotion_score ON journal_entries(emotion_score) WHERE emotion_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_themes ON journal_entries USING gin(themes) WHERE themes IS NOT NULL;

-- Emotional insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON emotional_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON emotional_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_user_period ON emotional_insights(user_id, period);
CREATE INDEX IF NOT EXISTS idx_insights_avg_mood ON emotional_insights(average_mood) WHERE average_mood IS NOT NULL;

-- Daily prompts indexes
CREATE INDEX IF NOT EXISTS idx_prompts_date ON daily_prompts(date);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON daily_prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_premium ON daily_prompts(is_premium);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Voice entries indexes
CREATE INDEX IF NOT EXISTS idx_voice_entry_id ON voice_entries(entry_id);
CREATE INDEX IF NOT EXISTS idx_voice_created_at ON voice_entries(created_at);

-- Community moods indexes
CREATE INDEX IF NOT EXISTS idx_community_user_id ON community_moods(user_id);
CREATE INDEX IF NOT EXISTS idx_community_created_at ON community_moods(created_at);
CREATE INDEX IF NOT EXISTS idx_community_location ON community_moods(location) WHERE location IS NOT NULL;

-- Health data indexes
CREATE INDEX IF NOT EXISTS idx_health_user_id ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_date ON health_data(date);
CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_data(user_id, date);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON user_achievements(earned_at);

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_active ON push_subscriptions(is_active);

-- Reflection letters indexes
CREATE INDEX IF NOT EXISTS idx_letters_user_id ON reflection_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_letters_created_at ON reflection_letters(created_at);
CREATE INDEX IF NOT EXISTS idx_letters_type ON reflection_letters(letter_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_journal_user_mood_date ON journal_entries(user_id, mood, created_at) WHERE mood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insights_user_avg_mood ON emotional_insights(user_id, average_mood) WHERE average_mood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, status) WHERE status IN ('active', 'trialing');

-- Full-text search indexes for journal content
CREATE INDEX IF NOT EXISTS idx_journal_content_fts ON journal_entries USING gin(to_tsvector('english', content));

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_ai_response ON journal_entries(user_id) WHERE ai_response IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_high_emotion ON journal_entries(user_id, emotion_score) WHERE emotion_score > 8;
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(id) WHERE premium_status = true;

-- Comments explaining index usage
/*
Index Usage Guide:

1. idx_journal_user_date: Optimizes queries like "get user's entries from last 30 days"
2. idx_journal_emotion_score: Optimizes filtering by emotion intensity
3. idx_insights_user_period: Optimizes emotional insights for specific time periods
4. idx_subscriptions_period_end: Optimizes finding expiring subscriptions
5. idx_journal_content_fts: Enables full-text search across journal content
6. idx_journal_high_emotion: Optimizes finding high-intensity emotional entries
7. idx_users_premium: Optimizes premium user queries

Query Examples:
- SELECT * FROM journal_entries WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC
- SELECT * FROM emotional_insights WHERE user_id = ? AND period = 'weekly'
- SELECT * FROM journal_entries WHERE emotion_score > 8 AND user_id = ?
- SELECT * FROM subscriptions WHERE status = 'active' AND current_period_end < NOW()
*/