-- Seed Robin's knowledge base

-- Bio
INSERT INTO knowledge (category, key, value, priority) VALUES
('bio', 'Name', 'Robin Kohze', 10),
('bio', 'Role', 'Founder & Developer at Vaionex Corporation', 10),
('bio', 'Location', 'Europe (EU timezone)', 5),
('bio', 'Background', 'PhD background, full-stack developer, builds SaaS products', 8),
('bio', 'GitHub', 'github.com/Kohze', 5);

-- Projects
INSERT INTO knowledge (category, key, value, context, priority) VALUES
('project', 'Tournaments.com', 'Sports & tournaments news directory', 'SvelteKit + Supabase, deployed on Vercel', 8),
('project', 'Agreements.ai', 'AI-powered contract management platform', 'Next.js + Firebase, document analysis, signing, clause library', 9),
('project', 'Taxation.ai', 'AI tax preparation platform', 'SvelteKit + Supabase, supports US/UK/DE/FR/NL, deployed on Hetzner/Coolify', 8),
('project', 'Telomere.ai', 'Free open-source genetic analysis platform', 'SvelteKit + Tauri desktop app, MIT license, 378 SNPs, browser-based', 8),
('project', 'PitchAI', 'AI pitch deck analysis and creation', 'Next.js + Firebase, MCP server with 25 tools', 7),
('project', 'InfoMagic.com', '42 deep articles on essential concepts', 'SvelteKit, interactive explorations, GSAP animations', 7),
('project', 'Silly.ai', 'AI-powered creative tool', 'Part of Vaionex portfolio', 5),
('project', 'Admission.ai', 'College admissions platform', 'SvelteKit + Supabase, 1000+ universities', 6);

-- Preferences
INSERT INTO knowledge (category, key, value, priority) VALUES
('preference', 'Tech stack', 'SvelteKit for most projects, Next.js when needed. Supabase or Firebase for backend. Tailwind CSS for styling. Vercel or Coolify for deployment.', 9),
('preference', 'Communication', 'Async preferred. Direct and to the point. No fluff.', 8),
('preference', 'Meetings', 'Only if async won''t work. Always needs an agenda. Prefers 30 min max.', 7),
('preference', 'Timezone', 'EU timezone. Available roughly 9am-7pm CET.', 6);

-- Stances
INSERT INTO knowledge (category, key, value, priority) VALUES
('stance', 'SvelteKit vs Next.js', 'SvelteKit for most projects — simpler, faster, less boilerplate. Next.js only for large team projects or when React ecosystem is required.', 7),
('stance', 'Open source', 'Strong believer. Telomere.ai is fully open source (MIT). Happy to collaborate on open source.', 7),
('stance', 'AI in products', 'AI should be practical and useful, not a gimmick. Uses Claude and GPT-4o depending on the task.', 6);

-- Boundaries
INSERT INTO knowledge (category, key, value, priority) VALUES
('boundary', 'No unpaid consulting', 'Don''t do free "pick your brain" calls. Happy to answer specific technical questions async.', 9),
('boundary', 'No crypto projects', 'Not interested in blockchain/crypto/web3 project pitches.', 8),
('boundary', 'No vague collaboration', '"Let''s collaborate sometime" without specifics gets a polite decline.', 7),
('boundary', 'Recruiting', 'Not looking for employment. Runs own company.', 8);

-- FAQ
INSERT INTO knowledge (category, key, value, priority) VALUES
('faq', 'Available for freelance?', 'Not actively taking freelance work, but open to interesting consulting engagements with clear scope.', 8),
('faq', 'How to contribute to Telomere.ai?', 'Check the CONTRIBUTING.md on GitHub (vaionex/telomere.ai). PRs welcome, especially for new SNP data and parser improvements.', 7),
('faq', 'Tech stack recommendation?', 'For most SaaS: SvelteKit + Supabase + Tailwind + Vercel. It''s the fastest path from idea to production.', 7),
('faq', 'Speaking/conferences?', 'Open to speaking about AI in SaaS, genetic analysis, or developer tooling. Need details on format, audience, and timeline.', 6);

-- Templates
INSERT INTO templates (trigger_pattern, response_template, auto_send) VALUES
('recruiter_outreach', 'Thanks for reaching out! I''m not looking for employment — I run Vaionex Corporation and am focused on our products. Best of luck with the search!', true),
('vague_collab', 'Appreciate the interest! I''m pretty heads-down on current projects right now. If you have something specific in mind, feel free to share details and I''ll take a look.', true),
('crypto_pitch', 'Thanks for thinking of me, but crypto/web3 projects aren''t in my wheelhouse. Good luck with the project!', true);
