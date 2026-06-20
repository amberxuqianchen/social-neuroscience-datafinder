"""
Computational modeling of HARM AVERSION
=======================================

A self-contained, runnable companion to the tutorial. It does three things:

  1. Defines a computational model of moral decision-making (the Crockett
     "harm aversion" model): people trade off money against painful shocks
     to themselves vs. to another person.
  2. SIMULATES a cohort of participants whose choices follow that model, so we
     know the ground-truth parameters.
  3. FITS the model back to each simulated participant with maximum-likelihood
     estimation, recovers their harm-aversion parameters, and tests the famous
     "hyper-altruism" effect: people are MORE averse to harming others (kappa_other)
     than themselves (kappa_self).

Run it:

    python tutorials/harm-aversion-fmri/code/harm_aversion_model.py

You only need numpy and scipy. matplotlib is optional (for the figures).

The exact same machinery (a softmax/logistic choice rule over a subjective-value
difference with one "aversion" parameter) is what you will reuse on the REAL
NARPS fMRI dataset in Part 2 of the tutorial, where the aversion parameter is
loss aversion instead of harm aversion.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from scipy.optimize import minimize
from scipy.special import expit  # numerically stable logistic, 1/(1+exp(-x))
from scipy import stats

RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


# ---------------------------------------------------------------------------
# 1. THE MODEL
# ---------------------------------------------------------------------------
#
# On every trial the participant chooses between two options:
#
#   * the "MORE" option: more money, but MORE painful shocks
#   * the "LESS" option: less money, but FEWER shocks
#
# We summarize a trial by how much EXTRA money (delta_m > 0) and how many EXTRA
# shocks (delta_s > 0) the "MORE" option carries relative to the "LESS" option.
# The participant (the "decider") always keeps the money; the shocks go either to
# themselves (Self condition) or to an anonymous stranger (Other condition).
#
# The subjective value of taking the extra money-for-shocks deal is
#
#       delta_V = (1 - kappa) * delta_m  -  kappa * delta_s
#
# kappa in [0, 1] is the HARM AVERSION parameter:
#   kappa -> 0 : "only the money matters" (ignores the shocks)
#   kappa -> 1 : "only the harm matters" (refuses to shock for any amount of money)
#
# The probability of choosing the "MORE" (more-money-more-shocks) option is a
# logistic/softmax function of delta_V, with an inverse-temperature gamma > 0
# that controls how deterministic the choices are:
#
#       P(choose MORE) = 1 / (1 + exp(-gamma * delta_V)) = logistic(gamma * delta_V)


def choice_prob(kappa: float, gamma: float, delta_m, delta_s):
    """Probability of choosing the more-money-more-shocks option on each trial."""
    delta_v = (1.0 - kappa) * delta_m - kappa * delta_s
    return expit(gamma * delta_v)


# ---------------------------------------------------------------------------
# 2. SIMULATING DATA
# ---------------------------------------------------------------------------


def make_trials(n_trials: int, rng: np.random.Generator):
    """Build a trial set: each trial offers some extra money for some extra shocks.

    We vary the money/shock trade-off from trial to trial so that the data
    actually *identify* kappa (you cannot estimate a trade-off if you never
    vary it).
    """
    delta_m = rng.integers(1, 11, size=n_trials).astype(float)  # 1..10 extra money
    delta_s = rng.integers(1, 11, size=n_trials).astype(float)  # 1..10 extra shocks
    return delta_m, delta_s


def simulate_subject(kappa, gamma, n_trials, rng):
    """Generate one participant's binary choices (1 = chose MORE) from the model."""
    delta_m, delta_s = make_trials(n_trials, rng)
    p = choice_prob(kappa, gamma, delta_m, delta_s)
    choices = (rng.random(n_trials) < p).astype(int)
    return delta_m, delta_s, choices


# ---------------------------------------------------------------------------
# 3. FITTING THE MODEL (maximum likelihood)
# ---------------------------------------------------------------------------


def negative_log_likelihood(params, delta_m, delta_s, choices):
    """How surprised the model is by the data, given (kappa, gamma). Lower = better."""
    kappa, gamma = params
    p = choice_prob(kappa, gamma, delta_m, delta_s)
    eps = 1e-9  # keep log() away from 0
    p = np.clip(p, eps, 1 - eps)
    ll = choices * np.log(p) + (1 - choices) * np.log(1 - p)
    return -np.sum(ll)


def fit_subject(delta_m, delta_s, choices, n_restarts: int = 8, seed: int = 0):
    """Estimate (kappa, gamma) for one participant by minimizing the NLL.

    We use several random starting points because the likelihood surface can have
    flat regions; the best fit across restarts is returned.
    """
    rng = np.random.default_rng(seed)
    bounds = [(1e-3, 1 - 1e-3), (1e-3, 50.0)]  # kappa in (0,1), gamma > 0
    best = None
    for _ in range(n_restarts):
        x0 = [rng.uniform(0.05, 0.95), rng.uniform(0.1, 5.0)]
        res = minimize(
            negative_log_likelihood,
            x0,
            args=(delta_m, delta_s, choices),
            method="L-BFGS-B",
            bounds=bounds,
        )
        if res.success and (best is None or res.fun < best.fun):
            best = res
    kappa_hat, gamma_hat = best.x
    return kappa_hat, gamma_hat, best.fun


# ---------------------------------------------------------------------------
# 4. RUN A WHOLE EXPERIMENT
# ---------------------------------------------------------------------------


def run_experiment(n_subjects=40, n_trials=200, seed=2024):
    """Simulate a cohort with hyper-altruism, then recover everyone's parameters."""
    rng = np.random.default_rng(seed)

    # Ground-truth parameters. Note kappa_other is drawn HIGHER than kappa_self:
    # this is the hyper-altruism effect we hope to recover.
    def draw_kappa(mean):
        return float(np.clip(rng.normal(mean, 0.12), 0.02, 0.98))

    rows = []
    for sid in range(n_subjects):
        true_kappa_self = draw_kappa(0.32)
        true_kappa_other = draw_kappa(0.55)
        true_gamma = float(np.clip(rng.normal(3.0, 1.0), 0.5, 8.0))

        # Self condition
        dm, ds, ch = simulate_subject(true_kappa_self, true_gamma, n_trials, rng)
        est_kappa_self, est_gamma_self, _ = fit_subject(dm, ds, ch, seed=sid)

        # Other condition
        dm, ds, ch = simulate_subject(true_kappa_other, true_gamma, n_trials, rng)
        est_kappa_other, est_gamma_other, _ = fit_subject(dm, ds, ch, seed=sid + 999)

        rows.append(
            dict(
                subject=sid,
                true_kappa_self=true_kappa_self,
                true_kappa_other=true_kappa_other,
                est_kappa_self=est_kappa_self,
                est_kappa_other=est_kappa_other,
            )
        )
    return rows


def main():
    rows = run_experiment()

    true_self = np.array([r["true_kappa_self"] for r in rows])
    true_other = np.array([r["true_kappa_other"] for r in rows])
    est_self = np.array([r["est_kappa_self"] for r in rows])
    est_other = np.array([r["est_kappa_other"] for r in rows])

    # --- Parameter recovery: did fitting recover the ground truth? ---
    r_self = np.corrcoef(true_self, est_self)[0, 1]
    r_other = np.corrcoef(true_other, est_other)[0, 1]
    print("Parameter recovery (correlation true vs. estimated kappa):")
    print(f"  Self : r = {r_self:.3f}")
    print(f"  Other: r = {r_other:.3f}")

    # --- The scientific result: is harm aversion higher for OTHER than SELF? ---
    diff = est_other - est_self
    t, p = stats.ttest_rel(est_other, est_self)
    print("\nEstimated harm aversion (mean +/- SD):")
    print(f"  kappa_self  = {est_self.mean():.3f} +/- {est_self.std():.3f}")
    print(f"  kappa_other = {est_other.mean():.3f} +/- {est_other.std():.3f}")
    print(f"\nHyper-altruism (kappa_other - kappa_self) = {diff.mean():.3f}")
    print(f"Paired t-test: t = {t:.2f}, p = {p:.2e}")
    frac = float(np.mean(diff > 0))
    print(f"Fraction of participants with kappa_other > kappa_self: {frac:.0%}")

    # --- Optional figures (only if matplotlib is available) ---
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(1, 2, figsize=(10, 4))

        ax[0].scatter(true_self, est_self, label="self", alpha=0.7)
        ax[0].scatter(true_other, est_other, label="other", alpha=0.7)
        lims = [0, 1]
        ax[0].plot(lims, lims, "k--", lw=1)
        ax[0].set(xlabel="true kappa", ylabel="estimated kappa", title="Parameter recovery")
        ax[0].legend()

        ax[1].scatter(est_self, est_other, alpha=0.7)
        ax[1].plot(lims, lims, "k--", lw=1)
        ax[1].set(
            xlabel="kappa_self",
            ylabel="kappa_other",
            title="Hyper-altruism\n(points above the line = more averse to harming others)",
        )
        fig.tight_layout()
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        out = RESULTS_DIR / "harm_aversion_results.png"
        fig.savefig(out, dpi=120)
        print(f"\nSaved figure to {out}")
    except Exception as exc:  # pragma: no cover
        print(f"\n(Skipped plotting: {exc})")


if __name__ == "__main__":
    main()
