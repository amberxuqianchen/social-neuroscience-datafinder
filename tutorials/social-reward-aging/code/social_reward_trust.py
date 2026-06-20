"""
Social Reward and Trust Across Adulthood
========================================

This script supports a lifespan social-neuroscience tutorial in three layers:

1. A no-download teaching demo that simulates younger and older adults making
   trust-game decisions with friends, strangers, and computer partners.
2. A real-event summary for OpenNeuro ds005123 when BIDS events are downloaded.
3. One optional first-level fMRI GLM with nilearn: friend > stranger.

Run the demo (from the repository root):

    python tutorials/social-reward-aging/code/social_reward_trust.py

Run real events, if downloaded:

    SOCIAL_REWARD_DIR=/path/to/ds005123 python tutorials/social-reward-aging/code/social_reward_trust.py --real

Run one GLM, if preprocessed derivatives or one raw echo are available:

    SOCIAL_REWARD_DIR=/path/to/ds005123 python tutorials/social-reward-aging/code/social_reward_trust.py --glm
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats


ROOT = Path(__file__).resolve().parents[1]
RESULTS_DIR = ROOT / "results"
DEFAULT_DATA_DIR = Path(os.environ.get("SOCIAL_REWARD_DIR", "ds005123"))

AGE_ORDER = ["younger", "older"]
PARTNER_ORDER = ["computer", "stranger", "friend"]


def softmax(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, dtype=float)
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()


def simulate_trust_data(seed: int = 7, trials_per_partner: int = 48) -> pd.DataFrame:
    """Simulate a compact age-by-partner trust-game dataset.

    The values are intentionally plausible rather than inferential. They create a
    known partner effect, then ask whether the friend/stranger/computer pattern
    differs across age groups.
    """
    rng = np.random.default_rng(seed)
    share_options = np.array([0.0, 2.0, 4.0, 8.0])
    rows: list[dict[str, object]] = []

    participants = [("younger", 26), ("older", 24)]
    partner_bonus = {
        "younger": {"computer": -0.30, "stranger": 0.05, "friend": 0.55},
        "older": {"computer": -0.20, "stranger": 0.25, "friend": 0.50},
    }

    for group, n_subjects in participants:
        for sid in range(n_subjects):
            subject = f"{group[0]}{sid + 1:02d}"
            social_warmth = rng.normal(0.0, 0.22)
            decisiveness = rng.uniform(1.8, 3.2)
            for partner in PARTNER_ORDER:
                for trial in range(trials_per_partner):
                    generosity = 0.42 + partner_bonus[group][partner] + social_warmth
                    cost = 0.32 + rng.normal(0.0, 0.02)
                    utility = decisiveness * (
                        generosity * (share_options / 8.0) - cost * (share_options / 8.0) ** 2
                    )
                    share = rng.choice(share_options, p=softmax(utility))
                    rows.append(
                        {
                            "subject": subject,
                            "age_group": group,
                            "partner": partner,
                            "trial": trial + 1,
                            "amount_shared": share,
                            "shared": int(share > 0),
                        }
                    )

    return pd.DataFrame(rows)


def design_matrix(df: pd.DataFrame) -> tuple[np.ndarray, list[str]]:
    """Reference-coded linear model: younger/computer is the intercept."""
    older = (df["age_group"] == "older").astype(float).to_numpy()
    stranger = (df["partner"] == "stranger").astype(float).to_numpy()
    friend = (df["partner"] == "friend").astype(float).to_numpy()
    X = np.column_stack(
        [
            np.ones(len(df)),
            older,
            stranger,
            friend,
            older * stranger,
            older * friend,
        ]
    )
    names = [
        "intercept_young_computer",
        "older",
        "stranger_vs_computer",
        "friend_vs_computer",
        "older_x_stranger",
        "older_x_friend",
    ]
    return X, names


def fit_linear_model(df: pd.DataFrame, outcome: str = "amount_shared") -> pd.DataFrame:
    X, names = design_matrix(df)
    y = df[outcome].to_numpy(dtype=float)
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ beta
    dof = len(y) - X.shape[1]
    sigma2 = float((resid @ resid) / dof)
    cov = sigma2 * np.linalg.inv(X.T @ X)
    se = np.sqrt(np.diag(cov))
    t = beta / se
    p = 2 * stats.t.sf(np.abs(t), dof)
    return pd.DataFrame({"term": names, "estimate": beta, "se": se, "t": t, "p": p})


def summarize_by_group(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df.groupby(["age_group", "partner"], observed=True)["amount_shared"]
        .agg(["mean", "sem", "count"])
        .reindex(pd.MultiIndex.from_product([AGE_ORDER, PARTNER_ORDER], names=["age_group", "partner"]))
        .reset_index()
    )


def plot_demo(df: pd.DataFrame, model: pd.DataFrame, out_path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    out_path.parent.mkdir(parents=True, exist_ok=True)
    summary = summarize_by_group(df)
    x = np.arange(len(PARTNER_ORDER))
    width = 0.36
    colors = {"younger": "#2563eb", "older": "#0d9488"}

    fig, ax = plt.subplots(1, 2, figsize=(11.5, 4.2), gridspec_kw={"width_ratios": [1.15, 1]})

    for offset, group in [(-width / 2, "younger"), (width / 2, "older")]:
        sub = summary[summary["age_group"] == group]
        ax[0].bar(
            x + offset,
            sub["mean"],
            yerr=sub["sem"],
            width=width,
            capsize=4,
            color=colors[group],
            label=group.capitalize(),
            alpha=0.9,
        )
    ax[0].set_xticks(x, [p.capitalize() for p in PARTNER_ORDER])
    ax[0].set_ylabel("Mean amount shared")
    ax[0].set_title("Trust-game behavior by partner")
    ax[0].legend(frameon=False)
    ax[0].set_ylim(0, 8)

    terms = model[model["term"].isin(["stranger_vs_computer", "friend_vs_computer", "older_x_stranger", "older_x_friend"])]
    labels = ["Stranger\nvs computer", "Friend\nvs computer", "Older x\nstranger", "Older x\nfriend"]
    ax[1].axhline(0, color="black", lw=0.8)
    ax[1].bar(np.arange(len(terms)), terms["estimate"], yerr=1.96 * terms["se"], color="#475569")
    ax[1].set_xticks(np.arange(len(terms)), labels)
    ax[1].set_ylabel("Model estimate (95% CI)")
    ax[1].set_title("Partner and age-by-partner effects")

    fig.tight_layout()
    fig.savefig(out_path, dpi=140)


def run_demo() -> pd.DataFrame:
    df = simulate_trust_data()
    model = fit_linear_model(df)
    summary = summarize_by_group(df)

    print("Simulated trust-game demo (50 participants, 3 partner types)")
    print("\nMean amount shared by group and partner:")
    for _, row in summary.iterrows():
        print(f"  {row.age_group:7s} {row.partner:8s}: {row['mean']:.2f} +/- {row['sem']:.2f}")

    print("\nLinear model: amount_shared ~ age_group * partner")
    for _, row in model.iterrows():
        print(f"  {row.term:24s} b={row.estimate:6.3f}  t={row.t:6.2f}  p={row.p:.2e}")

    out = RESULTS_DIR / "social_reward_trust_demo.png"
    plot_demo(df, model, out)
    print(f"\nSaved {out}")
    return df


def find_events(data_dir: Path, task_hint: str = "trust") -> list[Path]:
    patterns = [
        data_dir / "sub-*" / "func" / f"*task-*{task_hint}*_events.tsv",
        data_dir / "sub-*" / "func" / "*events.tsv",
    ]
    hits: list[Path] = []
    for pat in patterns:
        hits.extend(Path(p) for p in glob.glob(str(pat)))
    uniq = sorted(set(hits))
    return [p for p in uniq if task_hint.lower() in p.name.lower()] or uniq


def normalize_partner(value: object) -> str | None:
    text = str(value).lower()
    for label in PARTNER_ORDER:
        if label in text:
            return label
    return None


def infer_partner_column(df: pd.DataFrame) -> str | None:
    preferred = ["partner", "agent", "opponent", "condition", "trial_type", "stim_type", "recipient"]
    candidates = [c for c in preferred if c in df.columns] + [
        c for c in df.columns if any(key in c.lower() for key in ["partner", "condition", "trial", "recipient"])
    ]
    for col in dict.fromkeys(candidates):
        values = df[col].dropna().astype(str).head(200)
        if values.map(normalize_partner).notna().any():
            return col
    return None


def infer_amount_column(df: pd.DataFrame) -> str | None:
    preferred_patterns = [
        r"trust_value",
        r"amount.*(share|invest|send)",
        r"(share|invest|send).*amount",
        r"investment",
        r"invest",
        r"share",
        r"send",
        r"choice",
    ]
    excluded = {"onset", "duration", "run", "trial", "trial_index", "response_time", "rt"}
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    for col in numeric_cols:
        name = col.lower()
        if name in excluded:
            continue
        if any(re.search(pat, name) for pat in preferred_patterns):
            return col
    for col in numeric_cols:
        if col.lower() not in excluded:
            return col
    return None


def participant_age_groups(data_dir: Path) -> dict[str, str]:
    participants = data_dir / "participants.tsv"
    if not participants.exists():
        return {}
    df = pd.read_csv(participants, sep="\t")
    if "participant_id" not in df.columns:
        return {}
    age_col = next((c for c in ["age", "Age", "age_years"] if c in df.columns), None)
    group_col = next((c for c in ["age_group", "group", "Group"] if c in df.columns), None)
    mapping: dict[str, str] = {}
    for _, row in df.iterrows():
        sid = str(row["participant_id"])
        if age_col is not None and pd.notna(row[age_col]):
            mapping[sid] = "older" if float(row[age_col]) >= 60 else "younger"
        elif group_col is not None:
            text = str(row[group_col]).lower()
            if "old" in text:
                mapping[sid] = "older"
            elif "young" in text:
                mapping[sid] = "younger"
    return mapping


def load_real_trust_events(data_dir: Path, limit_subjects: int | None = None) -> pd.DataFrame:
    files = find_events(data_dir, "trust")
    if limit_subjects is not None:
        files = files[:limit_subjects]
    if not files:
        raise FileNotFoundError(f"No trust-task events found under {data_dir!s}.")

    age_groups = participant_age_groups(data_dir)
    frames = []
    missing_column_examples = []
    for f in files:
        df = pd.read_csv(f, sep="\t")
        partner_col = infer_partner_column(df)
        amount_col = infer_amount_column(df)
        if partner_col is None or amount_col is None:
            missing_column_examples.append((f, list(df.columns)))
            continue
        subject = next((part for part in f.parts if part.startswith("sub-")), f.parent.parent.name)
        keep = df.copy()
        keep["subject"] = subject
        keep["age_group"] = age_groups.get(subject, "unknown")
        keep["partner"] = keep[partner_col].map(normalize_partner)
        keep["amount_shared"] = pd.to_numeric(keep[amount_col], errors="coerce")
        keep = keep.dropna(subset=["partner", "amount_shared"])
        frames.append(keep[["subject", "age_group", "partner", "amount_shared"]])

    if not frames:
        cols = "\n".join(f"  {path}: {columns}" for path, columns in missing_column_examples[:5])
        raise ValueError(
            "Found event files, but could not infer partner and amount columns.\n"
            "Map the real event columns in infer_partner_column/infer_amount_column.\n"
            f"Examples:\n{cols}"
        )
    return pd.concat(frames, ignore_index=True)


def run_real_behavior(data_dir: Path) -> None:
    df = load_real_trust_events(data_dir)
    known = df[df["age_group"].isin(AGE_ORDER)].copy()
    if known.empty:
        print("Loaded real trust events, but no age-group labels were inferred from participants.tsv.")
        print(df.groupby(["partner"])["amount_shared"].agg(["mean", "sem", "count"]))
        return

    model = fit_linear_model(known)
    print(f"Loaded {known.subject.nunique()} subjects from {data_dir}")
    print("\nMean amount shared by group and partner:")
    print(summarize_by_group(known).to_string(index=False))
    print("\nLinear model:")
    print(model.to_string(index=False, formatters={"estimate": "{:.3f}".format, "se": "{:.3f}".format, "t": "{:.2f}".format, "p": "{:.2e}".format}))


def select_confounds(path: Path) -> pd.DataFrame:
    conf = pd.read_csv(path, sep="\t")
    new = ["trans_x", "trans_y", "trans_z", "rot_x", "rot_y", "rot_z"]
    old = ["X", "Y", "Z", "RotX", "RotY", "RotZ"]
    cols = [c for c in new if c in conf.columns] or [c for c in old if c in conf.columns]
    return conf[cols].fillna(0.0) if cols else pd.DataFrame(index=conf.index)


def first_match(patterns: list[Path]) -> Path | None:
    for pat in patterns:
        hits = sorted(glob.glob(str(pat), recursive=True))
        if hits:
            return Path(hits[0])
    return None


def find_glm_inputs(data_dir: Path, subject: str | None = None) -> tuple[str, Path, Path, Path | None, Path | None]:
    event_files = find_events(data_dir, "trust")
    if subject is not None:
        event_files = [p for p in event_files if subject in p.parts or subject in p.name]
    for event_file in event_files:
        sub = next((part for part in event_file.parts if part.startswith("sub-")), event_file.parent.parent.name)
        task_stem = event_file.name.replace("_events.tsv", "")
        deriv = data_dir / "derivatives"
        bold = first_match(
            [
                deriv / "**" / sub / "**" / f"{task_stem}*space-MNI*desc-preproc_bold.nii.gz",
                deriv / "**" / sub / "**" / f"{task_stem}*space-MNI*preproc*bold.nii.gz",
                deriv / "**" / sub / "**" / "*task-*trust*space-MNI*desc-preproc_bold.nii.gz",
                data_dir / sub / "func" / f"{task_stem}*echo-1_part-mag_bold.nii.gz",
                data_dir / sub / "func" / f"{task_stem}*bold.nii.gz",
            ]
        )
        confounds = first_match(
            [
                deriv / "**" / sub / "**" / f"{task_stem}*desc-confounds_timeseries.tsv",
                deriv / "**" / sub / "**" / f"{task_stem}*confounds*.tsv",
                deriv / "**" / sub / "**" / "*task-*trust*confounds*.tsv",
            ]
        )
        mask = first_match(
            [
                deriv / "**" / sub / "**" / f"{task_stem}*space-MNI*desc-brain_mask.nii.gz",
                deriv / "**" / sub / "**" / f"{task_stem}*space-MNI*brainmask.nii.gz",
                deriv / "**" / sub / "**" / "*task-*trust*space-MNI*desc-brain_mask.nii.gz",
            ]
        )
        if bold is not None:
            return sub, event_file, bold, confounds, mask
    raise FileNotFoundError(
        "Could not find trust-task events plus BOLD under "
        f"{data_dir!s}. Download one trust-task BOLD run before running --glm."
    )


def build_partner_events(event_file: Path) -> pd.DataFrame:
    df = pd.read_csv(event_file, sep="\t")
    partner_col = infer_partner_column(df)
    if partner_col is None:
        raise ValueError(f"Could not infer partner column in {event_file}. Columns: {list(df.columns)}")
    if "onset" not in df.columns:
        raise ValueError(f"{event_file} has no BIDS onset column.")
    duration = df["duration"] if "duration" in df.columns else 0.0
    raw_labels = df[partner_col].astype(str)
    if raw_labels.str.lower().str.contains("choice").any():
        df = df[raw_labels.str.lower().str.contains("choice")].copy()
        raw_labels = df[partner_col].astype(str)

    events = pd.DataFrame(
        {
            "onset": pd.to_numeric(df["onset"], errors="coerce"),
            "duration": pd.to_numeric(df["duration"] if "duration" in df.columns else 0.0, errors="coerce"),
            "trial_type": raw_labels.map(normalize_partner),
        }
    )
    events = events.dropna(subset=["onset", "trial_type"])
    events = events[events["trial_type"].isin(PARTNER_ORDER)]
    if not {"friend", "stranger"}.issubset(set(events["trial_type"])):
        raise ValueError("Need at least friend and stranger trials for the friend > stranger contrast.")
    return events


def infer_tr(bold_file: Path, fallback: float) -> float:
    sidecar = Path(str(bold_file).replace(".nii.gz", ".json"))
    if not sidecar.exists():
        return fallback
    try:
        meta = json.loads(sidecar.read_text())
    except Exception:
        return fallback
    tr = meta.get("RepetitionTime")
    return float(tr) if tr else fallback


def run_one_glm(data_dir: Path, subject: str | None = None, t_r: float | None = None) -> None:
    from nilearn.glm.first_level import FirstLevelModel
    from nilearn import plotting

    sub, event_file, bold, confounds, mask = find_glm_inputs(data_dir, subject)
    events = build_partner_events(event_file)
    conf = select_confounds(confounds) if confounds is not None else None
    tr = infer_tr(bold, fallback=t_r or 2.0)

    glm = FirstLevelModel(
        t_r=tr,
        hrf_model="spm",
        smoothing_fwhm=5.0,
        high_pass=1.0 / 128,
        mask_img=str(mask) if mask is not None else None,
        minimize_memory=True,
    )
    glm.fit(str(bold), events=events, confounds=conf)
    columns = glm.design_matrices_[0].columns.tolist()
    weights = np.zeros(len(columns))
    weights[columns.index("friend")] = 1.0
    weights[columns.index("stranger")] = -1.0

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    z_map = glm.compute_contrast(weights, output_type="z_score")
    out_nii = RESULTS_DIR / f"{sub}_friend_minus_stranger_zmap.nii.gz"
    out_png = RESULTS_DIR / f"{sub}_friend_minus_stranger_zmap.png"
    z_map.to_filename(out_nii)
    display = plotting.plot_stat_map(
        z_map,
        threshold=3.1,
        display_mode="ortho",
        cut_coords=(0, 30, 0),
        title=f"{sub}: friend > stranger trust decisions",
    )
    display.savefig(out_png)
    display.close()
    print(f"Saved {out_nii}")
    print(f"Saved {out_png}")
    print(f"Used TR={tr:g}s from {bold.name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--real", action="store_true", help="Analyze downloaded ds005123 trust events.")
    parser.add_argument("--glm", action="store_true", help="Run one first-level friend > stranger GLM.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--subject", type=str, default=None, help="Optional subject id for --glm.")
    parser.add_argument("--tr", type=float, default=None)
    args = parser.parse_args()

    run_demo()

    if args.real:
        print("\n--- Real ds005123 event summary ---")
        run_real_behavior(args.data_dir)
    elif not args.data_dir.exists():
        print(
            "\nNo ds005123 directory found. To analyze real events, download OpenNeuro ds005123 "
            "and rerun with --real."
        )

    if args.glm:
        print("\n--- First-level GLM: friend > stranger ---")
        run_one_glm(args.data_dir, subject=args.subject, t_r=args.tr)


if __name__ == "__main__":
    main()
