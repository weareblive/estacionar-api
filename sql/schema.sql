
CREATE TABLE user_account_types
(
  id integer PRIMARY KEY, 
  name varchar(50) NOT NULL
);


CREATE TABLE users
(
  id character varying (40) PRIMARY KEY,
  dni character varying (8) DEFAULT NULL,
  display_name character varying(100),
  first_name character varying(50),
  last_name character varying(50),
  photo_url character varying(200),
  network character varying(40) DEFAULT NULL,
  mobile character varying(25),
  mobile_verified boolean DEFAULT false,
  email character varying(100),
  email_verified boolean DEFAULT false,
  birthdate date DEFAULT NULL,
  account_type integer REFERENCES user_account_types DEFAULT 1,
  number_parkings integer DEFAULT 3,
  comission float DEFAULT 3.5,
  enabled boolean DEFAULT false,
  has_read_agreement boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);


CREATE TABLE vehicle_types
(
  id integer PRIMARY KEY, 
  name varchar(50) NOT NULL
);


CREATE TABLE brands
(
  id SERIAL PRIMARY KEY, 
  name varchar(50) NOT NULL
);

CREATE TABLE vehicle_models
(
  id SERIAL PRIMARY KEY, 
  brand_id integer REFERENCES brands NOT NULL,
  name varchar(50) NOT NULL
);

CREATE TABLE vehicles
(
  id SERIAL PRIMARY KEY,
  plate_number character varying (10) NOT NULL,
  uid character varying(50) NOT NULL,
  type integer REFERENCES vehicle_types NOT NULL,
  brand_id integer REFERENCES brands NOT NULL,
  model_id integer REFERENCES vehicle_models NOT NULL,
  color character varying(20),
  year integer not null,
  enabled boolean DEFAULT false,
  deleted boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE vehicle_images
(
  id SERIAL PRIMARY KEY,
  vehicle_id integer REFERENCES vehicles NOT NULL,
  photo character varying(300)
);


CREATE TABLE parkings
(
  id SERIAL PRIMARY KEY,
  name character varying (100) NOT NULL,
  description character varying (1000) NOT NULL,
  type integer DEFAULT 1,
  address character varying(200) NOT NULL,
  city character varying(100) NOT NULL,
  state character varying(100) NOT NULL,
  zip character varying(100) NOT NULL,
  lat_long character varying(100) NOT NULL,
  status character varying(30) NOT NULL,
  uid character varying(50) NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE parking_images
(
  id SERIAL PRIMARY KEY,
  parking_id integer REFERENCES parkings NOT NULL,
  is_default  boolean default false
  photo character varying(300)
);
