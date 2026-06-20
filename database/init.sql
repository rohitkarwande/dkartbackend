 CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (email IS NOT NULL OR phone IS NOT NULL),
    role VARCHAR(20) DEFAULT 'user'
);

-- Equipment Post Table
CREATE TABLE IF NOT EXISTS equipment_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(3000),
    category VARCHAR(50) NOT NULL CHECK (category IN ('MRI', 'X-Ray', 'Cathlab', 'ECG', 'Ultrasound', 'Ventilator', 'CT Scan', 'Patient Monitor', 'Defibrillator', 'Laboratory Equipment', 'Surgical Equipment', 'Other')),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    manufacturing_year INTEGER CHECK (manufacturing_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('Used', 'Refurbished', 'Spare')),
    price DECIMAL(12, 2) CHECK (price >= 0),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Sold', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Images Table
CREATE TABLE IF NOT EXISTS equipment_images (
    id SERIAL PRIMARY KEY,
    equipment_post_id UUID REFERENCES equipment_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_posts_category ON equipment_posts(category);
CREATE INDEX IF NOT EXISTS idx_equipment_posts_city ON equipment_posts(city);
CREATE INDEX IF NOT EXISTS idx_equipment_posts_condition ON equipment_posts(condition);
CREATE INDEX IF NOT EXISTS idx_equipment_posts_seller_id ON equipment_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_equipment_posts_created_at ON equipment_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_equipment_posts_status ON equipment_posts(status);

-- Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    equipment_post_id UUID REFERENCES equipment_posts(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
        