-- Seed default tags for MaatWork CRM
-- Run: psql -h localhost -U postgres -d maatwork -f seed-tags.sql

INSERT INTO tags (id, organization_id, name, color, icon, business_line, is_system, scope) 
VALUES 
('tag-balanz', 'org_maatwork_demo', 'Balanz', '#3b82f6', '📈', 'inversiones', true, 'contact'),
('tag-zinvest', 'org_maatwork_demo', 'Z.invest', '#8b5cf6', '💜', 'inversiones', true, 'contact'),
('tag-zoptions', 'org_maatwork_demo', 'Z.options', '#ec4899', '💖', 'zurich', true, 'contact'),
('tag-patrimonial', 'org_maatwork_demo', 'Patrimonial', '#059669', '💼', 'patrimonial', true, 'contact')
ON CONFLICT (id) DO NOTHING;
