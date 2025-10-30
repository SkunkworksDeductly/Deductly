# Adaptive Study Plan Integration Guide

This guide explains how to integrate the adaptive study plan system into your Deductly backend.

## Files Created

1. **Database Schema**: `backend/db/schema_adaptive_plan.py`
2. **Module Library**: `backend/data/modules_library.json`
3. **Bandit Algorithm**: `backend/personalization/bandit.py`
4. **Helper Functions**: `backend/personalization/adaptive_helpers.py`
5. **Core Planner**: `backend/personalization/adaptive_planner.py`
6. **Routes**: `backend/personalization/routes_adaptive.py`

## Step-by-Step Integration

### 1. Apply Database Migration

First, add the new tables to your database:

```bash
cd backend/db
python schema_adaptive_plan.py migrate
```

This will add:
- `modules` table
- `bandit_models` table
- `mastery_vector_history` table
- `module_completions` table
- New columns to `study_plans` and `study_plan_tasks`

**Verify migration:**
```bash
sqlite3 ../data/deductly.db "SELECT name FROM sqlite_master WHERE type='table';"
```

You should see the new tables listed.

### 2. Update app.py to Use Adaptive Routes

**Option A: Switch completely to adaptive routes**

In `backend/app.py`, replace:
```python
from personalization.routes import personalization_bp
```

with:
```python
from personalization.routes_adaptive import personalization_bp
```

**Option B: Run both side-by-side (recommended for testing)**

```python
# Import both blueprints with different names
from personalization.routes import personalization_bp as personalization_bp_old
from personalization.routes_adaptive import personalization_bp as personalization_bp_adaptive

# Register both (with different URL prefixes)
app.register_blueprint(personalization_bp_old, url_prefix='/api/personalization/v1')
app.register_blueprint(personalization_bp_adaptive, url_prefix='/api/personalization/v2')
```

This allows you to test the adaptive version at `/api/personalization/v2/*` while keeping the old version at `/api/personalization/v1/*`.

### 3. Test the Adaptive System

#### Generate an Adaptive Study Plan

```bash
curl -X POST http://localhost:5001/api/personalization/v2/study-plan/generate \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"total_weeks": 10}'
```

Expected response:
```json
{
  "study_plan_id": "sp-abc123",
  "user_id": "user123",
  "total_weeks": 10,
  "total_tasks": 28,
  "start_date": "2025-10-30",
  "phase_allocation": [3, 4, 3],
  "message": "Adaptive study plan generated successfully",
  "adaptive": true,
  "algorithm": "Thompson Sampling + Hierarchical Planning"
}
```

#### Get Study Plan

```bash
curl -X GET http://localhost:5001/api/personalization/v2/study-plan \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

#### Trigger Weekly Adaptation

```bash
curl -X POST http://localhost:5001/api/personalization/v2/study-plan/adapt \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed_week": 1}'
```

Expected response:
```json
{
  "status": "success",
  "week_completed": 1,
  "rewards": [0.15, 0.23, 0.08],
  "avg_reward": 0.153,
  "num_modules": 3,
  "next_phase": "foundation",
  "exploration_rate": 0.85
}
```

#### Check Bandit Status

```bash
curl -X GET http://localhost:5001/api/personalization/v2/bandit/status \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

Expected response:
```json
{
  "user_id": "user123",
  "num_updates": 3,
  "exploration_rate": 0.85,
  "dimension": 100,
  "noise_variance": 0.1,
  "has_learned": true
}
```

## New API Endpoints

### `/api/personalization/v2/study-plan/generate` (POST)
Generate adaptive study plan using contextual bandit.

**Body:**
```json
{
  "total_weeks": 10,  // Optional, default 10
  "target_test_date": "2025-12-15"  // Optional, ISO date
}
```

### `/api/personalization/v2/study-plan/adapt` (POST)
Trigger weekly adaptation (update bandit, replan future weeks).

**Body:**
```json
{
  "completed_week": 1  // Required, week number just completed
}
```

### `/api/personalization/v2/bandit/status` (GET)
Get bandit model status for debugging.

### `/api/personalization/v2/module-library` (GET)
Get module library (with optional filters).

**Query params:**
- `phase`: Filter by phase (foundation/practice/mastery)
- `difficulty`: Filter by difficulty level

## Frontend Integration

### Update Study Plan Page

In `src/pages/StudyPlan.jsx`, update the API endpoint:

```javascript
// Old (v1)
const response = await api.post('/personalization/study-plan/generate');

// New (v2 - adaptive)
const response = await api.post('/personalization/v2/study-plan/generate', {
  total_weeks: 10,
  target_test_date: '2025-12-15'  // Optional
});
```

### Add Weekly Adaptation Trigger

Add a button to trigger adaptation when user completes a week:

```javascript
const handleWeekComplete = async (weekNumber) => {
  try {
    const response = await api.post('/personalization/v2/study-plan/adapt', {
      completed_week: weekNumber
    });

    console.log('Adaptation result:', response.data);

    // Reload study plan to see updated weeks
    await fetchStudyPlan();

    // Show success message
    alert(`Week ${weekNumber} completed! Your plan has been updated based on your performance.`);
  } catch (error) {
    console.error('Error adapting plan:', error);
  }
};
```

### Display Adaptive Features

Show users that they have an adaptive plan:

```javascript
{studyPlan.adaptive && (
  <div className="bg-blue-50 p-4 rounded-lg mb-4">
    <h3 className="font-semibold text-blue-900">🤖 Adaptive Study Plan</h3>
    <p className="text-sm text-blue-700">
      Your plan adapts weekly based on your performance using AI.
    </p>
    <p className="text-xs text-blue-600 mt-2">
      Algorithm: {studyPlan.algorithm}
    </p>
  </div>
)}
```

## Configuration

### Tuning Hyperparameters

You can adjust bandit hyperparameters in `adaptive_planner.py`:

```python
# In generate_adaptive_study_plan()
bandit_model = BayesianLinearBandit(
    dimension=100,
    prior_mean=np.zeros(100),
    prior_cov=np.eye(100) * 1.0,  # Adjust this for more/less exploration
    noise_variance=0.1             # Adjust this for learning speed
)
```

- **Higher prior_cov** (e.g., 2.0): More exploration early on
- **Lower prior_cov** (e.g., 0.5): Faster convergence, less exploration
- **Higher noise_variance** (e.g., 0.2): Slower learning, more robust to outliers
- **Lower noise_variance** (e.g., 0.05): Faster learning, more sensitive to noise

### Customizing Module Library

Edit `backend/data/modules_library.json` to:
- Add new modules
- Adjust difficulty levels
- Change phase suitability
- Update prerequisites
- Modify learning objectives

## Rollback Plan

If you need to rollback to the old system:

1. **Switch back to old routes** in `app.py`:
   ```python
   from personalization.routes import personalization_bp
   ```

2. **Database is backward compatible** - new columns are nullable, so old code still works

3. **Keep both versions running** - Option B above lets you run both simultaneously

## Monitoring

### Check Bandit Learning

Monitor how well the bandit is learning:

```python
# In Python console
from personalization.adaptive_planner import load_bandit_model

bandit = load_bandit_model('user_id_here')
print(f"Updates: {bandit.num_updates}")
print(f"Exploration rate: {bandit.get_exploration_rate()}")
```

### View Module Completions

```sql
SELECT
    user_id,
    module_id,
    week_number,
    reward,
    completion_rate,
    completed_at
FROM module_completions
ORDER BY completed_at DESC
LIMIT 10;
```

### View Mastery History

```sql
SELECT
    user_id,
    trigger_event,
    timestamp,
    mastery_vector
FROM mastery_vector_history
WHERE user_id = 'user_id_here'
ORDER BY timestamp DESC;
```

## Troubleshooting

### Issue: "Module not found" errors

**Solution:** Ensure PYTHONPATH includes backend directory:
```bash
export PYTHONPATH=/home/aniru/dev/Deductly/backend:$PYTHONPATH
```

### Issue: Database errors about missing columns

**Solution:** Run the migration:
```bash
python backend/db/schema_adaptive_plan.py migrate
```

### Issue: Bandit returns same modules every week

**Solution:** Check exploration rate. If too low, reset the bandit:
```python
from personalization.adaptive_planner import load_bandit_model, save_bandit_model

bandit = load_bandit_model(user_id)
bandit.reset()  # Reset to prior
save_bandit_model(user_id, bandit)
```

### Issue: Rewards are always near zero

**Solution:** Verify mastery vector is being updated after drills. Check that insights layer is calling GLMM updates.

## Next Steps

1. ✅ Apply database migration
2. ✅ Test adaptive plan generation
3. ✅ Test weekly adaptation
4. ⬜ Update frontend to use v2 endpoints
5. ⬜ Add UI for weekly adaptation trigger
6. ⬜ Monitor bandit learning over time
7. ⬜ A/B test adaptive vs fixed plans
8. ⬜ Tune hyperparameters based on data

## Support

For issues or questions:
- Check logs in backend console
- Review `adaptive_study_plan_design.txt` for algorithm details
- Examine test functions in each module (`if __name__ == "__main__"`)
