#!/usr/bin/env python3
"""
Migration script: Create skills table and insert LSAT skill taxonomy.
Run from backend directory: python db/migrate_skills.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import get_db_connection, get_db_cursor
from utils import generate_id

# LR Skills - Logical Reasoning
LR_SKILLS = [
    # DOMAIN I: STRUCTURAL DECOMPOSITION
    {"skill_id": "S_01", "skill_name": "Main Conclusion ID", "category": "Structural Decomposition",
     "description": "Distinguishing the final claim from intermediate conclusions."},
    {"skill_id": "S_02", "skill_name": "Role Identification", "category": "Structural Decomposition",
     "description": "Identifying the rhetorical function of a specific sentence."},
    {"skill_id": "S_03", "skill_name": "Disagreement Isolation", "category": "Structural Decomposition",
     "description": "Pinpointing the exact proposition where two speakers differ."},
    {"skill_id": "S_04", "skill_name": "Intermediate Conclusion Recognition", "category": "Structural Decomposition",
     "description": "Identifying claims that are both supported by premises AND used to support further conclusions."},

    # DOMAIN II: FORMAL & DEDUCTIVE LOGIC
    {"skill_id": "FL_01", "skill_name": "Conditional Translation", "category": "Formal & Deductive Logic",
     "description": "Converting text (unless, only if) into symbolic notation (A -> B)."},
    {"skill_id": "FL_02", "skill_name": "Contrapositive Operations", "category": "Formal & Deductive Logic",
     "description": "Recognizing that A -> B is logically identical to ~B -> ~A."},
    {"skill_id": "FL_03", "skill_name": "Chain/Transitive Deduction", "category": "Formal & Deductive Logic",
     "description": "Linking variables across statements (A -> B -> C, therefore A -> C)."},
    {"skill_id": "FL_04", "skill_name": "Quantifier Scope", "category": "Formal & Deductive Logic",
     "description": "Distinguishing force: All (100%), Most (>50%), Some (1-100%), None (0%)."},
    {"skill_id": "FL_05", "skill_name": "Quantifier Intersection", "category": "Formal & Deductive Logic",
     "description": "Deducing overlaps (e.g., If Most A are B, and All B are C -> Some A are C)."},
    {"skill_id": "FL_06", "skill_name": "Modal Precision", "category": "Formal & Deductive Logic",
     "description": "Distinguishing between Must, Likely, and Could."},
    {"skill_id": "FL_07", "skill_name": "Conditional Fallacies", "category": "Formal & Deductive Logic",
     "description": "Recognizing the error of reversing (B -> A) or negating (~A -> ~B) without a biconditional relationship."},

    # DOMAIN III: RHETORICAL & INDUCTIVE EVALUATION
    {"skill_id": "RH_01", "skill_name": "Causality vs. Correlation", "category": "Rhetorical & Inductive Evaluation",
     "description": "Identifying the flaw of assuming causation based on occurrence."},
    {"skill_id": "RH_02", "skill_name": "Alternative Explanations", "category": "Rhetorical & Inductive Evaluation",
     "description": "Recognizing a third factor (Z) or reversal (Y caused X)."},
    {"skill_id": "RH_03", "skill_name": "Sufficiency Gaps", "category": "Rhetorical & Inductive Evaluation",
     "description": "Identifying a premise that guarantees the conclusion (100% valid)."},
    {"skill_id": "RH_04", "skill_name": "Necessity Gaps", "category": "Rhetorical & Inductive Evaluation",
     "description": "Identifying a condition required for the argument to survive."},
    {"skill_id": "RH_05", "skill_name": "Sampling Validity", "category": "Rhetorical & Inductive Evaluation",
     "description": "Critiquing the representativeness or size of a sample/survey."},
    {"skill_id": "RH_06", "skill_name": "Ad Hominem / Source Attacks", "category": "Rhetorical & Inductive Evaluation",
     "description": "Distinguishing attacks on character/motive from attacks on logic."},
    {"skill_id": "RH_07", "skill_name": "Evidential Weight Assessment", "category": "Rhetorical & Inductive Evaluation",
     "description": "Comparing how strongly different pieces of evidence support a claim."},
    {"skill_id": "RH_08", "skill_name": "Scope Shift Recognition", "category": "Rhetorical & Inductive Evaluation",
     "description": "Identifying when a conclusion's scope exceeds the evidence."},

    # DOMAIN IV: SYSTEMIC ABSTRACTION
    {"skill_id": "ABS_01", "skill_name": "Structural Matching", "category": "Systemic Abstraction",
     "description": "Matching valid logical structure to a new scenario (Parallel Reasoning)."},
    {"skill_id": "ABS_02", "skill_name": "Flaw Matching", "category": "Systemic Abstraction",
     "description": "Matching a specific logical error to a new scenario (Parallel Flaw)."},
    {"skill_id": "ABS_03", "skill_name": "Principle Application", "category": "Systemic Abstraction",
     "description": "Applying a broad rule to a specific factual case."},
]

# RC Skills - Reading Comprehension
RC_SKILLS = [
    # DOMAIN I: MACRO-STRUCTURAL
    {"skill_id": "RC_01", "skill_name": "Global Thesis ID", "category": "Macro-Structural",
     "description": "Synthesizing the main argument of the entire text."},
    {"skill_id": "RC_02", "skill_name": "Authorial Purpose", "category": "Macro-Structural",
     "description": "Identifying the rhetorical reason the text was written."},
    {"skill_id": "RC_03", "skill_name": "Passage Architecture", "category": "Macro-Structural",
     "description": "Identifying how paragraphs function in relation to each other."},

    # DOMAIN II: MICRO-SYNTACTIC
    {"skill_id": "RC_04", "skill_name": "Detail Retrieval", "category": "Micro-Syntactic",
     "description": "Locating explicit facts. The answer is 'on the page.'"},
    {"skill_id": "RC_05", "skill_name": "Logical Function", "category": "Micro-Syntactic",
     "description": "Identifying why an example/sentence was included."},

    # DOMAIN III: INFERENTIAL SYNTHESIS
    {"skill_id": "RC_06", "skill_name": "Viewpoint Tracking", "category": "Inferential Synthesis",
     "description": "Distinguishing which claims belong to the author versus other sources."},
    {"skill_id": "RC_07", "skill_name": "Inference", "category": "Inferential Synthesis",
     "description": "Deducing a claim that is not written but must be true based on the text."},
    {"skill_id": "RC_08", "skill_name": "Tone/Attitude", "category": "Inferential Synthesis",
     "description": "Identifying subjective opinion (Positive/Negative/Neutral/Ambivalent)."},
    {"skill_id": "RC_09", "skill_name": "Analogy/Application", "category": "Inferential Synthesis",
     "description": "Abstracting the passage's principle and mapping it to a new, parallel scenario."},
    {"skill_id": "RC_10", "skill_name": "New Info Impact", "category": "Inferential Synthesis",
     "description": "Assessing how outside facts affect the author's argument."},

    # DOMAIN IV: COMPARATIVE DYNAMICS
    {"skill_id": "RC_11", "skill_name": "Comparative Relationship", "category": "Comparative Dynamics",
     "description": "Describing the structural relationship between Passage A and B."},
    {"skill_id": "RC_12", "skill_name": "Cross-Reference / Agreement", "category": "Comparative Dynamics",
     "description": "Identifying points of overlap (agreement) or contention (disagreement) between authors."},
]


def create_skills_table():
    """Create the skills table if it doesn't exist."""
    create_sql = """
    CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(50) PRIMARY KEY,
        skill_id VARCHAR(20) UNIQUE NOT NULL,
        skill_name VARCHAR(255) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        sub_domain VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
    CREATE INDEX IF NOT EXISTS idx_skills_sub_domain ON skills(sub_domain);
    CREATE INDEX IF NOT EXISTS idx_skills_domain_sub_domain ON skills(domain, sub_domain);
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    # Execute each statement separately
    for statement in create_sql.strip().split(';'):
        if statement.strip():
            cursor.execute(statement)

    conn.commit()
    cursor.close()
    print("Skills table created successfully")


def insert_skills(skills: list, domain: str, sub_domain: str):
    """Insert skills into the database."""
    insert_sql = """
        INSERT INTO skills (id, skill_id, skill_name, domain, sub_domain, category, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (skill_id) DO UPDATE SET
            skill_name = EXCLUDED.skill_name,
            domain = EXCLUDED.domain,
            sub_domain = EXCLUDED.sub_domain,
            category = EXCLUDED.category,
            description = EXCLUDED.description
    """

    inserted = 0
    with get_db_cursor() as cursor:
        for skill in skills:
            pk_id = generate_id("skill")
            cursor.execute(insert_sql, (
                pk_id,
                skill["skill_id"],
                skill["skill_name"],
                domain,
                sub_domain,
                skill["category"],
                skill["description"]
            ))
            inserted += 1

    print(f"Inserted/updated {inserted} {sub_domain} skills")
    return inserted


def verify_skills():
    """Verify skills were inserted correctly."""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT sub_domain, COUNT(*) as count FROM skills GROUP BY sub_domain")
        rows = cursor.fetchall()

        print("\nSkills summary:")
        for row in rows:
            print(f"  {row['sub_domain']}: {row['count']} skills")

        cursor.execute("SELECT COUNT(*) as total FROM skills")
        total = cursor.fetchone()['total']
        print(f"  Total: {total} skills")


def main():
    print("=" * 50)
    print("LSAT Skills Migration")
    print("=" * 50)

    # Step 1: Create table
    print("\n[1/4] Creating skills table...")
    create_skills_table()

    # Step 2: Insert LR skills
    print("\n[2/4] Inserting Logical Reasoning skills...")
    insert_skills(LR_SKILLS, domain="LSAT", sub_domain="LR")

    # Step 3: Insert RC skills
    print("\n[3/4] Inserting Reading Comprehension skills...")
    insert_skills(RC_SKILLS, domain="LSAT", sub_domain="RC")

    # Step 4: Verify
    print("\n[4/4] Verifying insertion...")
    verify_skills()

    print("\n" + "=" * 50)
    print("Migration complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()
