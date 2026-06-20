"""
Inter-Subject Correlation (ISC) on naturalistic data -- the core idea, tested
=============================================================================

When people watch the *same* movie, their brains respond in similar, time-locked
ways. Inter-subject correlation (ISC) measures that shared response: for each
brain region we correlate one person's time series with the average of everyone
else's. Regions that reliably track the stimulus (sensory cortex, and -- for a
socially rich film -- the social brain) show high ISC; regions driven by private
thoughts do not.

This script teaches the method on SIMULATED data so it runs instantly and you can
see that ISC recovers known ground truth. Part 2 of the tutorial applies the exact
same `leave_one_out_isc` function to the real Partly Cloudy movie-fMRI dataset.

Run it:

    python tutorials/naturalistic-isc/code/isc_demo.py

Needs only numpy + scipy (+ matplotlib for the figure).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from scipy import stats

RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


# ---------------------------------------------------------------------------
# 1. SIMULATE a naturalistic experiment
# ---------------------------------------------------------------------------
#
# Several "regions", each with a shared, stimulus-locked signal that every
# subject partly follows. The KEY knob is `shared` (c) in [0, 1]: the fraction of
# each subject's signal that is common across people.
#
#     x_i(t) = sqrt(c) * s(t)  +  sqrt(1 - c) * e_i(t)
#
# with s the shared stimulus response and e_i private noise. Larger c -> higher
# ISC. We give "auditory" the most shared signal, the "social/STS" region a
# moderate amount, and a "control" region essentially none.

REGIONS = {
    "auditory":   0.50,   # strongly stimulus-locked
    "social/STS": 0.30,   # socially driven, moderately shared
    "control":    0.00,   # private / not stimulus-locked (a clean null)
}


def simulate(n_subjects=20, n_timepoints=300, regions=REGIONS, seed=0):
    """Return data[region] -> array (n_subjects, n_timepoints)."""
    rng = np.random.default_rng(seed)
    data = {}
    for name, c in regions.items():
        shared = rng.standard_normal(n_timepoints)            # the movie's signal
        private = rng.standard_normal((n_subjects, n_timepoints))
        data[name] = np.sqrt(c) * shared + np.sqrt(1 - c) * private
    return data


# ---------------------------------------------------------------------------
# 2. THE ISC COMPUTATION (leave-one-out)
# ---------------------------------------------------------------------------


def _pearson(a, b):
    a = a - a.mean()
    b = b - b.mean()
    denom = np.sqrt(np.sum(a * a) * np.sum(b * b))
    return float(np.sum(a * b) / denom) if denom > 0 else 0.0


def leave_one_out_isc(ts):
    """ISC for one region.

    `ts` is (n_subjects, n_timepoints). For each subject we correlate their time
    series with the MEAN of all the *other* subjects, then return the per-subject
    ISC values. This is the standard leave-one-out ISC (Nastase et al., 2019).
    """
    n = ts.shape[0]
    iscs = np.empty(n)
    for i in range(n):
        others_mean = np.delete(ts, i, axis=0).mean(axis=0)
        iscs[i] = _pearson(ts[i], others_mean)
    return iscs


def fisher_mean(r):
    """Average correlations the proper way: mean in Fisher-z space, back to r."""
    z = np.arctanh(np.clip(r, -0.999, 0.999))
    return float(np.tanh(np.mean(z)))


# ---------------------------------------------------------------------------
# 3. IS IT REAL? a circular-shift null
# ---------------------------------------------------------------------------
#
# ISC is only meaningful if subjects are TIME-ALIGNED to the same movie. If we
# circularly shift each subject's time series by a random amount we keep each
# subject's own temporal structure but destroy the cross-subject alignment, so
# true ISC should collapse toward zero. Doing this many times builds a null
# distribution we can test the real ISC against.


def circular_shift_null(ts, n_perm=1000, seed=1):
    rng = np.random.default_rng(seed)
    n, T = ts.shape
    null = np.empty(n_perm)
    for p in range(n_perm):
        shifted = np.stack([np.roll(ts[i], rng.integers(1, T)) for i in range(n)])
        null[p] = fisher_mean(leave_one_out_isc(shifted))
    return null


def main():
    data = simulate()

    print("Leave-one-out ISC (mean +/- SD across subjects):")
    summary = {}
    for name, ts in data.items():
        iscs = leave_one_out_isc(ts)
        summary[name] = iscs
        # one-sample t-test that subject-wise ISC > 0
        t, p = stats.ttest_1samp(iscs, 0.0)
        print(f"  {name:10s}: ISC = {fisher_mean(iscs):.3f}   (t = {t:5.1f}, p = {p:.1e})")

    order = sorted(summary, key=lambda k: fisher_mean(summary[k]), reverse=True)
    print("\nRanking by ISC:", " > ".join(order))
    assert order[0] == "auditory" and order[-1] == "control", "unexpected ISC ordering"
    print("As expected: more shared (stimulus-locked) signal -> higher ISC.")

    # Permutation test for the social region
    obs = fisher_mean(summary["social/STS"])
    null = circular_shift_null(data["social/STS"], n_perm=500)
    p_perm = (np.sum(null >= obs) + 1) / (len(null) + 1)
    print(f"\nsocial/STS: observed ISC = {obs:.3f}; circular-shift null mean = "
          f"{null.mean():.3f}; permutation p = {p_perm:.4f}")

    # Optional figure
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(1, 2, figsize=(10, 4))

        names = list(summary)
        means = [fisher_mean(summary[n]) for n in names]
        sds = [summary[n].std() for n in names]
        colors = ["#2563eb", "#0d9488", "#94a3b8"]
        ax[0].bar(names, means, yerr=sds, capsize=4, color=colors)
        ax[0].set(ylabel="leave-one-out ISC", title="ISC by region\n(shared signal -> higher ISC)")
        ax[0].axhline(0, color="k", lw=0.8)

        ax[1].hist(null, bins=30, color="#94a3b8", alpha=0.8, label="null (time-shifted)")
        ax[1].axvline(obs, color="#0d9488", lw=2, label="observed (social/STS)")
        ax[1].set(xlabel="mean ISC", ylabel="count",
                  title="Circular-shift null test")
        ax[1].legend()

        fig.tight_layout()
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        out = RESULTS_DIR / "isc_results.png"
        fig.savefig(out, dpi=120)
        print(f"\nSaved figure to {out}")
    except Exception as exc:  # pragma: no cover
        print(f"\n(Skipped plotting: {exc})")


if __name__ == "__main__":
    main()
