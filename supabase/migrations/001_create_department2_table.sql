-- Create department2 table
CREATE TABLE department2 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(50) NOT NULL,
    manager_email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial data
INSERT INTO department2 (id, name, manager_name, manager_email) VALUES
(1, '인사기획팀', '김인사', 'carefree0101@naver.com'),
(2, '총무팀', '이총무', 'carefree0101@naver.com'),
(3, '조직문화팀', '강조직', 'carefree0101@naver.com'),
(4, '마케팅팀', '최마케', 'carefree0101@naver.com'),
(5, '스포츠운영팀', '박스포', 'carefree0101@naver.com');

-- Enable RLS
ALTER TABLE department2 ENABLE ROW LEVEL SECURITY;

-- Create policies for department2 table
CREATE POLICY "department2_select_policy" ON department2
FOR SELECT USING (true);

CREATE POLICY "department2_insert_policy" ON department2
FOR INSERT WITH CHECK (true);

CREATE POLICY "department2_update_policy" ON department2
FOR UPDATE USING (true);

CREATE POLICY "department2_delete_policy" ON department2
FOR DELETE USING (true); 