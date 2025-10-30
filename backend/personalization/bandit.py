"""
Bayesian Linear Bandit (Thompson Sampling)
Implements contextual bandit for adaptive module selection
"""
import numpy as np
import json
from typing import List, Dict, Tuple, Optional


class BayesianLinearBandit:
    """
    Thompson Sampling with Bayesian Linear Regression.

    Maintains posterior N(μ, Σ) over parameters θ where:
    - θ ∈ ℝᵈ are the linear model parameters
    - μ is the posterior mean
    - Σ is the posterior covariance
    - Reward model: r = θᵀφ(module, context) + ε, ε ~ N(0, σ²)

    The bandit learns which modules are most effective for improving
    user mastery given their current skill level (context).
    """

    def __init__(
        self,
        dimension: int,
        prior_mean: Optional[np.ndarray] = None,
        prior_cov: Optional[np.ndarray] = None,
        noise_variance: float = 0.1
    ):
        """
        Initialize Bayesian Linear Bandit.

        Args:
            dimension: Feature dimension d
            prior_mean: μ₀ ∈ ℝᵈ (default: zero vector)
            prior_cov: Σ₀ ∈ ℝᵈˣᵈ (default: identity matrix)
            noise_variance: σ² (observation noise)
        """
        self.d = dimension

        # Initialize prior
        if prior_mean is None:
            self.mu = np.zeros(dimension)
        else:
            self.mu = prior_mean.copy()

        if prior_cov is None:
            self.Sigma = np.eye(dimension)
        else:
            self.Sigma = prior_cov.copy()

        self.sigma_sq = noise_variance
        self.Sigma_inv = np.linalg.inv(self.Sigma)
        self.num_updates = 0

    def sample_parameters(self) -> np.ndarray:
        """
        Sample θ̃ ~ N(μ, Σ) for Thompson Sampling.

        This implements the exploration/exploitation tradeoff:
        - Areas with high uncertainty (large Σ) get explored more
        - Areas with high expected reward (large μ) get exploited more

        Returns:
            theta_sample: Sampled parameter vector ∈ ℝᵈ
        """
        return np.random.multivariate_normal(self.mu, self.Sigma)

    def predict(self, features: np.ndarray) -> Tuple[float, float]:
        """
        Compute expected reward E[r | φ] = μᵀφ and uncertainty.

        Args:
            features: Feature vector φ ∈ ℝᵈ

        Returns:
            expected_reward: μᵀφ
            uncertainty: √(φᵀΣφ) (standard deviation of predicted reward)
        """
        expected_reward = np.dot(self.mu, features)
        variance = np.dot(features, np.dot(self.Sigma, features))
        uncertainty = np.sqrt(max(0, variance))  # Avoid negative due to numerical errors

        return expected_reward, uncertainty

    def update(self, features_list: List[np.ndarray], rewards_list: List[float]):
        """
        Bayesian update with new observations using conjugate prior.

        Given observations (φ₁, r₁), ..., (φₖ, rₖ), update posterior:
        - Prior: θ ~ N(μ₀, Σ₀)
        - Likelihood: r = Φθ + ε, ε ~ N(0, σ²I)
        - Posterior: θ | r ~ N(μ₁, Σ₁)

        Update equations:
        - Σ₁⁻¹ = Σ₀⁻¹ + σ⁻²ΦᵀΦ
        - μ₁ = Σ₁(Σ₀⁻¹μ₀ + σ⁻²Φᵀr)

        Args:
            features_list: List of feature vectors [φ₁, φ₂, ..., φₖ]
            rewards_list: List of observed rewards [r₁, r₂, ..., rₖ]
        """
        if len(features_list) == 0:
            return

        # Convert to numpy arrays
        Phi = np.array(features_list)  # K × d
        r = np.array(rewards_list)  # K

        # Update precision matrix (inverse covariance)
        # Σ⁻¹_new = Σ⁻¹_old + (1/σ²) * ΦᵀΦ
        self.Sigma_inv += (1 / self.sigma_sq) * (Phi.T @ Phi)

        # Update covariance
        self.Sigma = np.linalg.inv(self.Sigma_inv)

        # Update mean
        # μ_new = Σ_new * (Σ⁻¹_old * μ_old + (1/σ²) * Φᵀr)
        self.mu = self.Sigma @ (
            self.Sigma_inv @ self.mu + (1 / self.sigma_sq) * (Phi.T @ r)
        )

        self.num_updates += len(rewards_list)

    def get_ucb_score(self, features: np.ndarray, alpha: float = 1.0) -> float:
        """
        Compute Upper Confidence Bound score for exploration.

        UCB = μᵀφ + α√(φᵀΣφ)

        This is an alternative to Thompson Sampling. Higher α = more exploration.

        Args:
            features: Feature vector φ ∈ ℝᵈ
            alpha: Exploration parameter (typically 1-3)

        Returns:
            ucb_score: Upper confidence bound
        """
        expected_reward, uncertainty = self.predict(features)
        return expected_reward + alpha * uncertainty

    def to_dict(self) -> Dict:
        """
        Serialize model state for database storage.

        Returns:
            dict: Serializable representation of model state
        """
        return {
            'dimension': self.d,
            'mu': self.mu.tolist(),
            'Sigma': self.Sigma.tolist(),
            'sigma_sq': self.sigma_sq,
            'num_updates': self.num_updates
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'BayesianLinearBandit':
        """
        Deserialize model from dictionary.

        Args:
            data: Dictionary containing model state

        Returns:
            BayesianLinearBandit: Restored model
        """
        model = cls(
            dimension=data['dimension'],
            prior_mean=np.array(data['mu']),
            prior_cov=np.array(data['Sigma']),
            noise_variance=data['sigma_sq']
        )
        model.num_updates = data['num_updates']
        return model

    def to_json(self) -> str:
        """
        Serialize model to JSON string.

        Returns:
            str: JSON representation
        """
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> 'BayesianLinearBandit':
        """
        Deserialize model from JSON string.

        Args:
            json_str: JSON string containing model state

        Returns:
            BayesianLinearBandit: Restored model
        """
        data = json.loads(json_str)
        return cls.from_dict(data)

    def reset(self):
        """
        Reset bandit to initial prior (forget all learning).

        Useful for testing or starting fresh with a user.
        """
        self.mu = np.zeros(self.d)
        self.Sigma = np.eye(self.d)
        self.Sigma_inv = np.eye(self.d)
        self.num_updates = 0

    def get_exploration_rate(self) -> float:
        """
        Compute exploration rate as average posterior uncertainty.

        Returns:
            exploration_rate: Average diagonal of Σ (variance)
        """
        return np.mean(np.diag(self.Sigma))

    def get_confidence_intervals(self, features: np.ndarray, confidence: float = 0.95) -> Tuple[float, float]:
        """
        Compute confidence interval for predicted reward.

        Args:
            features: Feature vector φ ∈ ℝᵈ
            confidence: Confidence level (default 95%)

        Returns:
            lower_bound: Lower bound of confidence interval
            upper_bound: Upper bound of confidence interval
        """
        from scipy import stats

        expected_reward, uncertainty = self.predict(features)
        z_score = stats.norm.ppf((1 + confidence) / 2)

        lower_bound = expected_reward - z_score * uncertainty
        upper_bound = expected_reward + z_score * uncertainty

        return lower_bound, upper_bound


class EpsilonGreedyBandit:
    """
    Simple epsilon-greedy bandit as a baseline/fallback.

    With probability ε, select random module (explore).
    With probability 1-ε, select module with highest expected reward (exploit).

    This is simpler than Thompson Sampling but less sophisticated.
    """

    def __init__(self, epsilon: float = 0.1):
        """
        Initialize epsilon-greedy bandit.

        Args:
            epsilon: Exploration probability (0-1)
        """
        self.epsilon = epsilon
        self.module_rewards = {}  # module_id -> list of rewards
        self.module_counts = {}   # module_id -> number of times selected

    def select_module(self, module_ids: List[str]) -> str:
        """
        Select module using epsilon-greedy policy.

        Args:
            module_ids: List of available module IDs

        Returns:
            selected_module_id: Chosen module
        """
        if np.random.random() < self.epsilon:
            # Explore: random selection
            return np.random.choice(module_ids)
        else:
            # Exploit: select best module
            best_module = None
            best_avg_reward = -float('inf')

            for module_id in module_ids:
                if module_id not in self.module_rewards or len(self.module_rewards[module_id]) == 0:
                    # Untried module: optimistic initialization
                    avg_reward = 0.5  # Assume moderate reward
                else:
                    avg_reward = np.mean(self.module_rewards[module_id])

                if avg_reward > best_avg_reward:
                    best_avg_reward = avg_reward
                    best_module = module_id

            return best_module

    def update(self, module_id: str, reward: float):
        """
        Update module reward estimate.

        Args:
            module_id: Module that was selected
            reward: Observed reward
        """
        if module_id not in self.module_rewards:
            self.module_rewards[module_id] = []
            self.module_counts[module_id] = 0

        self.module_rewards[module_id].append(reward)
        self.module_counts[module_id] += 1

    def get_module_stats(self, module_id: str) -> Dict:
        """
        Get statistics for a module.

        Args:
            module_id: Module identifier

        Returns:
            dict: Statistics (mean_reward, count, std)
        """
        if module_id not in self.module_rewards or len(self.module_rewards[module_id]) == 0:
            return {
                'mean_reward': 0.0,
                'count': 0,
                'std': 0.0
            }

        rewards = self.module_rewards[module_id]
        return {
            'mean_reward': np.mean(rewards),
            'count': len(rewards),
            'std': np.std(rewards)
        }


# Factory function for creating bandits
def create_bandit(bandit_type: str = 'thompson', **kwargs) -> object:
    """
    Factory function to create different types of bandits.

    Args:
        bandit_type: 'thompson' or 'epsilon_greedy'
        **kwargs: Additional arguments for bandit initialization

    Returns:
        Bandit instance
    """
    if bandit_type == 'thompson':
        return BayesianLinearBandit(**kwargs)
    elif bandit_type == 'epsilon_greedy':
        return EpsilonGreedyBandit(**kwargs)
    else:
        raise ValueError(f"Unknown bandit type: {bandit_type}")


if __name__ == "__main__":
    # Test the bandit implementation
    print("Testing BayesianLinearBandit...")

    # Create bandit
    d = 10  # Feature dimension
    bandit = BayesianLinearBandit(dimension=d, noise_variance=0.1)

    print(f"Initial exploration rate: {bandit.get_exploration_rate():.4f}")

    # Simulate some observations
    np.random.seed(42)
    true_theta = np.random.randn(d)  # True parameters

    for i in range(20):
        # Sample features
        features = np.random.randn(d)

        # Compute true reward (with noise)
        true_reward = np.dot(true_theta, features) + np.random.randn() * 0.1

        # Update bandit
        bandit.update([features], [true_reward])

    print(f"After 20 updates:")
    print(f"  - Exploration rate: {bandit.get_exploration_rate():.4f}")
    print(f"  - Learned μ: {bandit.mu[:3]}... (first 3 dims)")
    print(f"  - True θ: {true_theta[:3]}... (first 3 dims)")

    # Test prediction
    test_features = np.random.randn(d)
    expected_reward, uncertainty = bandit.predict(test_features)
    print(f"\nTest prediction:")
    print(f"  - Expected reward: {expected_reward:.4f}")
    print(f"  - Uncertainty: {uncertainty:.4f}")

    # Test serialization
    json_str = bandit.to_json()
    restored_bandit = BayesianLinearBandit.from_json(json_str)
    print(f"\nSerialization test:")
    print(f"  - Original μ sum: {np.sum(bandit.mu):.4f}")
    print(f"  - Restored μ sum: {np.sum(restored_bandit.mu):.4f}")
    print(f"  - Match: {np.allclose(bandit.mu, restored_bandit.mu)}")

    print("\n✓ BayesianLinearBandit tests passed!")
