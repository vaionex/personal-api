-- Example seed data — customize with your own info
-- Run this after schema.sql

-- Bio
INSERT INTO knowledge (category, key, value, priority) VALUES
('bio', 'Name', 'Your Name', 10),
('bio', 'Role', 'Your title / what you do', 10),
('bio', 'Location', 'Your timezone or region', 5),
('bio', 'Background', 'Brief background — education, experience, focus areas', 8);

-- Projects
INSERT INTO knowledge (category, key, value, context, priority) VALUES
('project', 'Project A', 'One-line description', 'Tech stack, deployment, status', 8),
('project', 'Project B', 'One-line description', 'Tech stack, deployment, status', 7);

-- Preferences
INSERT INTO knowledge (category, key, value, priority) VALUES
('preference', 'Tech stack', 'Your preferred tools and frameworks', 9),
('preference', 'Communication', 'How you prefer to communicate (async, meetings, etc.)', 8),
('preference', 'Timezone', 'Your working hours and timezone', 6);

-- Stances (opinions the AI should convey)
INSERT INTO knowledge (category, key, value, priority) VALUES
('stance', 'Example topic', 'Your opinion on this topic', 7);

-- Boundaries (things you don't do)
INSERT INTO knowledge (category, key, value, priority) VALUES
('boundary', 'No unpaid consulting', 'I don''t do free "pick your brain" calls', 9),
('boundary', 'Not hiring', 'I''m not looking for employment', 8);

-- FAQ
INSERT INTO knowledge (category, key, value, priority) VALUES
('faq', 'Available for freelance?', 'Your standard answer about availability', 8),
('faq', 'How to collaborate?', 'Your process for working with people', 7);

-- Example event types
INSERT INTO event_types (slug, name, description, duration_minutes, buffer_minutes, color) VALUES
('quick-chat', 'Quick Chat', 'A short 15-minute intro call', 15, 5, '#2563eb'),
('consultation', 'Consultation', '30-minute consultation for projects or technical questions', 30, 10, '#7c3aed'),
('deep-dive', 'Deep Dive', '60-minute in-depth session for complex topics', 60, 15, '#059669');

-- Example availability: Mon-Fri 9am-5pm
INSERT INTO scheduling_rules (day_of_week, start_time, end_time, available) VALUES
(1, '09:00', '17:00', true),  -- Monday
(2, '09:00', '17:00', true),  -- Tuesday
(3, '09:00', '17:00', true),  -- Wednesday
(4, '09:00', '17:00', true),  -- Thursday
(5, '09:00', '12:00', true);  -- Friday (mornings only)

-- Auto-response templates
INSERT INTO templates (trigger_pattern, response_template, auto_send) VALUES
('recruiter_outreach', 'Thanks for reaching out! I''m not looking for employment at the moment. Best of luck with the search!', true),
('vague_collaboration', 'I appreciate the interest! If you have something specific in mind, feel free to share details and I''ll take a look.', true);

-- Topic routing rules
INSERT INTO topic_routes (topic, description, event_type_slug, auto_qualify, keywords, response_hint) VALUES
('technical', 'Technical consulting and architecture', 'consultation', false, '["technical", "architecture", "code", "engineering", "API", "integration", "bug"]', 'Route to a technical consultation. Ask about their tech stack and specific problem.'),
('partnership', 'Business partnerships and collaborations', 'deep-dive', false, '["partner", "partnership", "collaborate", "integration", "joint", "together"]', 'Route to a deep-dive session. Understand the mutual value proposition.'),
('investment', 'Investment and funding discussions', 'deep-dive', true, '["invest", "funding", "raise", "capital", "angel", "VC", "valuation"]', 'Auto-qualify for investment discussions. Route to deep-dive.'),
('media', 'Press, podcasts, and speaking', 'quick-chat', false, '["press", "interview", "podcast", "speak", "conference", "media", "article"]', 'Route to a quick chat. Ask about the publication/event and audience.');
