"""
ISC on a REAL naturalistic movie dataset: The Grand Budapest Hotel (ds003017)
=============================================================================

25 people watched a ~50-minute, socially-rich segment of Wes Anderson's film in
an fMRI scanner. Because everyone saw the *same* movie, we can ask: where do
brains respond in a shared, time-locked way? We reuse the exact `leave_one_out_isc`
function from `isc_demo.py` -- only the data are different (real instead of
simulated).

Expected high-ISC regions: early auditory & visual cortex (the movie's sights and
sounds), and -- because the film is dense with characters, faces, and social
interactions -- the SOCIAL BRAIN: superior temporal sulcus (STS), temporoparietal
junction (TPJ), and medial prefrontal / precuneus.

----------------------------------------------------------------------
GET THE DATA (a few subjects is enough to see the effect)
----------------------------------------------------------------------
    pip install openneuro-py nilearn
    python3 -m openneuro download --dataset ds003017 --target-dir ds003017 \
        --include 'derivatives/sub-sid000005/**' \
        --include 'derivatives/sub-sid000007/**' \
        --include 'derivatives/sub-sid000009/**'

This dataset ships preprocessed, MNI-space BOLD in `derivatives/`. Point DATA_DIR
at it. (For a real study you would use all 25 subjects.)

For production ISC research, see the BrainIAK toolbox
(https://brainiak.org), whose `brainiak.isc.isc` does this at scale with
permutation inference; here we keep it to nilearn + numpy so the mechanics are
transparent.
"""

from __future__ import annotations

import glob
import os
from pathlib import Path

import numpy as np

# Reuse the ISC math from Part 1 so the "real" analysis is literally the same code.
from isc_demo import leave_one_out_isc, fisher_mean

DATA_DIR = os.environ.get("BUDAPEST_DIR", "ds003017")
TR = float(os.environ.get("BUDAPEST_TR", "1.0"))  # seconds; confirm in the BOLD .json
RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


def find_bold(subject_dir: str):
    """Find a subject's preprocessed, MNI-space movie BOLD file."""
    patterns = [
        os.path.join(subject_dir, "**", "*space-MNI152*preproc*bold.nii.gz"),
        os.path.join(subject_dir, "**", "*task-movie*bold.nii.gz"),
        os.path.join(subject_dir, "**", "*bold.nii.gz"),
    ]
    for pat in patterns:
        hits = sorted(glob.glob(pat, recursive=True))
        if hits:
            return hits[0]
    return None


def extract_region_timeseries(bold_files, n_regions=400):
    """Turn each subject's 4D BOLD into a (n_regions x n_timepoints) matrix.

    We average voxels within each parcel of the Schaefer-2018 atlas, with
    standardization, detrending, and band-pass cleaning -- standard ISC
    preprocessing. All subjects share the atlas, so region r means the same
    anatomy across people.
    """
    from nilearn.datasets import fetch_atlas_schaefer_2018
    from nilearn.maskers import NiftiLabelsMasker

    atlas = fetch_atlas_schaefer_2018(n_rois=n_regions, yeo_networks=7)
    masker = NiftiLabelsMasker(
        labels_img=atlas.maps,
        standardize="zscore_sample",
        detrend=True,
        low_pass=0.1,
        high_pass=0.01,
        t_r=TR,
        memory="nilearn_cache",
        verbose=0,
    )

    series = []
    for f in bold_files:
        ts = masker.fit_transform(f)        # (timepoints, regions)
        series.append(ts.T)                  # -> (regions, timepoints)
    # Naturalistic runs should be the same length; trim to the shortest to be safe.
    min_t = min(s.shape[1] for s in series)
    series = [s[:, :min_t] for s in series]
    return np.stack(series, axis=1), atlas  # (regions, subjects, timepoints)


def region_isc(stacked):
    """ISC per region: stacked is (regions, subjects, timepoints)."""
    n_regions = stacked.shape[0]
    isc = np.empty(n_regions)
    for r in range(n_regions):
        isc[r] = fisher_mean(leave_one_out_isc(stacked[r]))
    return isc


def main():
    subject_dirs = sorted(glob.glob(os.path.join(DATA_DIR, "derivatives", "sub-*")))
    if not subject_dirs:
        subject_dirs = sorted(glob.glob(os.path.join(DATA_DIR, "sub-*")))
    bold_files = [b for d in subject_dirs if (b := find_bold(d))]

    if len(bold_files) < 3:
        print(f"Found {len(bold_files)} BOLD files under {DATA_DIR!r}. "
              "Download at least ~3 subjects first (see the header).")
        return

    print(f"Computing ISC across {len(bold_files)} subjects...")
    stacked, atlas = extract_region_timeseries(bold_files)
    isc = region_isc(stacked)

    # Report the most synchronized regions -- expect sensory + social-brain parcels.
    try:
        labels = [l.decode() if isinstance(l, bytes) else str(l) for l in atlas.labels]
    except Exception:
        labels = [f"region_{i}" for i in range(len(isc))]
    order = np.argsort(isc)[::-1]
    print("\nTop 15 regions by inter-subject correlation:")
    for r in order[:15]:
        name = labels[r] if r < len(labels) else f"region_{r}"
        print(f"  ISC = {isc[r]:.3f}   {name}")

    # Save an ISC brain map (ISC value painted onto each atlas parcel).
    try:
        from nilearn import image, plotting

        # Paint each parcel with its ISC value to make a brain map.
        atlas_data = image.get_data(atlas.maps)
        out = np.zeros(atlas_data.shape, dtype=float)
        for idx in range(1, len(isc) + 1):
            out[atlas_data == idx] = isc[idx - 1]
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        isc_img = image.new_img_like(atlas.maps, out)
        nii_out = RESULTS_DIR / "budapest_isc_map.nii.gz"
        png_out = RESULTS_DIR / "budapest_isc_map.png"
        isc_img.to_filename(nii_out)

        display = plotting.plot_stat_map(
            isc_img, threshold=0.1, title="Grand Budapest Hotel: inter-subject correlation",
            display_mode="z", cut_coords=6, cmap="hot")
        display.savefig(png_out)
        display.close()
        print(f"\nSaved {nii_out} and {png_out}")
    except Exception as exc:  # pragma: no cover
        print(f"\n(Skipped brain map: {exc})")


if __name__ == "__main__":
    main()
