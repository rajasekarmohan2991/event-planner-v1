-- Add sample seat inventory for event ID 1
INSERT INTO seat_inventory (event_id, section, row_number, seat_number, seat_type, base_price, x_coordinate, y_coordinate, is_available) VALUES
-- VIP Section (Front rows, higher price)
(1, 'VIP', 'A', '1', 'VIP', 500.00, 100, 50, true),
(1, 'VIP', 'A', '2', 'VIP', 500.00, 120, 50, true),
(1, 'VIP', 'A', '3', 'VIP', 500.00, 140, 50, true),
(1, 'VIP', 'A', '4', 'VIP', 500.00, 160, 50, true),
(1, 'VIP', 'A', '5', 'VIP', 500.00, 180, 50, true),
(1, 'VIP', 'B', '1', 'VIP', 500.00, 100, 70, true),
(1, 'VIP', 'B', '2', 'VIP', 500.00, 120, 70, true),
(1, 'VIP', 'B', '3', 'VIP', 500.00, 140, 70, true),
(1, 'VIP', 'B', '4', 'VIP', 500.00, 160, 70, true),
(1, 'VIP', 'B', '5', 'VIP', 500.00, 180, 70, true),

-- Premium Section (Middle rows, medium price)
(1, 'Premium', 'C', '1', 'PREMIUM', 300.00, 80, 100, true),
(1, 'Premium', 'C', '2', 'PREMIUM', 300.00, 100, 100, true),
(1, 'Premium', 'C', '3', 'PREMIUM', 300.00, 120, 100, true),
(1, 'Premium', 'C', '4', 'PREMIUM', 300.00, 140, 100, true),
(1, 'Premium', 'C', '5', 'PREMIUM', 300.00, 160, 100, true),
(1, 'Premium', 'C', '6', 'PREMIUM', 300.00, 180, 100, true),
(1, 'Premium', 'C', '7', 'PREMIUM', 300.00, 200, 100, true),
(1, 'Premium', 'D', '1', 'PREMIUM', 300.00, 80, 120, true),
(1, 'Premium', 'D', '2', 'PREMIUM', 300.00, 100, 120, true),
(1, 'Premium', 'D', '3', 'PREMIUM', 300.00, 120, 120, true),
(1, 'Premium', 'D', '4', 'PREMIUM', 300.00, 140, 120, true),
(1, 'Premium', 'D', '5', 'PREMIUM', 300.00, 160, 120, true),
(1, 'Premium', 'D', '6', 'PREMIUM', 300.00, 180, 120, true),
(1, 'Premium', 'D', '7', 'PREMIUM', 300.00, 200, 120, true),

-- General Section (Back rows, standard price)
(1, 'General', 'E', '1', 'STANDARD', 150.00, 60, 150, true),
(1, 'General', 'E', '2', 'STANDARD', 150.00, 80, 150, true),
(1, 'General', 'E', '3', 'STANDARD', 150.00, 100, 150, true),
(1, 'General', 'E', '4', 'STANDARD', 150.00, 120, 150, true),
(1, 'General', 'E', '5', 'STANDARD', 150.00, 140, 150, true),
(1, 'General', 'E', '6', 'STANDARD', 150.00, 160, 150, true),
(1, 'General', 'E', '7', 'STANDARD', 150.00, 180, 150, true),
(1, 'General', 'E', '8', 'STANDARD', 150.00, 200, 150, true),
(1, 'General', 'E', '9', 'STANDARD', 150.00, 220, 150, true),
(1, 'General', 'F', '1', 'STANDARD', 150.00, 60, 170, true),
(1, 'General', 'F', '2', 'STANDARD', 150.00, 80, 170, true),
(1, 'General', 'F', '3', 'STANDARD', 150.00, 100, 170, true),
(1, 'General', 'F', '4', 'STANDARD', 150.00, 120, 170, true),
(1, 'General', 'F', '5', 'STANDARD', 150.00, 140, 170, true),
(1, 'General', 'F', '6', 'STANDARD', 150.00, 160, 170, true),
(1, 'General', 'F', '7', 'STANDARD', 150.00, 180, 170, true),
(1, 'General', 'F', '8', 'STANDARD', 150.00, 200, 170, true),
(1, 'General', 'F', '9', 'STANDARD', 150.00, 220, 170, true),
(1, 'General', 'G', '1', 'STANDARD', 150.00, 60, 190, true),
(1, 'General', 'G', '2', 'STANDARD', 150.00, 80, 190, true),
(1, 'General', 'G', '3', 'STANDARD', 150.00, 100, 190, true),
(1, 'General', 'G', '4', 'STANDARD', 150.00, 120, 190, true),
(1, 'General', 'G', '5', 'STANDARD', 150.00, 140, 190, true),
(1, 'General', 'G', '6', 'STANDARD', 150.00, 160, 190, true),
(1, 'General', 'G', '7', 'STANDARD', 150.00, 180, 190, true),
(1, 'General', 'G', '8', 'STANDARD', 150.00, 200, 190, true),
(1, 'General', 'G', '9', 'STANDARD', 150.00, 220, 190, true);

-- Mark a few seats as unavailable to test the UI
UPDATE seat_inventory SET is_available = false WHERE event_id = 1 AND section = 'VIP' AND row_number = 'A' AND seat_number IN ('2', '4');
UPDATE seat_inventory SET is_available = false WHERE event_id = 1 AND section = 'Premium' AND row_number = 'C' AND seat_number IN ('3', '5');
