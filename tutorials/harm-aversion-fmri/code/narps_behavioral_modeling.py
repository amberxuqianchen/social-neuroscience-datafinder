"""
Behavioral computational modeling on REAL data (NARPS loss aversion)
====================================================================

Part 1 of the tutorial taught the value-based choice model by *simulating* harm
aversion (because Crockett's harm-aversion data is request-only). Here we run the
*same* modeling machinery on REAL, openly downloadable choices: the NARPS
mixed-gambles task (OpenNeuro ds001734), where people accept/reject 50/50 gambles
of a possible gain vs. loss.

This is a complete behavioral-modeling showcase on real data:
  1. Fit each participant's loss-aversion model (lambda, mu) by maximum likelihood.
  2. Show the model actually PREDICTS choices (a choice/calibration curve).
  3. Quantify fit (accuracy vs. base rate, McFadden pseudo-R^2).
  4. Compare models: does free loss aversion beat lambda = 1 (no loss aversion)?
  5. Summarize the loss-aversion parameter across the cohort.

Run (after downloading a batch of subjects' tiny events files):

    NARPS_DIR=/path/to/ds001734 python tutorials/harm-aversion-fmri/code/narps_behavioral_modeling.py

Reuses fit_loss_aversion / subjective_value / load_events / choices_from_events
from model_based_fmri_narps.py -- the same code that feeds the fMRI analysis.
"""

from __future__ import annotations

import glob
import os
from pathlib import Path

import numpy as np
from scipy.special import expit

import model_based_fmri_narps as m

DATA_DIR = os.environ.get("NARPS_DIR", "ds001734")
RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


def fit_lambda1(gain, loss, accepted):
    """Restricted model: NO loss aversion (lambda fixed to 1), fit mu only."""
    from scipy.optimize import minimize_scalar

    def nll(mu):
        ev = m.subjective_value(gain, loss, 1.0)
        p = np.clip(expit(mu * ev), 1e-9, 1 - 1e-9)
        return -np.sum(accepted * np.log(p) + (1 - accepted) * np.log(1 - p))

    res = minimize_scalar(nll, bounds=(1e-3, 5.0), method="bounded")
    return res.x


def loglik(gain, loss, accepted, lam, mu):
    p = np.clip(expit(mu * m.subjective_value(gain, loss, lam)), 1e-9, 1 - 1e-9)
    return float(np.sum(accepted * np.log(p) + (1 - accepted) * np.log(1 - p)))


def analyze():
    subs = sorted(glob.glob(os.path.join(DATA_DIR, "sub-*")))
    rows = []
    pooled_dv, pooled_choice = [], []

    for sd in subs:
        sub = os.path.basename(sd)
        try:
            ev = m.load_events(sub)
        except Exception:
            continue
        ev_keep, accepted = m.choices_from_events(ev)
        if len(accepted) < 50:
            continue
        gain = ev_keep["gain"].to_numpy(float)
        loss = ev_keep["loss"].to_numpy(float)

        lam, mu = m.fit_loss_aversion(gain, loss, accepted)            # full model
        mu1 = fit_lambda1(gain, loss, accepted)                        # lambda = 1 model

        dv = mu * m.subjective_value(gain, loss, lam)                  # decision value (logits)
        p = np.clip(expit(dv), 1e-9, 1 - 1e-9)
        acc = float(np.mean((p > 0.5) == accepted))
        base = float(max(accepted.mean(), 1 - accepted.mean()))        # base-rate accuracy

        # McFadden pseudo-R^2 vs. an intercept-only (base-rate) model
        p0 = float(accepted.mean())
        ll_null = (np.sum(accepted) * np.log(p0) + np.sum(1 - accepted) * np.log(1 - p0)
                   if 0 < p0 < 1 else 0.0)
        ll_full = loglik(gain, loss, accepted, lam, mu)
        pseudo_r2 = 1 - ll_full / ll_null if ll_null != 0 else np.nan

        # BIC: full (2 params) vs. lambda=1 (1 param)
        n = len(accepted)
        bic_full = -2 * ll_full + 2 * np.log(n)
        bic_r = -2 * loglik(gain, loss, accepted, 1.0, mu1) + 1 * np.log(n)

        rows.append(dict(sub=sub, lam=lam, mu=mu, acc=acc, base=base,
                         pseudo_r2=pseudo_r2, dbic=bic_r - bic_full, n=n))
        pooled_dv += list(dv)
        pooled_choice += list(accepted)

    return rows, np.array(pooled_dv), np.array(pooled_choice)


def main():
    rows, dv, choice = analyze()
    if not rows:
        print(f"No subjects with events under {DATA_DIR!r}. Download events first.")
        return

    lam = np.array([r["lam"] for r in rows])
    acc = np.array([r["acc"] for r in rows])
    base = np.array([r["base"] for r in rows])
    pr2 = np.array([r["pseudo_r2"] for r in rows])
    dbic = np.array([r["dbic"] for r in rows])

    print(f"Behavioral modeling on {len(rows)} NARPS participants (real choices)\n")
    print(f"  loss aversion lambda : median {np.median(lam):.2f}, mean {lam.mean():.2f}, "
          f"{100*np.mean(lam>1):.0f}% with lambda>1")
    print(f"  model accuracy       : {acc.mean():.1%}  (base rate {base.mean():.1%})")
    print(f"  McFadden pseudo-R^2  : {np.nanmean(pr2):.3f} (mean across subjects)")
    print(f"  free-lambda beats lambda=1 (delta BIC>0) for "
          f"{100*np.mean(dbic>0):.0f}% of participants")

    # ---- figure: the showcase ----
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(1, 3, figsize=(14, 4.2))

    # (A) Choice curve: observed P(accept) vs. model's decision value, pooled.
    order = np.argsort(dv)
    dv_s, ch_s = dv[order], choice[order]
    nbins = 12
    edges = np.quantile(dv_s, np.linspace(0, 1, nbins + 1))
    centers, obs = [], []
    for i in range(nbins):
        sel = (dv_s >= edges[i]) & (dv_s <= edges[i + 1])
        if sel.sum() > 0:
            centers.append(dv_s[sel].mean())
            obs.append(ch_s[sel].mean())
    xs = np.linspace(dv_s.min(), dv_s.max(), 200)
    ax[0].plot(xs, expit(xs), color="#2563eb", lw=2, label="model P(accept)")
    ax[0].scatter(centers, obs, color="#0d9488", zorder=3, label="observed (binned)")
    ax[0].axhline(0.5, color="k", lw=0.6, ls=":")
    ax[0].set(xlabel="model decision value  (μ·EV, logits)", ylabel="P(accept gamble)",
              title="Model predicts real choices")
    ax[0].legend(loc="lower right", fontsize=9)

    # (B) Loss-aversion distribution.
    ax[1].hist(lam, bins=np.arange(0.4, 3.0, 0.2), color="#2563eb", alpha=0.85, edgecolor="white")
    ax[1].axvline(1.0, color="k", ls="--", lw=1, label="λ = 1")
    ax[1].axvline(np.median(lam), color="#0d9488", lw=2, label=f"median = {np.median(lam):.2f}")
    ax[1].set(xlabel="loss aversion λ", ylabel="participants",
              title=f"Loss aversion across {len(rows)} people")
    ax[1].legend(fontsize=9)

    # (C) Fit quality: model accuracy vs base rate, per subject.
    ax[2].scatter(base, acc, color="#2563eb", alpha=0.8, zorder=3)
    lims = [min(base.min(), acc.min()) - 0.02, 1.0]
    ax[2].plot(lims, lims, "k--", lw=1)
    ax[2].set(xlabel="base-rate accuracy", ylabel="model accuracy", xlim=lims, ylim=lims,
              title=f"Model beats base rate\n(mean pseudo-R² = {np.nanmean(pr2):.2f})")

    fig.tight_layout()
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    out = RESULTS_DIR / "narps_behavioral_modeling.png"
    fig.savefig(out, dpi=120)
    print(f"\nSaved figure to {out}")


if __name__ == "__main__":
    main()
