CREATE DATABASE IF NOT EXISTS life_rpg
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE life_rpg;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  gold INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  last_activity DATE NULL,
  intellect INT NOT NULL DEFAULT 1,
  strength INT NOT NULL DEFAULT 1,
  focus INT NOT NULL DEFAULT 1,
  wisdom INT NOT NULL DEFAULT 1,
  total_focus_seconds BIGINT NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(40) NOT NULL DEFAULT 'Other',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'Easy',
  xp_reward INT NOT NULL DEFAULT 0,
  gold_reward INT NOT NULL DEFAULT 0,
  attribute VARCHAR(30) NOT NULL DEFAULT 'focus',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  focus_seconds INT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quests_user (user_id),
  INDEX idx_quests_completed (user_id, completed),
  INDEX idx_quests_deleted (user_id, deleted_at)
);

CREATE TABLE IF NOT EXISTS rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  icon VARCHAR(10) NOT NULL DEFAULT '🎁',
  cost INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reward_id INT NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quest_timers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quest_id INT NOT NULL UNIQUE,
  elapsed_seconds INT NOT NULL DEFAULT 0,
  status ENUM('idle','running','paused','completed') NOT NULL DEFAULT 'idle',
  started_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  INDEX idx_timer_user (user_id),
  INDEX idx_timer_status (user_id, status)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO rewards (name,description,icon,cost)
SELECT 'Mystic Sword','A badge for your profile.','🗡️',100
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name='Mystic Sword');
INSERT INTO rewards (name,description,icon,cost)
SELECT 'Shadow Theme','Unlock a legendary theme concept.','🌑',200
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name='Shadow Theme');
INSERT INTO rewards (name,description,icon,cost)
SELECT 'Dragon Badge','Show that you reached a milestone.','🐉',300
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name='Dragon Badge');
INSERT INTO rewards (name,description,icon,cost)
SELECT 'Golden Crown','A premium hero badge.','👑',500
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE name='Golden Crown');
