# ISAT-DMS Database Schema

## Description

The ISAT-DMS database is designed using **MySQL 8.0+** with a normalized relational structure following **Third Normal Form (3NF)**. The schema consists of **12 core tables** managing users, teacher questionnaires, IPCRF ratings, KRAs (Key Result Areas), competencies, objectives, surveys, digital signatures, audit logs, and system configurations.

**Key Features:**
- Foreign key constraints ensure data integrity
- JSON fields store complex structured data (ratings, survey responses, training records)
- Comprehensive indexing for query optimization
- Audit logging for all critical operations
- Soft deletes and timestamp tracking on all records

The database supports the complete IPCRF workflow from teacher questionnaire submission through evaluation, approval, digital signing, and archival.

---

## Table of Contents
- [Database Overview](#database-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Data Dictionary](#data-dictionary)

---

## Database Overview

**Database Name:** `isat_etraces`  
**Database Engine:** MySQL 8.0+  
**Character Set:** utf8mb4  
**Collation:** utf8mb4_unicode_ci

### Database Design Principles
- **Normalization:** Tables follow 3rd Normal Form (3NF) to minimize redundancy
- **Referential Integrity:** Foreign key constraints ensure data consistency
- **Indexing:** Strategic indexes for query optimization
- **Soft Deletes:** Deleted records are marked, not removed (where applicable)
- **Timestamps:** Automatic created_at and updated_at tracking

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     Users       │
│─────────────────│
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ password        │
│ division        │
│ teacher_type    │
│ position_id (FK)│
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────▼──────────────────────────────────────────────┐
    │                                                    │
    │                                                    │
┌───▼──────────────┐  ┌────────────────────┐  ┌────────▼─────────────┐
│TeacherQuestionnaire│  │  SignedIpcrf      │  │   IpcrfSurvey       │
│──────────────────│  │────────────────────│  │─────────────────────│
│ id (PK)          │  │ id (PK)            │  │ id (PK)             │
│ teacher_id (FK)  │  │ ipcrf_rating_id(FK)│  │ teacher_id (FK)     │
│ school_year      │  │ teacher_signature  │  │ ipcrf_rating_id(FK) │
│ age              │  │ evaluator_signature│  │ school_year         │
│ current_position │  │ signed_date        │  │ responses (JSON)    │
│ bachelor_degree  │  └────────────────────┘  │ overall_satisfaction│
│ years_service    │                           │ comments            │
│ year_level       │                           └─────────────────────┘
│ subject_taught   │
│ trainings (JSON) │
│ kra_ratings(JSON)│
│ challenges (JSON)│
└────────┬─────────┘
         │
         │ 1:N
         │
    ┌────▼──────────────┐
    │  IpcrfRating      │
    │───────────────────│
    │ id (PK)           │
    │ teacher_id (FK)   │
    │ school_year       │
    │ kra_id (FK)       │
    │ scores (JSON)     │
    │ numerical_rating  │
    │ performance_level │
    │ status            │
    │ remarks           │
    │ evaluated_by (FK) │
    │ created_by (FK)   │
    └────────┬──────────┘
             │
             │ N:1
             │
    ┌────────▼─────────┐
    │      KRA         │
    │──────────────────│
    │ id (PK)          │
    │ name             │
    │ description      │
    │ weight           │
    │ order            │
    └────────┬─────────┘
             │
             │ 1:N
             │
    ┌────────▼─────────┐
    │  Competency      │
    │──────────────────│
    │ id (PK)          │
    │ kra_id (FK)      │
    │ name             │
    │ description      │
    │ weight           │
    │ order            │
    └────────┬─────────┘
             │
             │ 1:N
             │
    ┌────────▼─────────┐
    │   Objective      │
    │──────────────────│
    │ id (PK)          │
    │ competency_id(FK)│
    │ description      │
    │ success_indicator│
    │ weight           │
    │ order            │
    └──────────────────┘


┌──────────────────┐         ┌──────────────────┐
│   AuditLog       │         │  PendingAction   │
│──────────────────│         │──────────────────│
│ id (PK)          │         │ id (PK)          │
│ user_id (FK)     │         │ user_id (FK)     │
│ action           │         │ action_type      │
│ model_type       │         │ related_model    │
│ model_id         │         │ related_id       │
│ changes (JSON)   │         │ status           │
│ ip_address       │         │ priority         │
│ user_agent       │         │ due_date         │
└──────────────────┘         └──────────────────┘


┌──────────────────┐         ┌──────────────────┐
│    Position      │         │IpcrfConfiguration│
│──────────────────│         │──────────────────│
│ id (PK)          │         │ id (PK)          │
│ name             │         │ key              │
│ description      │         │ value (JSON)     │
│ is_teaching      │         │ description      │
└──────────────────┘         └──────────────────┘
```

---

## Tables

### 1. users
**Purpose:** Store user accounts for teachers, admins, and super-admins

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| | name | VARCHAR(255) | Juan Dela Cruz |
| | email | VARCHAR(255) | juan.delacruz@deped.gov.ph |
| | email_verified_at | TIMESTAMP | 2026-08-15 10:30:00 |
| | password | VARCHAR(255) | $2y$10$92IXUNpkj... (bcrypt hash) |
| | division | VARCHAR(255) | Division A |
| | teacher_type | ENUM('Proficient', 'Highly Proficient', 'Distinguished') | Proficient |
| FK | current_position_id | BIGINT UNSIGNED | 3 |
| | remember_token | VARCHAR(100) | a1b2c3d4e5f6g7h8i9j0... |
| | created_at | TIMESTAMP | 2026-01-15 08:00:00 |
| | updated_at | TIMESTAMP | 2026-09-02 14:30:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`email`)
- INDEX (`division`)
- FOREIGN KEY (`current_position_id`) REFERENCES `positions(id)`

**Relationships:**
- Has Many: TeacherQuestionnaire, IpcrfRating, IpcrfSurvey, AuditLog, PendingAction
- Belongs To: Position

**Sample Data:**

```sql
INSERT INTO users (id, name, email, password, division, teacher_type, current_position_id) 
VALUES 
(1, 'Juan Dela Cruz', 'juan.delacruz@deped.gov.ph', '$2y$10$92IXUNpkj...', 'Division A', 'Proficient', 3),
(2, 'Maria Santos', 'maria.santos@deped.gov.ph', '$2y$10$83KYVNpxl...', 'Division B', 'Highly Proficient', 5);
```

---

### 2. teacher_questionnaires
**Purpose:** Store comprehensive teacher profile and self-assessment data

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | teacher_id | BIGINT UNSIGNED | 1 |
| | school_year | VARCHAR(20) | 2024-2025 |
| | age | INT | 32 |
| | current_position | VARCHAR(255) | Teacher III |
| | bachelor_degree | VARCHAR(255) | Bachelor of Secondary Education Major in English |
| | years_of_service | INT | 8 |
| | year_level_assignment | VARCHAR(255) | Grade 10 |
| | subject_taught | VARCHAR(255) | English |
| | trainings_attended | JSON | [{"title":"Classroom Management","date":"2024-01-15"}] |
| | kra_ratings | JSON | {"kra1":4.5,"kra2":4.0,"kra3":4.2,"kra4":3.8,"kra5":4.3} |
| | challenges_faced | JSON | ["Time management with large class sizes"] |
| | created_at | TIMESTAMP | 2026-08-15 09:00:00 |
| | updated_at | TIMESTAMP | 2026-08-15 09:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`teacher_id`)
- INDEX (`school_year`)
- UNIQUE KEY (`teacher_id`, `school_year`)
- FOREIGN KEY (`teacher_id`) REFERENCES `users(id)` ON DELETE CASCADE

**JSON Structure Examples:**

```json
// trainings_attended
[
  {
    "title": "Classroom Management",
    "date": "2024-01-15",
    "duration": "8 hours",
    "provider": "DepEd"
  },
  {
    "title": "Technology Integration in Teaching",
    "date": "2024-03-20",
    "duration": "16 hours",
    "provider": "DepEd Regional Office"
  }
]

// kra_ratings (self-assessment)
{
  "kra1": 4.5,
  "kra2": 4.0,
  "kra3": 4.2,
  "kra4": 3.8,
  "kra5": 4.3
}

// challenges_faced
[
  "Time management with large class sizes",
  "Limited access to teaching materials",
  "Engaging students in remote learning"
]
```

**Sample Data:**

```sql
INSERT INTO teacher_questionnaires 
(id, teacher_id, school_year, age, current_position, bachelor_degree, years_of_service, 
year_level_assignment, subject_taught, trainings_attended, kra_ratings, challenges_faced) 
VALUES 
(1, 1, '2024-2025', 32, 'Teacher III', 'Bachelor of Secondary Education Major in English', 8, 
'Grade 10', 'English', 
'[{"title":"Classroom Management","date":"2024-01-15","duration":"8 hours","provider":"DepEd"}]',
'{"kra1":4.5,"kra2":4.0,"kra3":4.2,"kra4":3.8,"kra5":4.3}',
'["Time management with large class sizes","Limited access to teaching materials"]');
```

---

### 3. ipcrf_ratings
**Purpose:** Store official performance evaluation ratings

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | teacher_id | BIGINT UNSIGNED | 1 |
| | school_year | VARCHAR(20) | 2024-2025 |
| FK | kra_id | BIGINT UNSIGNED | 1 |
| | scores | JSON | {"competency_1":4.5,"competency_2":4.0,"objective_1_1":5.0} |
| | numerical_rating | DECIMAL(5,2) | 4.35 |
| | performance_level | VARCHAR(50) | Very Satisfactory |
| | status | ENUM('draft', 'submitted', 'approved', 'rejected') | approved |
| | remarks | TEXT | Excellent performance in curriculum planning and delivery |
| FK | evaluated_by | BIGINT UNSIGNED | 10 |
| FK | created_by | BIGINT UNSIGNED | 10 |
| | created_at | TIMESTAMP | 2026-08-20 10:00:00 |
| | updated_at | TIMESTAMP | 2026-08-25 15:30:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`teacher_id`)
- INDEX (`school_year`)
- INDEX (`kra_id`)
- INDEX (`status`)
- FOREIGN KEY (`teacher_id`) REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY (`kra_id`) REFERENCES `kras(id)` ON DELETE RESTRICT
- FOREIGN KEY (`evaluated_by`) REFERENCES `users(id)` ON DELETE SET NULL
- FOREIGN KEY (`created_by`) REFERENCES `users(id)` ON DELETE RESTRICT

**JSON Structure Example:**

```json
// scores
{
  "competency_1": 4.5,
  "competency_2": 4.0,
  "competency_3": 4.2,
  "competency_4": 4.3,
  "objective_1_1": 5.0,
  "objective_1_2": 4.0,
  "objective_2_1": 4.5,
  "objective_2_2": 3.5
}
```

**Performance Level Calculation:**
- 4.50 - 5.00: Outstanding
- 3.50 - 4.49: Very Satisfactory
- 2.50 - 3.49: Satisfactory
- 1.50 - 2.49: Unsatisfactory
- 1.00 - 1.49: Poor

**Sample Data:**

```sql
INSERT INTO ipcrf_ratings 
(id, teacher_id, school_year, kra_id, scores, numerical_rating, performance_level, 
status, remarks, evaluated_by, created_by) 
VALUES 
(1, 1, '2024-2025', 1, 
'{"competency_1":4.5,"competency_2":4.0,"competency_3":4.2,"objective_1_1":5.0}',
4.35, 'Very Satisfactory', 'approved', 
'Excellent performance in curriculum planning and delivery', 10, 10);
```

---

### 4. kras (Key Result Areas)
**Purpose:** Define the main evaluation categories

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| | name | VARCHAR(255) | Content Knowledge and Pedagogy |
| | description | TEXT | Demonstrates mastery of subject matter and effective teaching methods |
| | weight | DECIMAL(5,2) | 20.00 |
| | order | INT | 1 |
| | created_at | TIMESTAMP | 2026-01-01 00:00:00 |
| | updated_at | TIMESTAMP | 2026-01-01 00:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`order`)

**Default KRAs:**
1. Content Knowledge and Pedagogy (20%)
2. Learning Environment and Diversity of Learners (20%)
3. Curriculum and Planning (20%)
4. Assessment and Reporting (20%)
5. Personal Growth and Professional Development (20%)

**Sample Data:**

```sql
INSERT INTO kras (id, name, description, weight, `order`) VALUES 
(1, 'Content Knowledge and Pedagogy', 'Demonstrates mastery of subject matter and effective teaching methods', 20.00, 1),
(2, 'Learning Environment and Diversity of Learners', 'Creates inclusive and engaging learning environments', 20.00, 2),
(3, 'Curriculum and Planning', 'Develops and implements effective lesson plans aligned with standards', 20.00, 3),
(4, 'Assessment and Reporting', 'Uses varied assessment strategies and provides meaningful feedback', 20.00, 4),
(5, 'Personal Growth and Professional Development', 'Engages in continuous professional learning and development', 20.00, 5);
```

---

### 5. competencies
**Purpose:** Define specific competencies within each KRA

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | kra_id | BIGINT UNSIGNED | 1 |
| | name | VARCHAR(255) | Applied knowledge of content within and across curriculum areas |
| | description | TEXT | Teacher demonstrates deep understanding of subject matter |
| | weight | DECIMAL(5,2) | 33.33 |
| | order | INT | 1 |
| | created_at | TIMESTAMP | 2026-01-01 00:00:00 |
| | updated_at | TIMESTAMP | 2026-01-01 00:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`kra_id`)
- INDEX (`order`)
- FOREIGN KEY (`kra_id`) REFERENCES `kras(id)` ON DELETE CASCADE

**Sample Data:**

```sql
INSERT INTO competencies (id, kra_id, name, description, weight, `order`) VALUES 
(1, 1, 'Applied knowledge of content within and across curriculum areas', 
'Teacher demonstrates deep understanding of subject matter', 33.33, 1),
(2, 1, 'Research-based knowledge and principles of teaching and learning', 
'Uses evidence-based teaching strategies', 33.33, 2),
(3, 1, 'Positive use of ICT to facilitate teaching and learning', 
'Integrates technology effectively in instruction', 33.34, 3);
```

---

### 6. objectives
**Purpose:** Define measurable objectives for each competency

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | competency_id | BIGINT UNSIGNED | 1 |
| | description | TEXT | Demonstrates mastery of the subject matter |
| | success_indicator | TEXT | Lessons are aligned with curriculum guide and are error-free |
| | weight | DECIMAL(5,2) | 50.00 |
| | order | INT | 1 |
| | created_at | TIMESTAMP | 2026-01-01 00:00:00 |
| | updated_at | TIMESTAMP | 2026-01-01 00:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`competency_id`)
- INDEX (`order`)
- FOREIGN KEY (`competency_id`) REFERENCES `competencies(id)` ON DELETE CASCADE

**Sample Data:**

```sql
INSERT INTO objectives (id, competency_id, description, success_indicator, weight, `order`) VALUES 
(1, 1, 'Demonstrates mastery of the subject matter', 
'Lessons are aligned with curriculum guide and are error-free', 50.00, 1),
(2, 1, 'Makes connections between content and real-life applications', 
'Uses relevant examples and contexts in teaching', 50.00, 2);
```

---

### 7. ipcrf_surveys
**Purpose:** Store teacher satisfaction survey responses

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | teacher_id | BIGINT UNSIGNED | 1 |
| FK | ipcrf_rating_id | BIGINT UNSIGNED | 1 |
| | school_year | VARCHAR(20) | 2024-2025 |
| | responses | JSON | {"q1_clarity":5,"q2_fairness":4,"q3_timeliness":4} |
| | overall_satisfaction | INT | 5 |
| | comments | TEXT | The evaluation process was fair and well-organized |
| | created_at | TIMESTAMP | 2026-09-01 14:30:00 |
| | updated_at | TIMESTAMP | 2026-09-01 14:30:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`teacher_id`)
- INDEX (`ipcrf_rating_id`)
- INDEX (`school_year`)
- FOREIGN KEY (`teacher_id`) REFERENCES `users(id)` ON DELETE CASCADE
- FOREIGN KEY (`ipcrf_rating_id`) REFERENCES `ipcrf_ratings(id)` ON DELETE CASCADE

**JSON Structure Example:**

```json
// responses
{
  "q1_clarity": 5,
  "q2_fairness": 4,
  "q3_timeliness": 4,
  "q4_feedback_quality": 5,
  "q5_process_ease": 4
}
```

**Rating Scale:** 1-5 (1=Strongly Disagree, 5=Strongly Agree)

**Sample Data:**

```sql
INSERT INTO ipcrf_surveys 
(id, teacher_id, ipcrf_rating_id, school_year, responses, overall_satisfaction, comments) 
VALUES 
(1, 1, 1, '2024-2025', 
'{"q1_clarity":5,"q2_fairness":4,"q3_timeliness":4,"q4_feedback_quality":5,"q5_process_ease":4}',
5, 'The evaluation process was fair and well-organized. Very satisfied with the feedback received.');
```

---

### 8. signed_ipcrfs
**Purpose:** Store finalized and digitally signed IPCRF documents

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | ipcrf_rating_id | BIGINT UNSIGNED | 1 |
| | teacher_signature | TEXT | data:image/png;base64,iVBORw0KGgoAAAANS... |
| | evaluator_signature | TEXT | data:image/png;base64,iVBORw0KGgoAAAANS... |
| | signed_date | DATE | 2026-09-02 |
| | pdf_path | VARCHAR(500) | storage/ipcrfs/2024-2025/ipcrf_teacher_1.pdf |
| | created_at | TIMESTAMP | 2026-09-02 10:00:00 |
| | updated_at | TIMESTAMP | 2026-09-02 10:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`ipcrf_rating_id`)
- INDEX (`signed_date`)
- FOREIGN KEY (`ipcrf_rating_id`) REFERENCES `ipcrf_ratings(id)` ON DELETE CASCADE

**Sample Data:**

```sql
INSERT INTO signed_ipcrfs 
(id, ipcrf_rating_id, teacher_signature, evaluator_signature, signed_date, pdf_path) 
VALUES 
(1, 1, 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...', 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...', 
'2026-09-02', 
'storage/ipcrfs/2024-2025/ipcrf_teacher_1.pdf');
```

---

### 9. audit_logs
**Purpose:** Track all system activities for accountability and security

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | user_id | BIGINT UNSIGNED | 1 |
| | action | VARCHAR(100) | updated |
| | model_type | VARCHAR(100) | IpcrfRating |
| | model_id | BIGINT UNSIGNED | 1 |
| | changes | JSON | {"before":{"status":"draft"},"after":{"status":"submitted"}} |
| | ip_address | VARCHAR(45) | 192.168.1.100 |
| | user_agent | VARCHAR(500) | Mozilla/5.0 (Windows NT 10.0; Win64; x64)... |
| | created_at | TIMESTAMP | 2026-09-02 14:25:30 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`model_type`, `model_id`)
- INDEX (`created_at`)
- FOREIGN KEY (`user_id`) REFERENCES `users(id)` ON DELETE SET NULL

**JSON Structure Example:**

```json
// changes
{
  "before": {
    "status": "draft",
    "numerical_rating": null,
    "performance_level": null
  },
  "after": {
    "status": "submitted",
    "numerical_rating": 4.25,
    "performance_level": "Very Satisfactory"
  }
}
```

**Logged Actions:**
- `created` - New record created
- `updated` - Record modified
- `deleted` - Record deleted
- `login` - User logged in
- `logout` - User logged out
- `approved` - IPCRF approved
- `rejected` - IPCRF rejected
- `signed` - Document signed

**Sample Data:**

```sql
INSERT INTO audit_logs 
(id, user_id, action, model_type, model_id, changes, ip_address, user_agent, created_at) 
VALUES 
(1, 1, 'updated', 'IpcrfRating', 1, 
'{"before":{"status":"draft","numerical_rating":null},"after":{"status":"submitted","numerical_rating":4.25}}',
'192.168.1.100', 
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
'2026-09-02 14:25:30');
```

---

### 10. pending_actions
**Purpose:** Manage workflow notifications and pending tasks

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| FK | user_id | BIGINT UNSIGNED | 10 |
| | action_type | VARCHAR(100) | review_questionnaire |
| | related_model | VARCHAR(100) | TeacherQuestionnaire |
| | related_id | BIGINT UNSIGNED | 5 |
| | status | ENUM('pending', 'completed', 'cancelled') | pending |
| | priority | ENUM('low', 'normal', 'high', 'urgent') | normal |
| | due_date | DATE | 2026-09-10 |
| | message | TEXT | Please review and evaluate teacher's questionnaire submission |
| | created_at | TIMESTAMP | 2026-09-02 09:00:00 |
| | updated_at | TIMESTAMP | 2026-09-02 09:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`status`)
- INDEX (`priority`)
- INDEX (`due_date`)
- FOREIGN KEY (`user_id`) REFERENCES `users(id)` ON DELETE CASCADE

**Action Types:**
- `review_questionnaire` - Admin needs to review teacher submission
- `approve_rating` - Super-admin needs to approve evaluation
- `sign_ipcrf` - Teacher needs to sign finalized IPCRF
- `complete_survey` - Teacher needs to complete satisfaction survey
- `evaluate_teacher` - Admin needs to evaluate teacher performance

**Sample Data:**

```sql
INSERT INTO pending_actions 
(id, user_id, action_type, related_model, related_id, status, priority, due_date, message) 
VALUES 
(1, 10, 'review_questionnaire', 'TeacherQuestionnaire', 5, 'pending', 'normal', 
'2026-09-10', 'Please review and evaluate teacher\'s questionnaire submission for SY 2024-2025'),
(2, 1, 'sign_ipcrf', 'IpcrfRating', 1, 'pending', 'high', 
'2026-09-05', 'Your IPCRF evaluation has been approved. Please sign the document');
```

---

### 11. positions
**Purpose:** Define teaching positions and roles

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| | name | VARCHAR(255) | Teacher III |
| | description | TEXT | Experienced teacher with proven competence |
| | is_teaching | BOOLEAN | 1 (true) |
| | created_at | TIMESTAMP | 2026-01-01 00:00:00 |
| | updated_at | TIMESTAMP | 2026-01-01 00:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`name`)

**Default Positions:**
- Teacher I
- Teacher II
- Teacher III
- Master Teacher I
- Master Teacher II
- Master Teacher III
- Master Teacher IV
- Head Teacher I
- Head Teacher II
- Head Teacher III

**Sample Data:**

```sql
INSERT INTO positions (id, name, description, is_teaching) VALUES 
(1, 'Teacher I', 'Entry-level teaching position', 1),
(2, 'Teacher II', 'Second-level teaching position', 1),
(3, 'Teacher III', 'Experienced teacher with proven competence', 1),
(4, 'Master Teacher I', 'Master teacher - first level', 1),
(5, 'Master Teacher II', 'Master teacher - second level', 1),
(6, 'Head Teacher I', 'Department head position', 1);
```

---

### 12. ipcrf_configurations
**Purpose:** Store system-wide IPCRF configuration settings

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| | key | VARCHAR(100) | current_school_year |
| | value | JSON | {"year":"2024-2025","start_date":"2024-08-01","end_date":"2025-05-31"} |
| | description | TEXT | Current active school year configuration |
| | created_at | TIMESTAMP | 2026-01-01 00:00:00 |
| | updated_at | TIMESTAMP | 2026-08-01 00:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`key`)

**Configuration Examples:**

```json
// key: "rating_scale"
{
  "1": "Poor",
  "2": "Unsatisfactory",
  "3": "Satisfactory",
  "4": "Very Satisfactory",
  "5": "Outstanding"
}

// key: "current_school_year"
{
  "year": "2024-2025",
  "start_date": "2024-08-01",
  "end_date": "2025-05-31"
}

// key: "survey_questions"
[
  "The evaluation process was clear and well-explained",
  "I received fair and objective ratings",
  "The feedback provided was helpful for my development",
  "The timeline for evaluation was appropriate",
  "The digital system was easy to use"
]

// key: "performance_levels"
{
  "outstanding": {"min": 4.50, "max": 5.00},
  "very_satisfactory": {"min": 3.50, "max": 4.49},
  "satisfactory": {"min": 2.50, "max": 3.49},
  "unsatisfactory": {"min": 1.50, "max": 2.49},
  "poor": {"min": 1.00, "max": 1.49}
}
```

**Sample Data:**

```sql
INSERT INTO ipcrf_configurations (id, `key`, `value`, description) VALUES 
(1, 'current_school_year', 
'{"year":"2024-2025","start_date":"2024-08-01","end_date":"2025-05-31"}',
'Current active school year configuration'),
(2, 'rating_scale', 
'{"1":"Poor","2":"Unsatisfactory","3":"Satisfactory","4":"Very Satisfactory","5":"Outstanding"}',
'Rating scale definitions for IPCRF evaluations'),
(3, 'survey_questions',
'["The evaluation process was clear and well-explained","I received fair and objective ratings"]',
'Survey questions for teacher satisfaction assessment');
```

---

## Additional System Tables

### sessions (Laravel Framework Table)
**Purpose:** Store user session data

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | VARCHAR(255) | session_abc123def456ghi789... |
| FK | user_id | BIGINT UNSIGNED | 1 |
| | ip_address | VARCHAR(45) | 192.168.1.1 |
| | user_agent | TEXT | Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 |
| | payload | LONGTEXT | YTozOntzOjY6Il90b2tlbiI7... (serialized session data) |
| | last_activity | INT(11) | 1725314399 |

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`last_activity`)

**Notes:**
- Laravel automatically manages this table
- Stores encrypted session data
- Cleared based on session lifetime configuration

---

### password_reset_tokens (Laravel Framework Table)
**Purpose:** Store password reset tokens

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | email | VARCHAR(255) | juan.delacruz@deped.gov.ph |
| | token | VARCHAR(255) | $2y$10$abc123def456ghi789jkl012mno... |
| | created_at | TIMESTAMP | 2026-09-02 10:30:00 |

**Indexes:**
- PRIMARY KEY (`email`)

**Notes:**
- Tokens expire after configured time (default: 60 minutes)
- Automatically cleaned up after use

---

### failed_jobs (Laravel Framework Table)
**Purpose:** Store failed queue jobs for debugging

**Table Structure:**

| Key | Fields | Data Type | Example |
|-----|--------|-----------|---------|
| PK | id | BIGINT UNSIGNED | 1 |
| | uuid | VARCHAR(255) | 9c5e2c8a-1234-4567-8901-234567890abc |
| | connection | TEXT | database |
| | queue | TEXT | default |
| | payload | LONGTEXT | {"job":"App\\Jobs\\SendEmailNotification",...} |
| | exception | LONGTEXT | RuntimeException: SMTP connection failed... |
| | failed_at | TIMESTAMP | 2026-09-02 11:00:00 |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`uuid`)

**Notes:**
- Used for debugging failed background jobs
- Contains full error stack traces

---

## Relationships

### One-to-Many Relationships

1. **User → TeacherQuestionnaire**
   - One user (teacher) can have multiple questionnaires (one per school year)
   
2. **User → IpcrfRating**
   - One user (teacher) can have multiple IPCRF ratings
   
3. **User → IpcrfSurvey**
   - One user (teacher) can submit multiple surveys
   
4. **KRA → Competency**
   - One KRA contains multiple competencies
   
5. **Competency → Objective**
   - One competency contains multiple objectives
   
6. **IpcrfRating → SignedIpcrf**
   - One IPCRF rating has one signed document (1:1 relationship)

### Many-to-One Relationships

1. **IpcrfRating → User (evaluated_by)**
   - Many ratings evaluated by one admin
   
2. **IpcrfRating → User (created_by)**
   - Many ratings created by one user
   
3. **User → Position**
   - Many users can have the same position

### Polymorphic Relationships

1. **AuditLog**
   - Can track changes for any model (User, IpcrfRating, etc.)

---

## Indexes

### Primary Keys
All tables have an auto-incrementing `id` column as the primary key.

### Foreign Key Indexes
- Automatically created for all foreign key relationships
- Improves JOIN query performance

### Search Indexes
- `users.email` - UNIQUE index for login queries
- `users.division` - INDEX for filtering by division
- `ipcrf_ratings.school_year` - INDEX for year-based queries
- `ipcrf_ratings.status` - INDEX for filtering by status
- `audit_logs.created_at` - INDEX for chronological queries

### Composite Indexes
- `teacher_questionnaires(teacher_id, school_year)` - UNIQUE constraint
- Ensures one questionnaire per teacher per school year

---

## Data Dictionary

### Common Data Types

| Data Type | Usage | Example |
|-----------|-------|---------|
| BIGINT UNSIGNED | Primary keys, Foreign keys | 1, 2, 3 |
| VARCHAR(255) | Short text fields | Names, emails |
| TEXT | Long text fields | Descriptions, comments |
| JSON | Structured data arrays/objects | Ratings, responses |
| ENUM | Fixed set of values | Status values |
| DECIMAL(5,2) | Precise numerical values | 4.25, 3.75 |
| DATE | Date only | 2024-09-02 |
| TIMESTAMP | Date and time | 2024-09-02 14:30:00 |
| BOOLEAN | True/false values | 0, 1 |

### ENUM Values

#### users.teacher_type
- `Proficient`
- `Highly Proficient`
- `Distinguished`

#### ipcrf_ratings.status
- `draft` - Initial creation, not yet submitted
- `submitted` - Teacher has submitted for review
- `approved` - Admin has approved the rating
- `rejected` - Rating needs revision

#### pending_actions.status
- `pending` - Action not yet completed
- `completed` - Action finished
- `cancelled` - Action no longer needed

#### pending_actions.priority
- `low` - Can be addressed later
- `normal` - Standard priority
- `high` - Important, address soon
- `urgent` - Critical, immediate attention

---

## Database Constraints

### NOT NULL Constraints
- Enforce required fields
- Prevent incomplete records

### UNIQUE Constraints
- `users.email` - Each email used once
- `teacher_questionnaires(teacher_id, school_year)` - One questionnaire per year
- `signed_ipcrfs.ipcrf_rating_id` - One signature per rating

### FOREIGN KEY Constraints
- **ON DELETE CASCADE** - Delete related records
  - Example: Deleting a user deletes their questionnaires
  
- **ON DELETE RESTRICT** - Prevent deletion if related records exist
  - Example: Cannot delete KRA if ratings reference it
  
- **ON DELETE SET NULL** - Set foreign key to NULL
  - Example: Deleting admin sets `evaluated_by` to NULL

### CHECK Constraints (MySQL 8.0+)
- Can be added for additional validation
- Example: Ensure `overall_satisfaction` is between 1-5

---

## Sample Queries

### Get Teacher's Complete IPCRF Data
```sql
SELECT 
    u.name AS teacher_name,
    tq.school_year,
    tq.age,
    tq.years_of_service,
    ir.numerical_rating,
    ir.performance_level,
    ir.status
FROM users u
LEFT JOIN teacher_questionnaires tq ON u.id = tq.teacher_id
LEFT JOIN ipcrf_ratings ir ON u.id = ir.teacher_id 
    AND tq.school_year = ir.school_year
WHERE u.id = ? AND tq.school_year = ?;
```

### Get KRA Structure with Competencies
```sql
SELECT 
    k.name AS kra_name,
    k.weight AS kra_weight,
    c.name AS competency_name,
    c.weight AS competency_weight,
    o.description AS objective
FROM kras k
LEFT JOIN competencies c ON k.id = c.kra_id
LEFT JOIN objectives o ON c.id = o.competency_id
ORDER BY k.order, c.order, o.order;
```

### Get Pending Actions for User
```sql
SELECT 
    pa.*,
    u.name AS assigned_to
FROM pending_actions pa
JOIN users u ON pa.user_id = u.id
WHERE pa.user_id = ? 
    AND pa.status = 'pending'
ORDER BY pa.priority DESC, pa.due_date ASC;
```

### Audit Trail for Specific Record
```sql
SELECT 
    al.*,
    u.name AS performed_by
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.model_type = 'IpcrfRating' 
    AND al.model_id = ?
ORDER BY al.created_at DESC;
```

---

**Document Version:** 1.0  
**Last Updated:** September 2, 2026  
**Status:** Technical Documentation
