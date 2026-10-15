# ISAT-DMS Database Schema - Simple Reference

## Description

Quick reference guide for the ISAT-DMS database structure. This simplified version shows the essential tables and their relationships without detailed technical specifications. For complete documentation, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

---

## Core Tables Overview

| Table Name | Purpose | Key Relationships |
|------------|---------|-------------------|
| **users** | Store teacher and admin accounts | → positions |
| **teacher_questionnaires** | Teacher profile and self-assessment | users → |
| **ipcrf_ratings** | Performance evaluation scores | users →, kras →, users (evaluator) |
| **kras** | Key Result Areas (5 main categories) | → competencies |
| **competencies** | Specific competencies per KRA | kras →, → objectives |
| **objectives** | Measurable objectives per competency | competencies → |
| **ipcrf_surveys** | Teacher satisfaction surveys | users →, ipcrf_ratings → |
| **signed_ipcrfs** | Finalized signed documents | ipcrf_ratings → |
| **audit_logs** | System activity tracking | users → |
| **pending_actions** | Workflow notifications | users → |
| **positions** | Teaching positions | → users |
| **ipcrf_configurations** | System settings | (standalone) |

**Legend:** → = "has many" relationship

---

## Table Summaries

### 1. users
**What it stores:** Teacher and administrator accounts

| Key Fields | Description |
|------------|-------------|
| id | Unique user identifier |
| name | Full name |
| email | Login email (unique) |
| password | Encrypted password |
| division | School division |
| teacher_type | Proficient / Highly Proficient / Distinguished |
| current_position_id | Teaching position (Teacher I, II, III, etc.) |

---

### 2. teacher_questionnaires
**What it stores:** Teacher profile information and self-assessment

| Key Fields | Description |
|------------|-------------|
| id | Unique record identifier |
| teacher_id | Which teacher (links to users) |
| school_year | e.g., "2024-2025" |
| age | Teacher's age |
| current_position | Teaching position title |
| bachelor_degree | Educational qualification |
| years_of_service | Years teaching |
| year_level_assignment | Grade level taught |
| subject_taught | Subject area |
| trainings_attended | List of trainings (JSON) |
| kra_ratings | Self-assessed KRA scores (JSON) |
| challenges_faced | List of challenges (JSON) |

**Example Data:**
- Teacher: Juan Dela Cruz
- School Year: 2024-2025
- Position: Teacher III
- Subject: English
- Years of Service: 8

---

### 3. ipcrf_ratings
**What it stores:** Official performance evaluation scores

| Key Fields | Description |
|------------|-------------|
| id | Unique rating identifier |
| teacher_id | Teacher being evaluated |
| school_year | Academic year |
| kra_id | Which KRA is being rated |
| scores | Detailed competency scores (JSON) |
| numerical_rating | Average score (1.00-5.00) |
| performance_level | Outstanding / Very Satisfactory / Satisfactory |
| status | draft / submitted / approved / rejected |
| remarks | Evaluator's comments |
| evaluated_by | Admin who evaluated |

**Performance Levels:**
- 4.50-5.00: Outstanding
- 3.50-4.49: Very Satisfactory
- 2.50-3.49: Satisfactory
- 1.50-2.49: Unsatisfactory
- 1.00-1.49: Poor

---

### 4. kras (Key Result Areas)
**What it stores:** The 5 main evaluation categories

| Key Fields | Description |
|------------|-------------|
| id | KRA identifier (1-5) |
| name | KRA name |
| description | What this KRA measures |
| weight | Percentage weight (usually 20%) |
| order | Display order |

**The 5 KRAs:**
1. Content Knowledge and Pedagogy
2. Learning Environment and Diversity of Learners
3. Curriculum and Planning
4. Assessment and Reporting
5. Personal Growth and Professional Development

---

### 5. competencies
**What it stores:** Specific skills within each KRA

| Key Fields | Description |
|------------|-------------|
| id | Competency identifier |
| kra_id | Which KRA this belongs to |
| name | Competency name |
| description | What this competency measures |
| weight | Weight within the KRA |
| order | Display order |

**Example:**
- KRA: Content Knowledge and Pedagogy
- Competency: "Applied knowledge of content within and across curriculum areas"

---

### 6. objectives
**What it stores:** Measurable goals for each competency

| Key Fields | Description |
|------------|-------------|
| id | Objective identifier |
| competency_id | Which competency this belongs to |
| description | What needs to be achieved |
| success_indicator | How success is measured |
| weight | Weight within the competency |
| order | Display order |

**Example:**
- Competency: Applied knowledge of content
- Objective: "Demonstrates mastery of the subject matter"
- Success Indicator: "Lessons are aligned with curriculum guide and error-free"

---

### 7. ipcrf_surveys
**What it stores:** Teacher feedback about the evaluation process

| Key Fields | Description |
|------------|-------------|
| id | Survey identifier |
| teacher_id | Teacher who completed survey |
| ipcrf_rating_id | Which IPCRF this is about |
| school_year | Academic year |
| responses | Answers to survey questions (JSON) |
| overall_satisfaction | Rating 1-5 (1=worst, 5=best) |
| comments | Additional feedback |

**Survey Topics:**
- Clarity of evaluation process
- Fairness of ratings
- Quality of feedback received
- Ease of using the system

---

### 8. signed_ipcrfs
**What it stores:** Finalized documents with digital signatures

| Key Fields | Description |
|------------|-------------|
| id | Signed document identifier |
| ipcrf_rating_id | Which rating is signed |
| teacher_signature | Teacher's digital signature (image) |
| evaluator_signature | Evaluator's digital signature (image) |
| signed_date | When it was signed |
| pdf_path | Location of PDF file |

---

### 9. audit_logs
**What it stores:** Record of all system activities

| Key Fields | Description |
|------------|-------------|
| id | Log entry identifier |
| user_id | Who performed the action |
| action | What was done (created/updated/deleted) |
| model_type | Which table was affected |
| model_id | Which record was affected |
| changes | What changed (JSON) |
| ip_address | User's IP address |
| user_agent | Browser/device used |
| created_at | When it happened |

**Tracked Actions:**
- User login/logout
- IPCRF submission
- Evaluation completion
- Approval/rejection
- Document signing

---

### 10. pending_actions
**What it stores:** Tasks and notifications for users

| Key Fields | Description |
|------------|-------------|
| id | Action identifier |
| user_id | Who needs to do this |
| action_type | What needs to be done |
| related_model | Which table this relates to |
| related_id | Which record |
| status | pending / completed / cancelled |
| priority | low / normal / high / urgent |
| due_date | Deadline |
| message | Description of task |

**Action Types:**
- review_questionnaire
- approve_rating
- sign_ipcrf
- complete_survey
- evaluate_teacher

---

### 11. positions
**What it stores:** Teaching position titles

| Key Fields | Description |
|------------|-------------|
| id | Position identifier |
| name | Position title |
| description | Job description |
| is_teaching | Is this a teaching position? |

**Position Examples:**
- Teacher I, Teacher II, Teacher III
- Master Teacher I-IV
- Head Teacher I-III

---

### 12. ipcrf_configurations
**What it stores:** System-wide settings

| Key Fields | Description |
|------------|-------------|
| id | Config identifier |
| key | Setting name |
| value | Setting value (JSON) |
| description | What this setting does |

**Configuration Examples:**
- Current school year
- Rating scale definitions
- Survey questions
- Performance level thresholds
- Email templates

---

## Relationships Diagram (Simplified)

```
users (Teachers & Admins)
    ├─→ teacher_questionnaires (profile data)
    ├─→ ipcrf_ratings (evaluations)
    ├─→ ipcrf_surveys (feedback)
    ├─→ audit_logs (activity tracking)
    ├─→ pending_actions (tasks)
    └─→ positions (job titles)

kras (5 categories)
    └─→ competencies (skills)
        └─→ objectives (goals)

ipcrf_ratings
    └─→ signed_ipcrfs (final documents)
```

---

## Data Flow Example

**Complete IPCRF Workflow:**

1. **Teacher submits profile** → `teacher_questionnaires` table
2. **Admin evaluates performance** → `ipcrf_ratings` table (with KRA scores)
3. **System creates notification** → `pending_actions` table (for approval)
4. **Super-admin approves** → `ipcrf_ratings.status` = 'approved'
5. **Both parties sign** → `signed_ipcrfs` table
6. **Teacher completes survey** → `ipcrf_surveys` table
7. **All actions logged** → `audit_logs` table

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Core Tables** | 12 |
| **System Tables** | 3 (sessions, password_resets, failed_jobs) |
| **User Roles** | 3 (Teacher, Admin, Super-Admin) |
| **KRAs** | 5 (equally weighted at 20% each) |
| **Rating Scale** | 1-5 (Poor to Outstanding) |
| **Performance Levels** | 5 (Poor to Outstanding) |

---

## Database Size Estimates

### Small School (100 teachers)
- Users: ~100 records
- Questionnaires: ~100/year
- IPCRF Ratings: ~500/year (5 KRAs per teacher)
- Storage: ~50 MB/year

### Medium School (500 teachers)
- Users: ~500 records
- Questionnaires: ~500/year
- IPCRF Ratings: ~2,500/year
- Storage: ~250 MB/year

### Large Division (2000 teachers)
- Users: ~2,000 records
- Questionnaires: ~2,000/year
- IPCRF Ratings: ~10,000/year
- Storage: ~1 GB/year

---

## Common Queries

### Get Teacher's Current Rating
```sql
SELECT numerical_rating, performance_level, status
FROM ipcrf_ratings
WHERE teacher_id = 1 AND school_year = '2024-2025';
```

### Get All Pending Actions for User
```sql
SELECT action_type, message, due_date, priority
FROM pending_actions
WHERE user_id = 10 AND status = 'pending'
ORDER BY priority DESC, due_date ASC;
```

### Get Complete IPCRF Structure
```sql
SELECT k.name as kra, c.name as competency, o.description as objective
FROM kras k
JOIN competencies c ON k.id = c.kra_id
JOIN objectives o ON c.id = o.competency_id
ORDER BY k.order, c.order, o.order;
```

---

## For More Details

See the complete technical documentation: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

Includes:
- Detailed field specifications
- All indexes and constraints
- JSON structure examples
- Sample SQL queries
- Entity relationship diagrams
- Performance optimization tips

---

**Document Version:** 1.0  
**Last Updated:** September 2, 2026  
**Status:** Quick Reference Guide
