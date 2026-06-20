"""
ISC on a REAL, ready-to-run movie dataset: "Partly Cloudy" (Richardson et al.)
==============================================================================

The Grand Budapest Hotel data (ds003017) ships *raw* only, so running ISC on it
means preprocessing it yourself with fMRIPrep first. To keep this tutorial
runnable end-to-end on REAL data, we use a movie dataset that nilearn can fetch
already preprocessed: the **"Partly Cloudy"** Pixar short from Richardson et al.
(2018), watched by children and adults. It is the canonical theory-of-mind movie
-- dense with characters, emotions, and false-belief moments -- so it is ideal
for seeing the *social brain* synchronize.

We reuse the exact `leave_one_out_isc` from `isc_demo.py`; only the data change.

Run:

    python tutorials/naturalistic-isc/code/isc_partly_cloudy.py

Needs: nilearn (+ numpy, scipy, matplotlib). No manual download or login.
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np

from isc_demo import leave_one_out_isc, fisher_mean

N_SUBJECTS = int(os.environ.get("ISC_N", "30"))
N_REGIONS = 400
RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


def fetch_movie(requested):
    """Fetch the movie data, tolerating OSF hiccups.

    nilearn pulls these files from OSF, which occasionally rate-limits with a 403.
    We retry, and if a specific subject's file keeps failing we fall back to fewer
    subjects (already-downloaded subjects stay cached, so this is cheap).
    """
    import time

    from nilearn.datasets import fetch_development_fmri

    for n in [requested, 25, 20, 15, 13, 10, 8]:
        if n > requested:
            continue
        try:
            return fetch_development_fmri(n_subjects=n), n
        except Exception as exc:  # transient OSF error or a flaky file
            print(f"  fetch of {n} subjects failed ({exc}); trying fewer ...", flush=True)
            time.sleep(2)
    raise RuntimeError("Could not fetch Partly Cloudy data from OSF — try again later.")


def main():
    from nilearn.datasets import fetch_atlas_schaefer_2018
    from nilearn.maskers import NiftiLabelsMasker

    print(f"Fetching up to {N_SUBJECTS} subjects of 'Partly Cloudy' movie fMRI ...", flush=True)
    data, n_used = fetch_movie(N_SUBJECTS)
    print(f"Using {n_used} subjects.", flush=True)

    atlas = fetch_atlas_schaefer_2018(n_rois=N_REGIONS, yeo_networks=7)
    masker = NiftiLabelsMasker(
        labels_img=atlas.maps,
        standardize="zscore_sample",
        detrend=True,
        memory="nilearn_cache",
        verbose=0,
    )

    # One region-by-time matrix per subject, with confounds regressed out.
    series = []
    for i, (func, conf) in enumerate(zip(data.func, data.confounds)):
        ts = masker.fit_transform(func, confounds=conf)   # (timepoints, regions)
        series.append(ts.T)                                # (regions, timepoints)
        print(f"  extracted subject {i + 1}/{len(data.func)}", flush=True)

    # All subjects saw the same movie; trim to the shortest run to align lengths.
    min_t = min(s.shape[1] for s in series)
    stacked = np.stack([s[:, :min_t] for s in series], axis=1)  # (regions, subjects, T)
    print(f"\nstacked shape (regions, subjects, timepoints) = {stacked.shape}", flush=True)

    # ISC per region (leave-one-out, averaged across subjects in Fisher-z space).
    isc = np.array([fisher_mean(leave_one_out_isc(stacked[r])) for r in range(stacked.shape[0])])

    try:
        labels = [l.decode() if isinstance(l, bytes) else str(l) for l in atlas.labels]
    except Exception:
        labels = ["region_%d" % i for i in range(len(isc))]

    order = np.argsort(isc)[::-1]
    print("\nISC summary: mean=%.3f, max=%.3f" % (isc.mean(), isc.max()))
    print("Top 12 regions by inter-subject correlation:")
    for r in order[:12]:
        print("  ISC=%.3f  %s" % (isc[r], labels[r] if r < len(labels) else "region_%d" % r))

    # Paint ISC onto the atlas and save a brain map + a top-regions bar chart.
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from nilearn import image, plotting

    atlas_data = image.get_data(atlas.maps)
    out = np.zeros(atlas_data.shape, dtype=float)
    for idx in range(1, len(isc) + 1):
        out[atlas_data == idx] = isc[idx - 1]
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    isc_img = image.new_img_like(atlas.maps, out)
    nii_out = RESULTS_DIR / "partly_cloudy_isc_map.nii.gz"
    map_out = RESULTS_DIR / "partly_cloudy_isc_map.png"
    top_out = RESULTS_DIR / "partly_cloudy_isc_top_regions.png"
    isc_img.to_filename(nii_out)

    disp = plotting.plot_stat_map(
        isc_img, threshold=0.1, cmap="hot", colorbar=True, display_mode="z",
        cut_coords=6, title="Partly Cloudy: inter-subject correlation (%d subjects)" % n_used)
    disp.savefig(map_out)
    disp.close()

    # Clean short labels for the bar chart.
    def short(lab):
        return lab.replace("7Networks_", "").replace("_", " ")

    fig, ax = plt.subplots(figsize=(7, 4.2))
    top = order[:12][::-1]
    ax.barh([short(labels[r]) for r in top], isc[top], color="#2563eb")
    ax.set(xlabel="leave-one-out ISC", title="Most synchronized regions ('Partly Cloudy')")
    fig.tight_layout()
    fig.savefig(top_out, dpi=120)
    print(f"\nSaved {nii_out}, {map_out}, and {top_out}")


if __name__ == "__main__":
    main()
