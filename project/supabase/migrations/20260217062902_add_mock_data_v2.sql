/*
  # Add Mock Data for EduTrack Demo

  1. Sample Data
    - Admin, Teachers, Students
    - Subjects and schedules
    - Attendance records
    - Curriculum topics
    - Achievements

  2. Notes
    - All data is for demo purposes
    - Realistic patterns for testing
*/

-- Insert Admin
INSERT INTO profiles (id, full_name, role, department) VALUES
('00000000-0000-0000-0000-000000000001', 'Dr. Sarah Admin', 'admin', 'Administration')
ON CONFLICT (id) DO NOTHING;

-- Insert Teachers
INSERT INTO profiles (id, full_name, role, department) VALUES
('10000000-0000-0000-0000-000000000001', 'Prof. John Mitchell', 'teacher', 'Computer Science'),
('10000000-0000-0000-0000-000000000002', 'Dr. Emily Chen', 'teacher', 'Computer Science'),
('10000000-0000-0000-0000-000000000003', 'Prof. David Kumar', 'teacher', 'Computer Science')
ON CONFLICT (id) DO NOTHING;

-- Insert Students
INSERT INTO profiles (id, full_name, role, department, semester) VALUES
('20000000-0000-0000-0000-000000000001', 'Alex Johnson', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000002', 'Maria Garcia', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000003', 'James Wilson', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000004', 'Priya Patel', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000005', 'Michael Brown', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000006', 'Lisa Anderson', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000007', 'David Lee', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000008', 'Emma Martinez', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000009', 'Ryan Taylor', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000010', 'Sofia Rodriguez', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000011', 'Kevin White', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000012', 'Olivia Harris', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000013', 'Daniel Kim', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000014', 'Ava Thompson', 'student', 'Computer Science', 5),
('20000000-0000-0000-0000-000000000015', 'Ethan Davis', 'student', 'Computer Science', 5)
ON CONFLICT (id) DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (id, name, code, department, semester, teacher_id, total_classes) VALUES
('30000000-0000-0000-0000-000000000001', 'Artificial Intelligence & Machine Learning', 'CS501', 'Computer Science', 5, '10000000-0000-0000-0000-000000000001', 45),
('30000000-0000-0000-0000-000000000002', 'Advanced Data Structures', 'CS502', 'Computer Science', 5, '10000000-0000-0000-0000-000000000002', 40),
('30000000-0000-0000-0000-000000000003', 'Web Development', 'CS503', 'Computer Science', 5, '10000000-0000-0000-0000-000000000003', 35),
('30000000-0000-0000-0000-000000000004', 'Database Management Systems', 'CS504', 'Computer Science', 5, '10000000-0000-0000-0000-000000000001', 38),
('30000000-0000-0000-0000-000000000005', 'Operating Systems', 'CS505', 'Computer Science', 5, '10000000-0000-0000-0000-000000000002', 42),
('30000000-0000-0000-0000-000000000006', 'Computer Networks', 'CS506', 'Computer Science', 5, '10000000-0000-0000-0000-000000000003', 36)
ON CONFLICT (id) DO NOTHING;

-- Insert Class Schedule
INSERT INTO class_schedule (subject_id, day_of_week, start_time, end_time, room_number) VALUES
('30000000-0000-0000-0000-000000000001', 1, '09:00', '10:30', 'A-301'),
('30000000-0000-0000-0000-000000000001', 3, '09:00', '10:30', 'A-301'),
('30000000-0000-0000-0000-000000000001', 5, '09:00', '10:30', 'A-301'),
('30000000-0000-0000-0000-000000000002', 1, '11:00', '12:30', 'B-205'),
('30000000-0000-0000-0000-000000000002', 3, '11:00', '12:30', 'B-205'),
('30000000-0000-0000-0000-000000000002', 5, '11:00', '12:30', 'B-205'),
('30000000-0000-0000-0000-000000000003', 2, '09:00', '10:30', 'C-102'),
('30000000-0000-0000-0000-000000000003', 4, '09:00', '10:30', 'C-102'),
('30000000-0000-0000-0000-000000000003', 5, '14:00', '15:30', 'C-102'),
('30000000-0000-0000-0000-000000000004', 2, '11:00', '12:30', 'A-401'),
('30000000-0000-0000-0000-000000000004', 4, '11:00', '12:30', 'A-401'),
('30000000-0000-0000-0000-000000000004', 5, '11:00', '12:30', 'A-401'),
('30000000-0000-0000-0000-000000000005', 1, '14:00', '15:30', 'B-301'),
('30000000-0000-0000-0000-000000000005', 3, '14:00', '15:30', 'B-301'),
('30000000-0000-0000-0000-000000000005', 4, '14:00', '15:30', 'B-301'),
('30000000-0000-0000-0000-000000000006', 2, '14:00', '15:30', 'C-205'),
('30000000-0000-0000-0000-000000000006', 3, '16:00', '17:30', 'C-205'),
('30000000-0000-0000-0000-000000000006', 5, '16:00', '17:30', 'C-205');

-- Insert Curriculum Topics
INSERT INTO curriculum_topics (subject_id, title, description, order_number, estimated_hours, status) VALUES
('30000000-0000-0000-0000-000000000001', 'Introduction to AI', 'History, applications, and fundamentals of AI', 1, 4, 'completed'),
('30000000-0000-0000-0000-000000000001', 'Search Algorithms', 'BFS, DFS, A*, heuristic search', 2, 6, 'completed'),
('30000000-0000-0000-0000-000000000001', 'Machine Learning Basics', 'Supervised vs unsupervised learning', 3, 5, 'completed'),
('30000000-0000-0000-0000-000000000001', 'Neural Networks', 'Perceptrons, backpropagation, deep learning', 4, 8, 'in_progress'),
('30000000-0000-0000-0000-000000000001', 'Computer Vision', 'Image processing, CNNs, object detection', 5, 7, 'pending'),
('30000000-0000-0000-0000-000000000001', 'Natural Language Processing', 'Text processing, transformers, LLMs', 6, 8, 'pending'),
('30000000-0000-0000-0000-000000000002', 'Advanced Trees', 'AVL, Red-Black, B-Trees', 1, 6, 'completed'),
('30000000-0000-0000-0000-000000000002', 'Graph Algorithms', 'Dijkstra, Bellman-Ford, Floyd-Warshall', 2, 7, 'completed'),
('30000000-0000-0000-0000-000000000002', 'Dynamic Programming', 'Memoization, tabulation, optimization', 3, 8, 'in_progress'),
('30000000-0000-0000-0000-000000000002', 'String Algorithms', 'KMP, Rabin-Karp, suffix trees', 4, 5, 'pending'),
('30000000-0000-0000-0000-000000000002', 'Advanced Sorting', 'Radix, bucket, external sorting', 5, 4, 'pending'),
('30000000-0000-0000-0000-000000000003', 'Modern JavaScript', 'ES6+, async/await, modules', 1, 5, 'completed'),
('30000000-0000-0000-0000-000000000003', 'React Fundamentals', 'Components, hooks, state management', 2, 8, 'completed'),
('30000000-0000-0000-0000-000000000003', 'Backend with Node.js', 'Express, REST APIs, middleware', 3, 7, 'in_progress'),
('30000000-0000-0000-0000-000000000003', 'Database Integration', 'SQL, ORMs, transactions', 4, 6, 'pending'),
('30000000-0000-0000-0000-000000000003', 'Deployment & DevOps', 'Docker, CI/CD, cloud platforms', 5, 5, 'pending'),
('30000000-0000-0000-0000-000000000004', 'Relational Model', 'Tables, keys, normalization', 1, 5, 'completed'),
('30000000-0000-0000-0000-000000000004', 'SQL Advanced', 'Joins, subqueries, window functions', 2, 6, 'completed'),
('30000000-0000-0000-0000-000000000004', 'Transaction Management', 'ACID, concurrency control', 3, 7, 'in_progress'),
('30000000-0000-0000-0000-000000000004', 'Query Optimization', 'Indexes, execution plans', 4, 6, 'pending'),
('30000000-0000-0000-0000-000000000004', 'NoSQL Databases', 'Document stores, key-value, graph DBs', 5, 5, 'pending'),
('30000000-0000-0000-0000-000000000005', 'Process Management', 'Scheduling, synchronization', 1, 6, 'completed'),
('30000000-0000-0000-0000-000000000005', 'Memory Management', 'Paging, segmentation, virtual memory', 2, 7, 'completed'),
('30000000-0000-0000-0000-000000000005', 'File Systems', 'Directory structure, allocation methods', 3, 5, 'in_progress'),
('30000000-0000-0000-0000-000000000005', 'Deadlocks', 'Detection, prevention, recovery', 4, 5, 'pending'),
('30000000-0000-0000-0000-000000000005', 'I/O Systems', 'Device drivers, buffering', 5, 4, 'pending'),
('30000000-0000-0000-0000-000000000006', 'Network Layers', 'OSI model, TCP/IP stack', 1, 5, 'completed'),
('30000000-0000-0000-0000-000000000006', 'Routing Protocols', 'RIP, OSPF, BGP', 2, 6, 'completed'),
('30000000-0000-0000-0000-000000000006', 'Transport Layer', 'TCP, UDP, flow control', 3, 6, 'in_progress'),
('30000000-0000-0000-0000-000000000006', 'Network Security', 'Encryption, firewalls, VPNs', 4, 7, 'pending');

-- Insert Achievements
INSERT INTO achievements (id, name, description, icon, criteria) VALUES
('40000000-0000-0000-0000-000000000001', 'Perfect Week', 'Attended all classes for a week', 'Trophy', '100% attendance for 5 consecutive days'),
('40000000-0000-0000-0000-000000000002', 'Early Bird', 'Never late for 2 weeks straight', 'Sunrise', 'No late marks for 10 consecutive days'),
('40000000-0000-0000-0000-000000000003', 'Dedicated Learner', '90%+ attendance this semester', 'GraduationCap', 'Maintain 90% or higher attendance'),
('40000000-0000-0000-0000-000000000004', 'Topic Master', 'Completed 10 curriculum topics', 'BookOpen', 'Complete 10 topics with 100% progress'),
('40000000-0000-0000-0000-000000000005', 'Consistent Scholar', '30 day attendance streak', 'Flame', 'Attend classes for 30 consecutive days'),
('40000000-0000-0000-0000-000000000006', 'Quick Learner', 'First to complete a module', 'Zap', 'Be the first to complete any curriculum module')
ON CONFLICT (id) DO NOTHING;

-- Insert sample attendance records
DO $$
DECLARE
  v_student_id uuid;
  v_subject_id uuid;
  v_class_date date;
  v_teacher_id uuid;
BEGIN
  SELECT id INTO v_teacher_id FROM profiles WHERE role = 'teacher' LIMIT 1;
  
  FOR v_student_id IN SELECT id FROM profiles WHERE role = 'student' LOOP
    FOR v_subject_id IN SELECT id FROM subjects LOOP
      FOR i IN 0..13 LOOP
        v_class_date := CURRENT_DATE - i;
        IF EXTRACT(DOW FROM v_class_date) NOT IN (0, 6) THEN
          INSERT INTO attendance_records (student_id, subject_id, class_date, status, marked_by)
          VALUES (
            v_student_id,
            v_subject_id,
            v_class_date,
            CASE 
              WHEN random() < 0.85 THEN 'present'
              WHEN random() < 0.92 THEN 'late'
              ELSE 'absent'
            END,
            v_teacher_id
          )
          ON CONFLICT (student_id, subject_id, class_date) DO NOTHING;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Award achievements
INSERT INTO student_achievements (student_id, achievement_id) VALUES
('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002')
ON CONFLICT (student_id, achievement_id) DO NOTHING;