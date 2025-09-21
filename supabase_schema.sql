-- OMR System Database Schema for Supabase
-- Code4Edtech Hackathon 2025 - Innomatics Research Labs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    answer_key TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    exam_set VARCHAR(1) DEFAULT 'A' CHECK (exam_set IN ('A', 'B')),
    subject_mapping JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- OMR Results table
CREATE TABLE IF NOT EXISTS omr_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    student_id VARCHAR(100),
    student_responses JSONB NOT NULL DEFAULT '{}',
    confidence_scores JSONB NOT NULL DEFAULT '{}',
    quality_metrics JSONB NOT NULL DEFAULT '{}',
    detected_set VARCHAR(1) NOT NULL CHECK (detected_set IN ('A', 'B')),
    subject_scores JSONB NOT NULL DEFAULT '{}',
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    processing_time DECIMAL(8,3) NOT NULL DEFAULT 0,
    image_path TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing Sessions table
CREATE TABLE IF NOT EXISTS processing_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    total_images INTEGER NOT NULL DEFAULT 0,
    processed_images INTEGER NOT NULL DEFAULT 0,
    successful_images INTEGER NOT NULL DEFAULT 0,
    failed_images INTEGER NOT NULL DEFAULT 0,
    average_quality_score DECIMAL(3,2) DEFAULT 0,
    total_processing_time DECIMAL(10,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- System Analytics table
CREATE TABLE IF NOT EXISTS system_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_data JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_omr_results_exam_id ON omr_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_omr_results_processed_at ON omr_results(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_omr_results_total_score ON omr_results(total_score);
CREATE INDEX IF NOT EXISTS idx_processing_sessions_exam_id ON processing_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_processing_sessions_status ON processing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_system_analytics_metric_name ON system_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_analytics_recorded_at ON system_analytics(recorded_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE omr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for exams table
CREATE POLICY "Users can view all exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Users can insert exams" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own exams" ON exams FOR UPDATE USING (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "Users can delete their own exams" ON exams FOR DELETE USING (created_by = auth.uid() OR created_by IS NULL);

-- Policies for omr_results table
CREATE POLICY "Users can view all OMR results" ON omr_results FOR SELECT USING (true);
CREATE POLICY "Users can insert OMR results" ON omr_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update OMR results" ON omr_results FOR UPDATE USING (true);
CREATE POLICY "Users can delete OMR results" ON omr_results FOR DELETE USING (true);

-- Policies for processing_sessions table
CREATE POLICY "Users can view all processing sessions" ON processing_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert processing sessions" ON processing_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update processing sessions" ON processing_sessions FOR UPDATE USING (true);
CREATE POLICY "Users can delete processing sessions" ON processing_sessions FOR DELETE USING (true);

-- Policies for system_analytics table
CREATE POLICY "Users can view system analytics" ON system_analytics FOR SELECT USING (true);
CREATE POLICY "Users can insert system analytics" ON system_analytics FOR INSERT WITH CHECK (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for exams table
CREATE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate exam statistics
CREATE OR REPLACE FUNCTION get_exam_statistics(exam_uuid UUID)
RETURNS TABLE (
    total_submissions INTEGER,
    average_score DECIMAL,
    highest_score DECIMAL,
    lowest_score DECIMAL,
    pass_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_submissions,
        COALESCE(AVG(total_score), 0)::DECIMAL as average_score,
        COALESCE(MAX(total_score), 0)::DECIMAL as highest_score,
        COALESCE(MIN(total_score), 0)::DECIMAL as lowest_score,
        COALESCE(
            (COUNT(*) FILTER (WHERE total_score >= 60.0)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
            0
        )::DECIMAL as pass_rate
    FROM omr_results 
    WHERE exam_id = exam_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get subject-wise performance
CREATE OR REPLACE FUNCTION get_subject_performance(exam_uuid UUID)
RETURNS TABLE (
    subject_name TEXT,
    average_score DECIMAL,
    total_questions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        key as subject_name,
        AVG((value->>'percentage')::DECIMAL) as average_score,
        (value->>'total')::INTEGER as total_questions
    FROM omr_results r
    CROSS JOIN LATERAL jsonb_each(r.subject_scores)
    WHERE r.exam_id = exam_uuid
    GROUP BY key, (value->>'total')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for Code4Edtech Hackathon
INSERT INTO exams (name, subject, total_questions, answer_key, status, exam_set, subject_mapping) VALUES 
(
    'Code4Edtech Sample Exam - Set A',
    'Multi-Subject Assessment',
    100,
    ARRAY[
        -- Python (1-20)
        'A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','A','B','C','D','A',
        -- EDA (21-40)  
        'B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A',
        -- SQL (41-60)
        'C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B',
        -- Power BI (61-80)
        'D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C',
        -- Statistics (81-100)
        'A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D'
    ],
    'active',
    'A',
    '{"Python": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], "EDA": [21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40], "SQL": [41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60], "Power BI": [61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80], "Statistics": [81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]}'::jsonb
),
(
    'Code4Edtech Sample Exam - Set B',
    'Multi-Subject Assessment',
    100,
    ARRAY[
        -- Python (1-20) - Different answers for Set B
        'B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','B','C','D','A','B',
        -- EDA (21-40)
        'C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B',
        -- SQL (41-60)
        'D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C',
        -- Power BI (61-80)
        'A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D',
        -- Statistics (81-100)
        'B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A'
    ],
    'active',
    'B',
    '{"Python": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], "EDA": [21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40], "SQL": [41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60], "Power BI": [61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80], "Statistics": [81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]}'::jsonb
);

-- Insert sample analytics data
INSERT INTO system_analytics (metric_name, metric_value, metric_data) VALUES
('daily_processing_count', 45, '{"date": "2025-09-21", "peak_hour": 14}'),
('average_accuracy', 95.8, '{"confidence_threshold": 0.7}'),
('system_uptime', 99.9, '{"last_downtime": "2025-09-20T10:30:00Z"}');

-- Comments for documentation
COMMENT ON TABLE exams IS 'Stores exam configurations including answer keys and subject mappings';
COMMENT ON TABLE omr_results IS 'Stores individual OMR processing results with detailed scoring';
COMMENT ON TABLE processing_sessions IS 'Tracks batch processing sessions with statistics';
COMMENT ON TABLE system_analytics IS 'Stores system performance and usage metrics';

COMMENT ON COLUMN exams.subject_mapping IS 'JSON mapping of subjects to question number ranges';
COMMENT ON COLUMN omr_results.student_responses IS 'JSON object mapping question numbers to selected answers';
COMMENT ON COLUMN omr_results.confidence_scores IS 'JSON object mapping question numbers to confidence scores';
COMMENT ON COLUMN omr_results.quality_metrics IS 'JSON object containing image quality and processing metrics';
COMMENT ON COLUMN omr_results.subject_scores IS 'JSON object containing per-subject scoring details';
