# glmm_skill_only.py
from __future__ import annotations
import torch
from torch import nn
from torch.optim import Adam
from dataclasses import dataclass
from typing import Optional, Dict, Any

# ---- Core model -------------------------------------------------------------

class RaschFrozenSkillGLMM(nn.Module):
    """
    Logistic GLMM with Rasch-frozen theta_u, b_i and learnable user×skill mastery.
    logit p_ui = theta[u] - b[i] + (tanh(gamma_user[u]) · s_i)

    Parameters learned here:
      - gamma_user: (n_users, n_skills)

    Everything else is input at call time.
    """

    def __init__(
        self,
        n_users: int,
        n_skills: int,
        prior_gamma_sd: float = 0.8,     # L2 prior strength (Gaussian)
        mastery_activation: str = "tanh" # 'tanh' (recommended) or 'identity'
    ):
        super().__init__()
        self.n_users = n_users
        self.n_skills = n_skills

        self.gamma_user = nn.Embedding(n_users, n_skills)
        nn.init.zeros_(self.gamma_user.weight)

        self.lam_gamma = 1.0 / (prior_gamma_sd ** 2)

        if mastery_activation == "tanh":
            self._act = torch.tanh
        elif mastery_activation == "identity":
            self._act = (lambda x: x)
        else:
            raise ValueError("mastery_activation must be 'tanh' or 'identity'")

        self._bce = nn.BCEWithLogitsLoss(reduction="mean")

    def forward(
        self,
        user_ids: torch.Tensor,     # (B,) long
        theta_u: torch.Tensor,      # (B,) float   Rasch ability per example
        b_i: torch.Tensor,          # (B,) float   Rasch difficulty per example
        s_batch: torch.Tensor       # (B,K) float  item Q rows (ideally L1-normalized)
    ) -> torch.Tensor:              # (B,) logits
        # (B,K) activated mastery for those users
        gamma_act = self._act(self.gamma_user(user_ids))
        mastery = (gamma_act * s_batch).sum(dim=1)  # (B,)
        logits = theta_u - b_i + mastery
        return logits

    def loss(
        self,
        user_ids: torch.Tensor,
        theta_u: torch.Tensor,
        b_i: torch.Tensor,
        y: torch.Tensor,            # (B,) long or float in {0,1}
        s_batch: torch.Tensor
    ) -> torch.Tensor:
        logits = self.forward(user_ids, theta_u, b_i, s_batch)
        nll = self._bce(logits, y.float())
        reg = 0.5 * self.lam_gamma * (self.gamma_user.weight ** 2).sum()
        return nll + reg

    @torch.no_grad()
    def predict_proba(
        self,
        user_ids: torch.Tensor,
        theta_u: torch.Tensor,
        b_i: torch.Tensor,
        s_batch: torch.Tensor
    ) -> torch.Tensor:              # (B,) probs
        return torch.sigmoid(self.forward(user_ids, theta_u, b_i, s_batch))

    @torch.no_grad()
    def get_user_mastery(self, user_index: int) -> torch.Tensor:
        """Return activated mastery vector (K,) for a single user index."""
        return self._act(self.gamma_user.weight[user_index]).detach()


# ---- Offline trainer --------------------------------------------------------

@dataclass
class TrainConfig:
    lr: float = 0.03
    epochs: int = 6
    batch_size: int = 8192
    seed: int = 1337
    prior_gamma_sd: float = 0.8
    mastery_activation: str = "tanh"
    device: str = "cpu"   # "cuda" if available


def fit_rasch_frozen_skill_glmm(
    n_users: int,
    n_skills: int,
    user_ids: torch.Tensor,   # (N,) long [0..n_users-1]
    theta_u: torch.Tensor,    # (N,) float
    b_i: torch.Tensor,        # (N,) float
    y: torch.Tensor,          # (N,) 0/1
    s_batch: torch.Tensor,    # (N,K) float
    cfg: TrainConfig = TrainConfig(),
) -> RaschFrozenSkillGLMM:
    """
    Offline fit of gamma_user only (MAP). All other inputs are fixed.
    """
    torch.manual_seed(cfg.seed)

    device = torch.device(cfg.device)
    user_ids = user_ids.to(device)
    theta_u = theta_u.to(device)
    b_i     = b_i.to(device)
    y       = y.to(device)
    s_batch = s_batch.to(device)

    model = RaschFrozenSkillGLMM(
        n_users=n_users,
        n_skills=n_skills,
        prior_gamma_sd=cfg.prior_gamma_sd,
        mastery_activation=cfg.mastery_activation,
    ).to(device)

    opt = Adam(model.parameters(), lr=cfg.lr)

    N = y.shape[0]
    idx = torch.arange(N, device=device)

    for _ in range(cfg.epochs):
        perm = idx[torch.randperm(N)]
        for start in range(0, N, cfg.batch_size):
            sl = perm[start:start+cfg.batch_size]
            loss = model.loss(
                user_ids[sl], theta_u[sl], b_i[sl], y[sl], s_batch[sl]
            )
            opt.zero_grad()
            loss.backward()
            opt.step()

    return model


# ---- Online micro-update (per submission) ----------------------------------

@torch.no_grad()
def predict_one(
    model: RaschFrozenSkillGLMM,
    user_idx: int,
    theta_u: float,
    b_i: float,
    s_vec: torch.Tensor,  # (K,)
    device: Optional[str] = None
) -> float:
    """Convenience helper for a single (u,i) probability."""
    dev = torch.device(device or next(model.parameters()).device)
    u  = torch.tensor([user_idx], dtype=torch.long, device=dev)
    th = torch.tensor([theta_u], dtype=torch.float32, device=dev)
    bi = torch.tensor([b_i], dtype=torch.float32, device=dev)
    S  = s_vec.to(dev).unsqueeze(0)
    p = model.predict_proba(u, th, bi, S)[0].item()
    return p


def micro_update_one(
    model,
    user_idx: int,
    theta_u: float,
    b_i: float,
    y: int,
    s_vec: torch.Tensor,          # (K,)
    lr: float = 0.1,
    lam_row: float = 1.0,
    steps: int = 2,
    device: str | None = None,
):
    dev = torch.device(device or next(model.parameters()).device)
    s_vec = s_vec.to(dev).float()
    y_t  = torch.tensor([float(y)], dtype=torch.float32, device=dev)
    th   = torch.tensor([theta_u], dtype=torch.float32, device=dev)
    bi   = torch.tensor([b_i],     dtype=torch.float32, device=dev)

    # 1) Clone the row as a LEAF Parameter
    row_param = torch.nn.Parameter(
        model.gamma_user.weight[user_idx].detach().to(dev).clone(),  # leaf
        requires_grad=True
    )

    opt = torch.optim.SGD([row_param], lr=lr)

    for _ in range(steps):
        gamma_act = torch.tanh(row_param).unsqueeze(0)  # (1,K)
        S = s_vec.unsqueeze(0)                          # (1,K)
        logit = th - bi + (gamma_act * S).sum(dim=1)    # (1,)
        nll = torch.nn.functional.binary_cross_entropy_with_logits(logit, y_t)
        reg = 0.5 * lam_row * (row_param ** 2).sum()
        loss = nll + reg

        opt.zero_grad()
        loss.backward()
        opt.step()

    # 2) Copy the updated value back into the embedding weight
    with torch.no_grad():
        model.gamma_user.weight[user_idx].copy_(row_param.data)



