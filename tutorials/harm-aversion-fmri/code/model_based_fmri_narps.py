"""
Model-based fMRI on a REAL open dataset (NARPS, OpenNeuro ds001734)
===================================================================

Part 1 of the tutorial fit a HARM-aversion model to choices. Here we apply the
*identical* idea to a closely related, fully open dataset you can actually
download: NARPS, where 108 people accepted or rejected mixed gambles (a possible
monetary GAIN vs. a possible LOSS) while being scanned. The aversion parameter
is now LOSS aversion (lambda) instead of harm aversion (kappa), but the recipe
is the same:

    behavioral choices  ->  fit a value model  ->  use the model's trial-by-trial
    subjective value as a regressor in the fMRI GLM  ->  find where the brain
    tracks subjective value (expected: ventromedial PFC / ventral striatum).

This file has two stages:

    STAGE A (runs with only the small events files, no imaging needed):
        fit each participant's loss aversion from their real choices.

    STAGE B (needs the imaging data + nilearn):
        build a first-level GLM with parametric "subjective value" modulators
        and map value-related activity for one participant.

----------------------------------------------------------------------
GETTING THE DATA
----------------------------------------------------------------------
The lightweight way to grab one participant's event files is the `openneuro-py`
package:

    pip install openneuro-py nilearn
    python3 -m openneuro download --dataset ds001734 --target-dir ds001734 \
        --include 'sub-001/func/sub-001_task-MGT_*_events.tsv'

`events.tsv` files are tiny (a few KB each) so STAGE A works even if you skip the
imaging download. STAGE B additionally needs one fMRIPrep BOLD run, brain mask,
and confounds file; see the README for the larger download command. Point
DATA_DIR below at wherever you downloaded ds001734.
"""

from __future__ import annotations

import glob
import os
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.special import expit

DATA_DIR = os.environ.get("NARPS_DIR", "ds001734")  # where ds001734 lives
RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


# ===========================================================================
# STAGE A — fit LOSS AVERSION from real choices (no imaging required)
# ===========================================================================
#
# Prospect-theory value of accepting a 50/50 gamble of +gain or -loss:
#
#       EV = 0.5 * gain  -  0.5 * lambda * loss
#
# lambda > 1 means losses loom larger than equal-sized gains (loss aversion).
# Choice rule (same logistic/softmax as the harm-aversion model in Part 1):
#
#       P(accept) = logistic(mu * EV)
#
# We estimate (lambda, mu) per participant by maximum likelihood.


def subjective_value(gain, loss, lam):
    """Expected subjective value of accepting the gamble."""
    return 0.5 * gain - 0.5 * lam * np.asarray(loss)


def _neg_log_lik(params, gain, loss, accepted):
    lam, mu = params
    ev = subjective_value(gain, loss, lam)
    p = np.clip(expit(mu * ev), 1e-9, 1 - 1e-9)
    return -np.sum(accepted * np.log(p) + (1 - accepted) * np.log(1 - p))


def fit_loss_aversion(gain, loss, accepted, n_restarts=8, seed=0):
    """Maximum-likelihood (lambda, mu) for one participant's gamble choices."""
    rng = np.random.default_rng(seed)
    bounds = [(0.1, 8.0), (1e-3, 5.0)]  # lambda, mu (per-unit-money temperature)
    best = None
    for _ in range(n_restarts):
        x0 = [rng.uniform(0.5, 3.0), rng.uniform(0.05, 1.0)]
        res = minimize(_neg_log_lik, x0, args=(gain, loss, accepted),
                       method="L-BFGS-B", bounds=bounds)
        if res.success and (best is None or res.fun < best.fun):
            best = res
    return best.x  # (lambda_hat, mu_hat)


def load_events(subject: str) -> pd.DataFrame:
    """Concatenate a participant's NARPS events across runs.

    NARPS events.tsv columns include: onset, duration, gain, loss, RT,
    participant_response (e.g. 'strongly_accept', 'weakly_reject', ...).
    """
    pattern = os.path.join(DATA_DIR, subject, "func", f"{subject}_task-MGT_*_events.tsv")
    files = sorted(glob.glob(pattern))
    if not files:
        raise FileNotFoundError(f"No events files for {subject} under {DATA_DIR!r}. "
                                "Download the dataset first (see the header).")
    frames = []
    for run_idx, f in enumerate(files, start=1):
        df = pd.read_csv(f, sep="\t")
        df["run"] = run_idx
        frames.append(df)
    return pd.concat(frames, ignore_index=True)


def choices_from_events(ev: pd.DataFrame):
    """Turn the 'participant_response' text into a 0/1 accepted vector.

    Trials with no response ('NoResp') are dropped.
    """
    resp = ev["participant_response"].astype(str)
    accepted = resp.str.contains("accept").astype(int)
    keep = ~resp.str.contains("NoResp")
    return ev.loc[keep], accepted[keep].to_numpy()


def stage_a(subject: str = "sub-001"):
    ev = load_events(subject)
    ev_keep, accepted = choices_from_events(ev)
    gain = ev_keep["gain"].to_numpy(dtype=float)
    loss = ev_keep["loss"].to_numpy(dtype=float)

    lam, mu = fit_loss_aversion(gain, loss, accepted)
    print(f"[{subject}]  estimated loss aversion lambda = {lam:.2f}   (mu = {mu:.3f})")
    print(f"            accepted {accepted.mean():.0%} of {len(accepted)} gambles")
    if lam > 1:
        print("            lambda > 1: losses loom larger than gains (loss aversion).")
    return lam, mu


# ===========================================================================
# STAGE B — model-based first-level fMRI GLM (needs nilearn + imaging)
# ===========================================================================
#
# We build three regressors, each convolved with the hemodynamic response:
#   * decision : a constant "a gamble was on screen" event (modulation = 1)
#   * gain     : parametric, modulated by the (demeaned) gain on each trial
#   * loss     : parametric, modulated by the (demeaned) loss on each trial
# Subjective value is an exact linear combination of gain and loss, so we compute
# the model-based value map as a lambda-weighted contrast after fitting the GLM.


def build_modulated_events(ev_run: pd.DataFrame) -> pd.DataFrame:
    """Long-format events with one parametric modulator per trial_type.

    nilearn reads a 'modulation' column and scales each event's regressor
    amplitude by it, so we stack one labelled copy of the events per regressor.
    Parametric values are mean-centered so they are not collinear with the main
    'decision' regressor.

    We deliberately model only `decision`, `gain`, and `loss`. We do NOT add a
    separate `value` regressor, because subjective value EV = 0.5*gain -
    0.5*lambda*loss is an exact linear combination of gain and loss and would be
    perfectly collinear with them. Instead we form the model-based value map as a
    lambda-weighted *contrast* of the gain and loss regressors (see stage_b) --
    a neat illustration of how the behavioral model enters the fMRI analysis.
    """
    onset = ev_run["onset"].to_numpy(dtype=float)
    duration = ev_run["duration"].to_numpy(dtype=float)
    gain = ev_run["gain"].to_numpy(dtype=float)
    loss = ev_run["loss"].to_numpy(dtype=float)

    def block(trial_type, modulation):
        return pd.DataFrame(
            dict(onset=onset, duration=duration, trial_type=trial_type,
                 modulation=modulation)
        )

    return pd.concat(
        [
            block("decision", np.ones_like(onset)),
            block("gain", gain - gain.mean()),
            block("loss", loss - loss.mean()),
        ],
        ignore_index=True,
    )


def select_confounds(confounds_path: str) -> pd.DataFrame:
    """Pick the 6 motion confounds from the fMRIPrep file.

    fMRIPrep changed its column names over versions: newer outputs use
    trans_x/rot_x, while the (older) NARPS derivatives use X/RotX. Support both.
    """
    conf = pd.read_csv(confounds_path, sep="\t")
    new = ["trans_x", "trans_y", "trans_z", "rot_x", "rot_y", "rot_z"]
    old = ["X", "Y", "Z", "RotX", "RotY", "RotZ"]
    cols = [c for c in new if c in conf.columns] or [c for c in old if c in conf.columns]
    return conf[cols].fillna(0.0)


def _first(*patterns):
    """Return the first existing file matching any of the glob patterns."""
    for p in patterns:
        hits = sorted(glob.glob(p))
        if hits:
            return hits[0]
    return None


def stage_b(subject: str = "sub-001", run: int = 1, lam: float | None = None,
            t_r: float = 1.0, smoothing_fwhm: float = 5.0):
    """Fit a model-based first-level GLM for one run and save value/gain/loss maps.

    Assumes fMRIPrep-preprocessed BOLD in MNI space and a confounds file, the
    standard derivatives NARPS ships. Adjust the file patterns if your layout
    differs. TR for NARPS is 1.0 s -- confirm in the BOLD .json sidecar.
    """
    # Imported here so STAGE A works without nilearn installed.
    from nilearn.glm.first_level import FirstLevelModel
    from nilearn import plotting

    if lam is None:
        lam, _ = stage_a(subject)

    fmriprep = os.path.join(DATA_DIR, "derivatives", "fmriprep", subject, "func")
    mni = "space-MNI152NLin2009cAsym"
    base = f"{subject}_task-MGT_run-{run:02d}"
    # Accept new (desc-preproc_bold) and old (bold_..._preproc) fMRIPrep naming.
    bold = _first(
        os.path.join(fmriprep, f"{base}_{mni}_desc-preproc_bold.nii.gz"),
        os.path.join(fmriprep, f"{base}_bold_{mni}_preproc.nii.gz"),
    )
    mask = _first(
        os.path.join(fmriprep, f"{base}_{mni}_desc-brain_mask.nii.gz"),
        os.path.join(fmriprep, f"{base}_bold_{mni}_brainmask.nii.gz"),
    )
    confounds = _first(
        os.path.join(fmriprep, f"{base}_desc-confounds_timeseries.tsv"),
        os.path.join(fmriprep, f"{base}_bold_confounds.tsv"),
    )
    events_file = _first(
        os.path.join(DATA_DIR, subject, "func", f"{base}_events.tsv"))
    if not (bold and confounds and events_file):
        raise FileNotFoundError(
            "Missing preprocessed BOLD / confounds / events for "
            f"{subject} run {run}. Download the fMRIPrep derivatives.")

    ev_run = pd.read_csv(events_file, sep="\t")
    design_events = build_modulated_events(ev_run)
    conf = select_confounds(confounds)

    glm = FirstLevelModel(
        t_r=t_r,
        hrf_model="spm",
        smoothing_fwhm=smoothing_fwhm,
        mask_img=mask,
        high_pass=1.0 / 128,
        minimize_memory=True,
    )
    glm.fit(bold, events=design_events, confounds=conf)

    # Build contrasts over the fitted design's columns. The model-based "value"
    # map is a lambda-weighted combination of the gain and loss regressors:
    # value = 0.5*gain - 0.5*lambda*loss. This is where the behavioral model
    # (the fitted lambda) enters the imaging analysis.
    columns = glm.design_matrices_[0].columns.tolist()

    def contrast_vector(weights):
        vec = np.zeros(len(columns))
        for col, w in weights.items():
            vec[columns.index(col)] = w
        return vec

    contrasts = {
        "gain": contrast_vector({"gain": 1.0}),
        "loss": contrast_vector({"loss": 1.0}),
        "value": contrast_vector({"gain": 0.5, "loss": -0.5 * lam}),
    }

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    for name, vec in contrasts.items():
        z_map = glm.compute_contrast(vec, output_type="z_score")
        out = RESULTS_DIR / f"{subject}_run-{run:02d}_{name}_zmap.nii.gz"
        z_map.to_filename(out)
        # vmPFC / ventral striatum expected to track gain and (model-based) value.
        display = plotting.plot_stat_map(
            z_map, threshold=3.1, title=f"{subject}: {name} (z>3.1)",
            display_mode="ortho", cut_coords=(0, 40, -8))
        fig_out = RESULTS_DIR / f"{subject}_run-{run:02d}_{name}_zmap.png"
        display.savefig(fig_out)
        display.close()
        print(f"saved {out} and {fig_out}")


if __name__ == "__main__":
    # STAGE A always runs (tiny files). STAGE B runs only if the imaging data and
    # nilearn are present; otherwise we explain what to download.
    try:
        lam, mu = stage_a("sub-001")
    except FileNotFoundError as exc:
        print(exc)
        raise SystemExit(0)

    try:
        stage_b("sub-001", run=1, lam=lam)
    except Exception as exc:  # nilearn missing or imaging not downloaded
        print(f"\n[Stage B skipped] {exc}")
        print("Install nilearn and download the fMRIPrep derivatives to run the GLM.")
