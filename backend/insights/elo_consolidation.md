# Elo System Consolidation

This document consolidates the Elo-based per-skill ability estimation system, reviewing the theory, implementation status, identified issues, and next steps.

---

## 1. Theory Review

### 1.1 Core Algorithm Assessment

The Elo algorithm in `elo_context_revised.md` is **theoretically sound**:

| Component | Formula | Assessment |
|-----------|---------|------------|
| Expected Score | `P = 1/(1 + 10^((D_q - R_u)/400))` | Standard Elo formula with 400-scale |
| User Update | `R' = R + K × w × (S - P)` | Correct weighted update for multi-skill |
| Question Update | `D' = D - K × (S - P)` | Correct (negative sign for difficulty) |
| K-factor Decay | `K = BASE_K / sqrt(n + 1)` | Common decay pattern, stabilizes over time |

### 1.2 Multi-Skill Handling

The approach of computing an **effective user rating** as a weighted average is reasonable:

```
R_u_eff = Σ(w_i × R_u,skill_i)
```

This assumes skills contribute linearly and independently to question difficulty, which is a reasonable simplification for LSAT.

### 1.3 Two-Layer Difficulty Model

The hybrid approach (batch Rasch + online delta) is well-designed:
- **Batch layer**: Provides psychometrically grounded difficulty estimates
- **Online layer**: Responds to immediate feedback between batch runs
- **Delta bounds (±100)**: Prevents runaway drift

### 1.4 Theoretical Concerns

1. **Weight Normalization**: The system assumes `Σ w_i = 1` but this isn't validated at runtime
2. **Effective Rating Interpretation**: For skills with very different ratings, the weighted average may not accurately reflect "ability to answer this question"
3. **Cold Start**: New users start at 1500 for all skills - no consideration for diagnostic placement

---

## 2. Implementation Status

### 2.1 Completed Components

| Component | Location | Status |
|-----------|----------|--------|
| Core Elo dataclasses | `elo_system.py:15-44` | Done |
| Update algorithm | `elo_system.py:65-158` | Done |
| DB schema (user_elo_ratings) | `schema.py:208-218` | Done |
| DB schema (question_elo_ratings) | `schema.py:224-230` | Done |
| Integration: `elo_online_update()` | `logic.py:589-650` | Done |
| Integration: `fetch_user_elo_ratings()` | `logic.py:412-449` | Done |
| Integration: `fetch_question_elo_data()` | `logic.py:467-558` | Done |
| Integration: `persist_user_elo_rating()` | `logic.py:561-586` | Done |
| Skill ID mapping helpers | `logic.py:452-464` | Done |

### 2.2 Not Completed

| Component | Location | Status |
|-----------|----------|--------|
| API Routes | `routes.py:77-106` | Commented out |
| Display scaling (`elo_to_display`) | N/A | Not implemented |
| Batch Rasch job | N/A | Design only |
| Monitoring/alerting | N/A | Design only |
| Unit tests | N/A | Not written |
| Question rating persistence | `logic.py:630` | Disabled (`update_question=False`) |

---

## 3. Identified Issues

### 3.1 Critical Issues

#### Issue 1: Type Mismatch Between Elo System and App

**Problem**: `elo_system.py` dataclasses use `int` for `user_id` and `skill_id`, but the app uses `str` throughout.

**Current Workaround**: `logic.py` uses hash functions and mapping helpers:
```python
q_obj = Question(
    id=hash(question_id) % 1000000,  # Mock int ID
    ...
)
```

**Risk**: Hash collisions, confusion, maintenance burden.

**Decision**: Modify `elo_system.py` to use `str` for IDs. This is cleaner and eliminates the need for hash-based mapping.

#### Issue 2: Routes Not Active

**Problem**: Elo API endpoints in `routes.py:77-106` are commented out, and imports are missing.

**Impact**: Cannot use the Elo system through the API.

**Fix Required**: Uncomment routes and add imports for `fetch_user_elo_ratings` and `elo_online_update`.

### 3.2 Moderate Issues

#### Issue 3: Weight Normalization Not Validated

**Problem**: `fetch_question_elo_data()` applies a heuristic (70% primary, 30% secondary) but has edge cases:

```python
# Lines 512-526 in logic.py
if not secondaries and primaries:
    for qs in q_skills: qs.weight = 1.0 / len(primaries)
elif not primaries and secondaries:
    for qs in q_skills: qs.weight = 1.0 / len(secondaries)
```

If there are both primary and secondary skills but the heuristic branch runs, weights may not sum to 1.

**Recommendation**: Add explicit normalization after weight assignment:
```python
total_weight = sum(qs.weight for qs in q_skills)
if total_weight > 0:
    for qs in q_skills:
        qs.weight /= total_weight
```

#### Issue 4: Question Rating Updates Disabled - RESOLVED

**Status**: `update_question=False` is **intentional**.

**Rationale**: Question difficulty is derived from Rasch b-values. The b-values are updated through the batch Rasch IRT process, not through online Elo updates. This separation keeps:
- **Elo**: Responsible for user skill ratings only
- **Rasch IRT**: Responsible for question difficulty calibration

The `question_elo_ratings` table can be removed or repurposed, as the online delta adjustment is not used.

### 3.3 Minor Issues

#### Issue 6: No Display Scaling Implementation

The design doc specifies LSAT-style display scores (120-180), but `scaling.py` functions aren't implemented.

#### Issue 7: Missing Error Handling

`fetch_question_elo_data()` raises `ValueError` for missing questions but this could cause API 500 errors.

---

## 4. Recommended Improvements

### 4.1 Immediate Fixes (Before MVP)

1. **Fix type handling**: Either change `elo_system.py` to use strings or document the mapping strategy
2. **Uncomment and enable routes** in `routes.py`
3. **Add weight normalization** in `fetch_question_elo_data()`
4. **Decide on question updates**: Enable or document why disabled

### 4.2 Short-term Improvements

1. **Implement display scaling**: Add `elo_to_display()` for user-facing scores
2. **Add `persist_question_elo_rating()`** if question updates are enabled
3. **Add input validation**: Ensure weights sum to 1, ratings are reasonable
4. **Add logging**: Track updates for debugging and monitoring

### 4.3 Medium-term Improvements

1. **Implement batch Rasch job**: Reset deltas and recalibrate from IRT
2. **Add monitoring dashboard**: Track rating distributions, calibration accuracy
3. **Unit tests**: Cover all core functions

### 4.4 Algorithm Enhancements (Optional)

1. **Diagnostic placement**: Use initial diagnostic results to set starting ratings
2. **Confidence intervals**: Track uncertainty alongside point estimates
3. **Temporal decay**: Consider recency weighting for older responses

---

## 5. Next Steps Checklist

### Phase 1: Fix Critical Issues
- [ ] Resolve type mismatch (choose string IDs or document int mapping)
- [ ] Enable API routes (uncomment, add imports)
- [ ] Fix weight normalization edge cases
- [ ] Decide on question updates (enable or document rationale)

### Phase 2: Complete Core Implementation
- [ ] Add `persist_question_elo_rating()` (if enabling question updates)
- [ ] Implement `elo_to_display()` for user-facing scores
- [ ] Add proper error handling in API routes
- [ ] Add logging for Elo updates

### Phase 3: Testing & Validation
- [ ] Write unit tests for `expected_score()`, `adaptive_k()`, `update_elo()`
- [ ] Write integration tests for `elo_online_update()`
- [ ] Validate against worked example from design doc
- [ ] Test edge cases (new users, extreme ratings, missing skills)

### Phase 4: Decommission GLMM
- [ ] Migrate existing users from GLMM mastery to Elo ratings (if applicable)
- [ ] Update any frontend code that consumes GLMM endpoints
- [ ] Remove or deprecate GLMM routes and logic

### Phase 5: Monitoring & Batch Jobs
- [ ] Implement batch Rasch job (nightly/weekly)
- [ ] Add monitoring for alert conditions (delta bounds, extreme ratings)
- [ ] Add calibration tracking (predicted vs actual accuracy)

---

## 6. Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `insights/elo_system.py` | Core algorithm, dataclasses |
| `insights/logic.py:402-650` | Database integration layer |
| `insights/routes.py:77-106` | API endpoints (commented) |
| `db/schema.py:208-230` | Database tables |
| `insights/elo_context_revised.md` | Design documentation |

### Entry Points

- **Online update**: `logic.py:elo_online_update()` - Main entry for processing responses
- **Fetch ratings**: `logic.py:fetch_user_elo_ratings()` - Retrieve user's current ratings
- **API** (when enabled): `POST /api/insights/online/elo/update/<user_id>`, `GET /api/insights/elo/<user_id>`

---

## 7. Migration Strategy (GLMM to Elo)

### Option A: Clean Slate
- New users get Elo-only
- Existing GLMM users start fresh at 1500 for Elo
- Keep GLMM data for historical reference

### Option B: Convert GLMM Mastery to Elo
- Map GLMM mastery probabilities (0-1) to Elo ratings:
  ```python
  def mastery_to_elo(mastery_prob):
      # Map 0.5 -> 1500, 0 -> 1200, 1 -> 1800
      return 1500 + (mastery_prob - 0.5) * 600
  ```
- Preserves relative skill strengths

**Decision**: Option A (Clean Slate). All users will start at 1500 for Elo ratings. GLMM data remains for historical reference but is no longer used for active ability estimation.

---

*Document generated: 2026-01-09*
*Last reviewed: Pending*
