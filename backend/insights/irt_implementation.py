import torch
import math




def _sigmoid(x):
    return torch.sigmoid(x)


@torch.no_grad()
def rasch_fit_torch(
    user_ids: torch.Tensor,     # (N,) long
    item_ids: torch.Tensor,     # (N,) long
    responses: torch.Tensor,    # (N,) 0/1 float
    n_users: int,
    n_items: int,
    *,
    max_outer: int = 50,
    tol: float = 1e-5,
    theta_prior_mean: float = 0.0,
    theta_prior_var: float = 1.0, 
    b_prior_mean: float = 0.0,
    b_prior_var: float = 10.0,
    device: str = "cpu",
    dtype: torch.dtype = torch.float64,
):
    """
    Joint MAP for Rasch: P(y=1|u,i) = sigmoid(theta[u] - b[i])
    Alternates Newton updates over all thetas then all bs (1D per param).
    """
    assert user_ids.shape == item_ids.shape == responses.shape
    user_ids = user_ids.to(device)
    item_ids = item_ids.to(device)
    responses = responses.to(device).to(dtype)

    theta = torch.zeros(n_users, device=device, dtype=dtype)
    b = torch.zeros(n_items, device=device, dtype=dtype)

    # Precompute index buckets
    by_user = [[] for _ in range(n_users)]
    by_item = [[] for _ in range(n_items)]
    for k in range(user_ids.numel()):
        by_user[user_ids[k].item()].append(k)
        by_item[item_ids[k].item()].append(k)

    inv_theta_var = (1.0 / theta_prior_var) if theta_prior_var > 0 else 1e-12
    inv_b_var     = (1.0 / b_prior_var)     if b_prior_var > 0 else 1e-12
    tpm = torch.as_tensor(theta_prior_mean, device=device, dtype=dtype)
    bpm = torch.as_tensor(b_prior_mean, device=device, dtype=dtype)

    def update_thetas(theta, b):
        new_theta = theta.clone()
        for u in range(n_users):
            idx = by_user[u]
            if not idx:
                new_theta[u] = tpm
                continue
            k = torch.tensor(idx, device=device, dtype=torch.long)
            i_idx = item_ids[k]
            r = responses[k]
            logits = theta[u] - b[i_idx]
            p = _sigmoid(logits)
            g = torch.sum(r - p) - (theta[u] - tpm) * inv_theta_var
            H = -torch.sum(p * (1.0 - p)) - inv_theta_var
            step = 0.0 if H == 0 else (g / H).item()
            new_theta[u] = theta[u] - step
        return new_theta

    def update_items(theta, b):
        new_b = b.clone()
        for i in range(n_items):
            idx = by_item[i]
            if not idx:
                new_b[i] = bpm
                continue
            k = torch.tensor(idx, device=device, dtype=torch.long)
            u_idx = user_ids[k]
            r = responses[k]
            logits = theta[u_idx] - b[i]
            p = _sigmoid(logits)
            g = -torch.sum(r - p) - (b[i] - bpm) * inv_b_var
            H = -torch.sum(p * (1.0 - p)) - inv_b_var
            step = 0.0 if H == 0 else (g / H).item()
            new_b[i] = b[i] - step
        return new_b

    def recenter(theta, b):
        # enforce mean(b)=0 and shift theta to preserve logits
        shift = torch.mean(b)
        return theta - shift, b - shift

    # monitor objective to stop early
    prev_obj = torch.tensor(float("inf"), device=device, dtype=dtype)
    eps = torch.as_tensor(1e-12, device=device, dtype=dtype)

    for it in range(max_outer):
        theta = update_thetas(theta, b)
        b = update_items(theta, b)
        theta, b = recenter(theta, b)

        # compute negative log-posterior (for convergence check)
        logits = theta[user_ids] - b[item_ids]
        p = _sigmoid(logits)
        ll = torch.sum(responses * torch.log(p + eps) + (1 - responses) * torch.log(1 - p + eps))
        lp_theta = -0.5 * torch.sum((theta - tpm) ** 2) / max(theta_prior_var, 1e-12)
        lp_b     = -0.5 * torch.sum((b - bpm) ** 2)     / max(b_prior_var, 1e-12)
        obj = -(ll + lp_theta + lp_b)

        if torch.abs(prev_obj - obj) < tol:
            return {
                "theta": theta,
                "b": b,
                "nit": it + 1,
                "converged": True,
                "objective": obj.item(),
            }
        prev_obj = obj

    return {
        "theta": theta,
        "b": b,
        "nit": max_outer,
        "converged": False,
        "objective": prev_obj.item(),
    }



@torch.no_grad()
def rasch_predict_proba_torch(theta, b, user_ids, item_ids):
    logits = theta[user_ids] - b[item_ids]
    return torch.sigmoid(logits)


@torch.no_grad()
def rasch_online_update_theta_torch(
    responses: torch.Tensor,    # (m,) 0/1 float
    b: torch.Tensor,            # (m,) float
    theta0: float = 0.0,
    prior_mean: float = 0.0,
    prior_var: float = 1.0,
    iters: int = 6,
):
    """
    Fast per-user 1D Newton MAP update with fixed item difficulties b.
    """
    device = b.device
    dtype = b.dtype
    r = responses.to(device=device, dtype=dtype)

    theta = torch.as_tensor(theta0, device=device, dtype=dtype)
    pm = torch.as_tensor(prior_mean, device=device, dtype=dtype)
    inv_var = (1.0 / prior_var) if prior_var > 0 else 1e-12

    for _ in range(iters):
        logits = theta - b
        p = torch.sigmoid(logits)
        g = torch.sum(r - p) - (theta - pm) * inv_var
        H = -torch.sum(p * (1.0 - p)) - inv_var
        step = 0.0 if H == 0 else (g / H).item()
        theta = theta - step
    return theta.item()

@torch.no_grad()
def rasch_online_theta_variance_torch(
    theta_hat: torch.Tensor,
    b: torch.Tensor,
    prior_var: float = 1.0,
):
    """
    Laplace variance estimate for a user's theta at MAP:
        Var(theta) ≈ 1 / (sum p(1-p) + 1/prior_var)
    """
    device = b.device
    dtype = b.dtype
    inv_var = (1.0 / prior_var) if prior_var > 0 else 0.0
    logits = theta_hat - b
    p = torch.sigmoid(logits)
    curv = torch.sum(p * (1.0 - p)) + inv_var
    return 1.0 / curv.clamp_min(1e-12)