-- =====================================================
-- INSANE STAYS - PROPERTY SEED SCRIPT
-- 11 Selected Demo Properties
-- =====================================================
-- Run against local/development PostgreSQL only
-- =====================================================

BEGIN;

-- Find the existing host account.
WITH demo_host AS (
    SELECT id
    FROM users
    WHERE email = 'testhost@example.com'
      AND role = 'host'
),

-- Define the 11 properties.
seed (
    title,
    description,
    city,
    state,
    price_per_night,
    max_guests,
    bedrooms,
    amenities
) AS (
    VALUES

    -- 1. CAVE IN JORDAN
    (
        'Wadi Rum Desert Cave Demo',
        'Demo cave stay inspired by desert lodging in Wadi Rum. Imagine stargazing, red sandstone landscapes, and a rustic Bedouin-style setting. Not the actual linked rental.',
        'Wadi Rum Village',
        'Aqaba, Jordan',
        92.00::numeric,
        2,
        1,
        '["Desert views", "Stargazing", "Outdoor seating"]'::jsonb
    ),

    -- 2. FIVE NIGHTS AT FREDDYS
    -- IMAGE WILL BE ADDED MANUALLY LATER
    (
        'Five Nights at Freddys Themed Stay Demo',
        'Fictional animatronic pizzeria-themed overnight adventure featuring arcade-inspired decor and playful mystery. Demo concept only, not an actual bookable restaurant.',
        'East Rutherford',
        'New Jersey, USA',
        120.00::numeric,
        4,
        2,
        '["Arcade decor", "WiFi", "Nearby shopping", "Parking"]'::jsonb
    ),

    -- 3. UNDERWATER MALDIVES RESIDENCE
    (
        'Underwater Ocean Residence Demo',
        'Imaginary luxury underwater villa inspired by ocean-facing residences in the Maldives, with panoramic marine views and a private infinity pool. Not an official Conrad property.',
        'Rangali Island',
        'Alif Dhaal Atoll, Maldives',
        6000.00::numeric,
        8,
        3,
        '["Ocean view", "Pool", "WiFi", "Kitchen", "Concierge-inspired experience"]'::jsonb
    ),

    -- 4. MEDIEVAL CASTLE
    (
        'Medieval Castle Escape Demo',
        'A storybook castle-room concept inspired by historic Irish tower houses, featuring stone walls, countryside views, and medieval atmosphere.',
        'Galway',
        'County Galway, Ireland',
        220.00::numeric,
        2,
        1,
        '["Historic architecture", "Countryside views", "Fireplace-inspired decor"]'::jsonb
    ),

    -- 5. GINGERBREAD HOUSE
    (
        'Gingerbread Storybook Cottage Demo',
        'Whimsical gingerbread-style holiday cottage with candy-colored decor. Location and accommodation details are fictional placeholders pending confirmation of the reference.',
        'Geyserville',
        'California, USA',
        175.00::numeric,
        4,
        2,
        '["Storybook decor", "Kitchen", "WiFi", "Garden"]'::jsonb
    ),

    -- 6. PRIVATE TROPICAL ISLAND
    (
        'Private Tropical Island Escape Demo',
        'Fictional private-island getaway inspired by Belize reef islands, with kayaking, snorkeling, and secluded sea views. Not the actual Bird Island rental.',
        'Placencia',
        'Stann Creek, Belize',
        850.00::numeric,
        8,
        4,
        '["Beach access", "Snorkeling", "Kayaking", "Ocean view"]'::jsonb
    ),

    -- 7. HAUNTED MANSION
    -- IMAGE WILL BE ADDED MANUALLY LATER
    (
        'Haunted Mansion Retreat Demo',
        'Immersive haunted-mansion-style vacation home with playful spooky decor, dramatic lighting, and a themed hot tub experience. Fictional demo adaptation.',
        'Fullerton',
        'California, USA',
        475.00::numeric,
        8,
        4,
        '["Hot tub", "WiFi", "Parking", "Themed decor"]'::jsonb
    ),

    -- 8. GHOST TOWN MINING CABIN
    (
        'Ghost Town Mining Cabin Demo',
        'Rustic desert cabin concept inspired by century-old Terlingua mining cabins and Big Bend landscapes. Not the actual referenced property.',
        'Terlingua',
        'Texas, USA',
        175.00::numeric,
        2,
        1,
        '["Desert view", "Parking", "Kitchen", "Outdoor seating"]'::jsonb
    ),

    -- 9. WARLOCKS MAGICAL HOUSE
    (
        'Warlocks Magical House Demo',
        'Fictional Salem witchcraft-themed condo with spellbook props, atmospheric lighting, and mystical decor. Not the actual Warlock House rental.',
        'Salem',
        'Massachusetts, USA',
        320.00::numeric,
        6,
        3,
        '["WiFi", "Themed decor", "Kitchen", "Smart lighting"]'::jsonb
    ),

    -- 10. CARDBOARD AIRBNB
    (
        'Cardboard Castle Art Stay Demo',
        'A fictional, professionally constructed art-installation-style stay with cardboard-inspired decor. NOT a real cardboard structure or an actual rental. Demo only.',
        'Austin',
        'Texas, USA',
        49.00::numeric,
        2,
        1,
        '["Art installation", "Creative decor", "Photo opportunities"]'::jsonb
    ),

    -- 11. SHREKS SWAMP
    -- IMAGE WILL BE ADDED MANUALLY LATER
    (
        'Shreks Swamp Getaway Demo',
        'Fictional storybook swamp cabin in Florida, with mossy trees and playful fantasy-ogre decor. Independent demo concept and not an official franchise accommodation.',
        'Kissimmee',
        'Florida, USA',
        69.00::numeric,
        4,
        2,
        '["Swamp views", "Themed decor", "Parking", "Kitchen"]'::jsonb
    )
)

-- =====================================================
-- INSERT PROPERTIES
-- =====================================================

INSERT INTO properties (
    host_id,
    title,
    description,
    city,
    state,
    zip_code,
    price_per_night,
    max_guests,
    bedrooms,
    amenities,
    image_url,
    status,
    address,
    contact_info,
    available_from,
    available_to,
    check_in_time,
    check_out_time
)

SELECT
    h.id,
    s.title,
    s.description,
    s.city,
    s.state,
    NULL,
    s.price_per_night,
    s.max_guests,
    s.bedrooms,
    s.amenities,
    NULL,
    'pending',
    NULL,
    NULL,
    NULL,
    NULL,
    TIME '15:00',
    TIME '11:00'

FROM seed s
CROSS JOIN demo_host h

WHERE NOT EXISTS (
    SELECT 1
    FROM properties p
    WHERE p.host_id = h.id
      AND p.title = s.title
);

-- Stop and rollback if our demo host is missing.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE email = 'testhost@example.com'
          AND role = 'host'
    ) THEN
        RAISE EXCEPTION
          'Demo host account missing or not a host';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- VERIFY THE NEW PROPERTIES
-- =====================================================

SELECT
    id,
    title,
    city,
    state,
    price_per_night,
    max_guests,
    bedrooms,
    status,
    image_url
FROM properties
WHERE title LIKE '% Demo'
ORDER BY id;
