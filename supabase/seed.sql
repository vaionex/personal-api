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

-- Auto-response templates
INSERT INTO templates (trigger_pattern, response_template, auto_send) VALUES
('recruiter_outreach', 'Thanks for reaching out! I''m not looking for employment at the moment. Best of luck with the search!', true),
('vague_collaboration', 'I appreciate the interest! If you have something specific in mind, feel free to share details and I''ll take a look.', true);
