-- ==============================
-- Seed Data for Lookup Management System
-- Populates all existing enum values as dynamic lookups
-- ==============================

-- Insert Lookup Categories
INSERT INTO "lookup_categories" ("id", "name", "code", "description", "is_global", "is_system") VALUES
  ('cat_system_role', 'System Role', 'SYSTEM_ROLE', 'System-wide user roles', true, true),
  ('cat_tenant_role', 'Tenant Role', 'TENANT_ROLE', 'Organization-specific user roles', true, true),
  ('cat_tenant_status', 'Tenant Status', 'TENANT_STATUS', 'Organization account status', true, true),
  ('cat_subscription_plan', 'Subscription Plan', 'SUBSCRIPTION_PLAN', 'Billing subscription tiers', true, true),
  ('cat_promo_type', 'Promo Type', 'PROMO_TYPE', 'Discount type for promo codes', true, false),
  ('cat_verification_status', 'Verification Status', 'VERIFICATION_STATUS', 'KYC/Document verification status', true, true),
  ('cat_registration_status', 'Registration Status', 'REGISTRATION_STATUS', 'Event registration approval status', true, false),
  ('cat_order_status', 'Order Status', 'ORDER_STATUS', 'Payment order status', true, true),
  ('cat_ticket_status', 'Ticket Status', 'TICKET_STATUS', 'Ticket availability status', true, false),
  ('cat_attendee_status', 'Attendee Status', 'ATTENDEE_STATUS', 'Attendee check-in status', true, false),
  ('cat_field_type', 'Field Type', 'FIELD_TYPE', 'Custom form field types', true, true),
  ('cat_event_role', 'Event Role', 'EVENT_ROLE', 'Event-specific user roles', true, false),
  ('cat_rsvp_status', 'RSVP Status', 'RSVP_STATUS', 'Event RSVP response status', true, false),
  ('cat_booth_type', 'Booth Type', 'BOOTH_TYPE', 'Exhibitor booth types', true, false),
  ('cat_booth_status', 'Booth Status', 'BOOTH_STATUS', 'Booth availability status', true, false),
  ('cat_asset_kind', 'Asset Kind', 'ASSET_KIND', 'Asset/media type classification', true, false),
  ('cat_site_status', 'Site Status', 'SITE_STATUS', 'Event website publication status', true, true),
  ('cat_notification_type', 'Notification Type', 'NOTIFICATION_TYPE', 'Communication channel types', true, false),
  ('cat_notification_status', 'Notification Status', 'NOTIFICATION_STATUS', 'Message delivery status', true, true),
  ('cat_notification_trigger', 'Notification Trigger', 'NOTIFICATION_TRIGGER', 'Automated notification triggers', true, false)
ON CONFLICT (code) DO NOTHING;

-- ==============================
-- 1. System Role Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "sort_order", "is_system", "is_default") VALUES
  ('cat_system_role', 'SUPER_ADMIN', 'Super Admin', 'Platform administrator with full access', 1, true, false),
  ('cat_system_role', 'ADMIN', 'Admin', 'Administrator with elevated permissions', 2, true, false),
  ('cat_system_role', 'USER', 'User', 'Standard user account', 3, true, true)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 2. Tenant Role Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_system") VALUES
  ('cat_tenant_role', 'TENANT_ADMIN', 'Tenant Admin', 'Full control of organization', '#8B5CF6', 1, false),
  ('cat_tenant_role', 'EVENT_MANAGER', 'Event Manager', 'Creates and manages events', '#3B82F6', 2, false),
  ('cat_tenant_role', 'VENUE_MANAGER', 'Venue Manager', 'Manages venue operations', '#10B981', 3, false),
  ('cat_tenant_role', 'FINANCE_ADMIN', 'Finance Admin', 'Handles payments and financial reports', '#F59E0B', 4, false),
  ('cat_tenant_role', 'MARKETING_ADMIN', 'Marketing Admin', 'Controls branding and communications', '#EC4899', 5, false),
  ('cat_tenant_role', 'SUPPORT_STAFF', 'Support Staff', 'On-ground event support', '#6366F1', 6, false),
  ('cat_tenant_role', 'EXHIBITOR_MANAGER', 'Exhibitor Manager', 'Manages exhibitor relationships', '#14B8A6', 7, false),
  ('cat_tenant_role', 'ATTENDEE', 'Attendee', 'Public event registration (read-only)', '#64748B', 8, false),
  ('cat_tenant_role', 'VIEWER', 'Viewer', 'Read-only access to reports', '#94A3B8', 9, false),
  ('cat_tenant_role', 'STAFF', 'Staff', 'General operational staff', '#78716C', 10, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 3. Tenant Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_tenant_status', 'ACTIVE', 'Active', 'Organization is active and operational', '#10B981', 1, false),
  ('cat_tenant_status', 'TRIAL', 'Trial', 'Organization is in trial period', '#3B82F6', 2, true),
  ('cat_tenant_status', 'SUSPENDED', 'Suspended', 'Organization access is suspended', '#F59E0B', 3, false),
  ('cat_tenant_status', 'CANCELLED', 'Cancelled', 'Organization subscription cancelled', '#EF4444', 4, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 4. Subscription Plan Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default", "metadata") VALUES
  ('cat_subscription_plan', 'FREE', 'Free', 'Basic features for small events', '#64748B', 1, true, '{"maxEvents": 3, "maxUsers": 2, "maxStorage": 512}'::jsonb),
  ('cat_subscription_plan', 'STARTER', 'Starter', 'Essential features for growing teams', '#3B82F6', 2, false, '{"maxEvents": 10, "maxUsers": 5, "maxStorage": 2048}'::jsonb),
  ('cat_subscription_plan', 'PRO', 'Pro', 'Advanced features for professionals', '#8B5CF6', 3, false, '{"maxEvents": 50, "maxUsers": 20, "maxStorage": 10240}'::jsonb),
  ('cat_subscription_plan', 'ENTERPRISE', 'Enterprise', 'Unlimited access for large organizations', '#F59E0B', 4, false, '{"maxEvents": -1, "maxUsers": -1, "maxStorage": -1}'::jsonb)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 5. Promo Type Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "sort_order") VALUES
  ('cat_promo_type', 'PERCENT', 'Percentage', 'Discount as percentage of total', 1),
  ('cat_promo_type', 'FIXED', 'Fixed Amount', 'Fixed amount discount', 2)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 6. Verification Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_verification_status', 'PENDING', 'Pending', 'Verification pending review', '#F59E0B', 1, true),
  ('cat_verification_status', 'APPROVED', 'Approved', 'Verification approved', '#10B981', 2, false),
  ('cat_verification_status', 'REJECTED', 'Rejected', 'Verification rejected', '#EF4444', 3, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 7. Registration Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_registration_status', 'PENDING', 'Pending', 'Registration awaiting approval', '#F59E0B', 1, true),
  ('cat_registration_status', 'APPROVED', 'Approved', 'Registration approved', '#10B981', 2, false),
  ('cat_registration_status', 'DENIED', 'Denied', 'Registration denied', '#EF4444', 3, false),
  ('cat_registration_status', 'CANCELLED', 'Cancelled', 'Registration cancelled', '#64748B', 4, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 8. Order Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_order_status', 'CREATED', 'Created', 'Order created, payment pending', '#3B82F6', 1, true),
  ('cat_order_status', 'PAID', 'Paid', 'Payment completed successfully', '#10B981', 2, false),
  ('cat_order_status', 'REFUNDED', 'Refunded', 'Payment refunded', '#F59E0B', 3, false),
  ('cat_order_status', 'CANCELLED', 'Cancelled', 'Order cancelled', '#EF4444', 4, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 9. Ticket Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_ticket_status', 'ACTIVE', 'Active', 'Ticket available for purchase', '#10B981', 1, true),
  ('cat_ticket_status', 'INACTIVE', 'Inactive', 'Ticket not available', '#64748B', 2, false),
  ('cat_ticket_status', 'HIDDEN', 'Hidden', 'Ticket hidden from public', '#94A3B8', 3, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 10. Attendee Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_attendee_status', 'REGISTERED', 'Registered', 'Attendee registered', '#3B82F6', 1, true),
  ('cat_attendee_status', 'CONFIRMED', 'Confirmed', 'Attendance confirmed', '#8B5CF6', 2, false),
  ('cat_attendee_status', 'CHECKED_IN', 'Checked In', 'Attendee checked in at venue', '#10B981', 3, false),
  ('cat_attendee_status', 'CANCELLED', 'Cancelled', 'Registration cancelled', '#EF4444', 4, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 11. Field Type Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "icon", "sort_order") VALUES
  ('cat_field_type', 'TEXT', 'Text', 'Single line text input', 'Type', 1),
  ('cat_field_type', 'TEXTAREA', 'Text Area', 'Multi-line text input', 'AlignLeft', 2),
  ('cat_field_type', 'NUMBER', 'Number', 'Numeric input', 'Hash', 3),
  ('cat_field_type', 'SELECT', 'Select', 'Dropdown selection', 'ChevronDown', 4),
  ('cat_field_type', 'MULTISELECT', 'Multi-Select', 'Multiple choice selection', 'CheckSquare', 5),
  ('cat_field_type', 'DATE', 'Date', 'Date picker', 'Calendar', 6),
  ('cat_field_type', 'EMAIL', 'Email', 'Email address input', 'Mail', 7),
  ('cat_field_type', 'PHONE', 'Phone', 'Phone number input', 'Phone', 8),
  ('cat_field_type', 'CHECKBOX', 'Checkbox', 'Yes/No checkbox', 'CheckSquare', 9)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 12. Event Role Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order") VALUES
  ('cat_event_role', 'OWNER', 'Owner', 'Event owner with full control', '#8B5CF6', 1),
  ('cat_event_role', 'ORGANIZER', 'Organizer', 'Event organizer', '#3B82F6', 2),
  ('cat_event_role', 'STAFF', 'Staff', 'Event staff member', '#10B981', 3),
  ('cat_event_role', 'VIEWER', 'Viewer', 'Read-only viewer', '#64748B', 4)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 13. RSVP Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order") VALUES
  ('cat_rsvp_status', 'GOING', 'Going', 'Confirmed attendance', '#10B981', 1),
  ('cat_rsvp_status', 'INTERESTED', 'Interested', 'Interested in attending', '#3B82F6', 2),
  ('cat_rsvp_status', 'NOT_GOING', 'Not Going', 'Not attending', '#EF4444', 3),
  ('cat_rsvp_status', 'YET_TO_RESPOND', 'Yet to Respond', 'No response yet', '#94A3B8', 4)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 14. Booth Type Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "metadata") VALUES
  ('cat_booth_type', 'STANDARD', 'Standard', 'Standard booth (9 sqm)', '#64748B', 1, '{"sizeSqm": 9, "basePrice": 50000}'::jsonb),
  ('cat_booth_type', 'PREMIUM', 'Premium', 'Premium booth (16 sqm)', '#3B82F6', 2, '{"sizeSqm": 16, "basePrice": 100000}'::jsonb),
  ('cat_booth_type', 'ISLAND', 'Island', 'Island booth (25 sqm)', '#8B5CF6', 3, '{"sizeSqm": 25, "basePrice": 200000}'::jsonb),
  ('cat_booth_type', 'CUSTOM', 'Custom', 'Custom size booth', '#F59E0B', 4, '{"sizeSqm": 0, "basePrice": 0}'::jsonb)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 15. Booth Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_booth_status', 'AVAILABLE', 'Available', 'Booth available for booking', '#10B981', 1, true),
  ('cat_booth_status', 'RESERVED', 'Reserved', 'Booth temporarily reserved', '#F59E0B', 2, false),
  ('cat_booth_status', 'ASSIGNED', 'Assigned', 'Booth assigned to exhibitor', '#3B82F6', 3, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 16. Asset Kind Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "icon", "sort_order") VALUES
  ('cat_asset_kind', 'IMAGE', 'Image', 'Image file', 'Image', 1),
  ('cat_asset_kind', 'DOC', 'Document', 'Document file', 'FileText', 2),
  ('cat_asset_kind', 'URL', 'URL', 'External link', 'Link', 3)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 17. Site Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_site_status', 'DRAFT', 'Draft', 'Website in draft mode', '#94A3B8', 1, true),
  ('cat_site_status', 'PUBLISHED', 'Published', 'Website published and live', '#10B981', 2, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 18. Notification Type Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "icon", "color_code", "sort_order") VALUES
  ('cat_notification_type', 'EMAIL', 'Email', 'Email notification', 'Mail', '#3B82F6', 1),
  ('cat_notification_type', 'SMS', 'SMS', 'SMS text message', 'MessageSquare', '#10B981', 2),
  ('cat_notification_type', 'WHATSAPP', 'WhatsApp', 'WhatsApp message', 'MessageCircle', '#25D366', 3),
  ('cat_notification_type', 'PUSH', 'Push', 'Push notification', 'Bell', '#F59E0B', 4)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 19. Notification Status Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "color_code", "sort_order", "is_default") VALUES
  ('cat_notification_status', 'PENDING', 'Pending', 'Notification queued', '#94A3B8', 1, true),
  ('cat_notification_status', 'SCHEDULED', 'Scheduled', 'Notification scheduled', '#3B82F6', 2, false),
  ('cat_notification_status', 'SENT', 'Sent', 'Notification sent successfully', '#10B981', 3, false),
  ('cat_notification_status', 'FAILED', 'Failed', 'Notification failed to send', '#EF4444', 4, false),
  ('cat_notification_status', 'CANCELLED', 'Cancelled', 'Notification cancelled', '#64748B', 5, false)
ON CONFLICT (category_id, value) DO NOTHING;

-- ==============================
-- 20. Notification Trigger Values
-- ==============================
INSERT INTO "lookup_values" ("category_id", "value", "label", "description", "sort_order") VALUES
  ('cat_notification_trigger', 'MANUAL', 'Manual', 'Manually triggered notification', 1),
  ('cat_notification_trigger', 'EVENT_REMINDER_1WEEK', 'Event Reminder (1 Week)', 'Sent 1 week before event', 2),
  ('cat_notification_trigger', 'EVENT_REMINDER_1DAY', 'Event Reminder (1 Day)', 'Sent 1 day before event', 3),
  ('cat_notification_trigger', 'EVENT_REMINDER_1HOUR', 'Event Reminder (1 Hour)', 'Sent 1 hour before event', 4),
  ('cat_notification_trigger', 'POST_EVENT_THANKYOU', 'Post-Event Thank You', 'Sent after event completion', 5),
  ('cat_notification_trigger', 'REGISTRATION_CONFIRMATION', 'Registration Confirmation', 'Sent on registration', 6),
  ('cat_notification_trigger', 'PAYMENT_CONFIRMATION', 'Payment Confirmation', 'Sent on payment success', 7),
  ('cat_notification_trigger', 'CUSTOM', 'Custom', 'Custom trigger condition', 8)
ON CONFLICT (category_id, value) DO NOTHING;

-- Verify seed data
SELECT 
  lc.name as category,
  COUNT(lv.id) as value_count
FROM lookup_categories lc
LEFT JOIN lookup_values lv ON lv.category_id = lc.id
GROUP BY lc.id, lc.name
ORDER BY lc.name;
