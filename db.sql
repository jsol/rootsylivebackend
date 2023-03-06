CREATE DATABASE IF NOT EXISTS rootsylive  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rootsylive.users (
    id bigint NOT NULL PRIMARY KEY,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    email varchar(255) NOT NULL,
    valid tinyint not null default 0
);

CREATE TABLE IF NOT EXISTS rootsylive.artists (
    id varchar(250) NOT NULL primary key,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    jsondata json
);

CREATE TABLE IF NOT EXISTS rootsylive.gigs (
    id varchar(250) NOT NULL primary key,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    jsondata json
);

CREATE TABLE IF NOT EXISTS rootsylive.contracts (
    id varchar(250) NOT NULL primary key,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    jsondata json
);

CREATE TABLE IF NOT EXISTS rootsylive.venues (
    id varchar(250) NOT NULL primary key,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    jsondata json
);

CREATE TABLE IF NOT EXISTS rootsylive.promoters (
    id varchar(250) NOT NULL primary key,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    jsondata json
);

CREATE TABLE IF NOT EXISTS rootsylive.options (
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    name varchar(255) NOT NULL,
    category varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS rootsylive.templates (
    id varchar(250) NOT NULL primary key,
    changed DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category varchar(255) NOT NULL,
    template json
);

INSERT INTO rootsylive.options (category, name) VALUES
("hospitality", "Band rider" ),
("hospitality", "Inhouse" ),
("hospitality", "Rootsy Rider" ),
("hospitality", "No hospitality" ),
("state", "WIP" ),
("state", "Signed" ),
("state", "Ready" ),
("state", "Billed" ),
("state", "Archived" ),
("bandFormat", "Solo" ),
("bandFormat", "Duo" ),
("bandFormat", "Band" ),
("orgType", "Band" ),
("templates", "gig.guarantee" ),
("templates", "gig.contract" ),
("templates", "gig.special" ),
("templates", "gig.ticketPrices" ),
("templates", "gig.notes" );