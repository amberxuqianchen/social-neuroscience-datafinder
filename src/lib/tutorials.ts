export interface TutorialStep {
  n: number;
  title: string;
  body: string;
}

export interface TutorialFile {
  label: string;
  path: string;
  kind: "Notebook" | "Python" | "Requirements" | "Result";
}

export interface Tutorial {
  slug: string;
  title: string;
  blurb: string;
  level: string;
  time: string;
  tags: string[];
  image: string;
  imageAlt: string;
  caption: string;
  learn: string[];
  steps: TutorialStep[];
  datasets: { id: string; name: string }[];
  /** Path under tutorials/ in the repo. */
  dir: string;
  notebook: string;
  files: TutorialFile[];
}

export const TUTORIALS: Tutorial[] = [
  {
    slug: "harm-aversion-fmri",
    title: "Value-Based Modeling from Harm Aversion to fMRI",
    blurb:
      "Start with a moral question — would you hurt someone for money? — and the value-based choice model behind it. Then transfer the same machinery to real, open NARPS loss-aversion data: fit choices, and use each person’s fitted parameter to map value in the brain.",
    level: "Intermediate",
    time: "~2–3 hours",
    tags: ["Computational modeling", "Model-based fMRI", "Decision making", "Real NARPS data"],
    image: "/tutorials/narps-behavioral-modeling.png",
    imageAlt:
      "Three panels of behavioral modeling on real NARPS choices: the model's accept-probability curve matching observed choices, the distribution of loss-aversion lambda across participants, and per-participant model accuracy exceeding the base rate.",
    caption:
      "Real, executed result: the value-based choice model — the same machinery as harm aversion — fit to 26 NARPS participants' actual choices. It predicts behavior at 92.8% accuracy and recovers each person's loss aversion (λ).",
    learn: [
      "What a computational model of behavior is, and why social neuroscientists use them",
      "The value-based choice model (softmax over subjective value) behind harm and loss aversion",
      "Maximum-likelihood fitting, and checking it works with parameter recovery",
      "Fitting the model to real NARPS choices — and showing it predicts behavior (92.8% accuracy)",
      "Model-based fMRI: turning each person’s fitted parameter into a brain map",
      "Running the full pipeline on a real, open dataset (NARPS) with nilearn",
    ],
    steps: [
      {
        n: 1,
        title: "Learn the model",
        body: "Build the softmax value model (the harm-aversion paradigm) and recover its parameters from simulated choices, so you trust the method before touching real data. numpy + scipy only.",
      },
      {
        n: 2,
        title: "Fit real NARPS choices",
        body: "Fit the same model to 26 real participants’ gamble choices: recover each person’s loss aversion λ and show the model predicts their choices at 92.8% accuracy (pseudo-R² 0.69).",
      },
      {
        n: 3,
        title: "Model-based fMRI on NARPS",
        body: "Model gain and loss, then form the subjective-value map as a λ-weighted contrast of the two — mapping where the brain tracks value. Executed end-to-end on the real dataset.",
      },
    ],
    datasets: [
      { id: "crockett-harm-aversion", name: "Harm Aversion (Crockett)" },
      { id: "narps-mixed-gambles", name: "NARPS — Mixed Gambles" },
    ],
    dir: "harm-aversion-fmri",
    notebook: "harm_aversion_tutorial.ipynb",
    files: [
      { label: "Notebook", path: "harm_aversion_tutorial.ipynb", kind: "Notebook" },
      { label: "Setup requirements", path: "requirements.txt", kind: "Requirements" },
      { label: "Harm-aversion model", path: "code/harm_aversion_model.py", kind: "Python" },
      { label: "NARPS behavioral modeling", path: "code/narps_behavioral_modeling.py", kind: "Python" },
      { label: "Model-based fMRI", path: "code/model_based_fmri_narps.py", kind: "Python" },
    ],
  },
  {
    slug: "naturalistic-isc",
    title: "Inter-Subject Correlation on a Naturalistic Movie",
    blurb:
      "When people watch the same socially-rich film, their brains respond in similar, time-locked ways. Measure that shared response — no stimulus model needed — and watch the social brain track a movie full of people.",
    level: "Beginner → Intermediate",
    time: "~2 hours",
    tags: ["Naturalistic fMRI", "Inter-subject correlation", "Social brain", "nilearn"],
    image: "/tutorials/partly-cloudy-isc-map.png",
    imageAlt:
      "An inter-subject correlation brain map from 13 participants watching the Partly Cloudy movie: strong synchronization across visual cortex extending into temporal, parietal, and dorsomedial prefrontal (social-brain) regions.",
    caption:
      "Real, executed result: inter-subject correlation across 13 people watching the same movie. Visual cortex synchronizes most, with the social brain (dorsomedial PFC, near the TPJ) close behind.",
    learn: [
      "Why naturalistic stimuli (movies, stories) are powerful for studying the social brain",
      "Inter-subject correlation (ISC) and the standard leave-one-out estimator",
      "Telling a real ISC from noise with a circular-shift permutation test",
      "Running ISC on real fMRI with nilearn: atlas parcellation and region time series",
      "Interpreting high-ISC regions — sensory cortex and the social brain (STS, TPJ, mPFC)",
    ],
    steps: [
      {
        n: 1,
        title: "ISC + leave-one-out",
        body: "Simulate multi-subject movie data and compute leave-one-out ISC, recovering known ground truth. numpy + scipy only.",
      },
      {
        n: 2,
        title: "Test it’s real",
        body: "Build a circular-shift permutation null that destroys cross-subject time-alignment, and test whether the social-region ISC beats it.",
      },
      {
        n: 3,
        title: "Real movie data (executed)",
        body: "Fetch real Partly Cloudy movie fMRI with nilearn, parcellate with the Schaefer atlas, and compute ISC — the brain map shows visual cortex and the social brain (dmPFC, near the TPJ) synchronizing.",
      },
    ],
    datasets: [
      { id: "richardson-partly-cloudy", name: "Partly Cloudy" },
      { id: "grand-budapest-hotel-fmri", name: "Grand Budapest Hotel" },
      { id: "sherlock-fmri", name: "Sherlock" },
    ],
    dir: "naturalistic-isc",
    notebook: "isc_tutorial.ipynb",
    files: [
      { label: "Notebook", path: "isc_tutorial.ipynb", kind: "Notebook" },
      { label: "Setup requirements", path: "requirements.txt", kind: "Requirements" },
      { label: "ISC demo", path: "code/isc_demo.py", kind: "Python" },
      { label: "Partly Cloudy ISC", path: "code/isc_partly_cloudy.py", kind: "Python" },
      { label: "Naturalistic ISC variant", path: "code/isc_naturalistic.py", kind: "Python" },
    ],
  },
  {
    slug: "social-reward-aging",
    title: "Social Reward and Trust Across Adulthood",
    blurb:
      "Use a lifespan social-neuroscience question — do younger and older adults respond differently to friends, strangers, and computer partners? — to learn age-group comparisons, partner effects, and one first-level friend-versus-stranger fMRI GLM.",
    level: "Beginner",
    time: "~2–4 hours",
    tags: ["Aging", "Trust game", "Social reward", "fMRI GLM"],
    image: "/tutorials/social-reward-trust-aging.png",
    imageAlt:
      "Two-panel tutorial figure showing simulated trust-game behavior by partner type for younger and older adults, plus model estimates for partner and age-by-partner effects.",
    caption:
      "Runnable teaching demo: younger and older adults make trust-game decisions with computer, stranger, and friend partners. The real-data workflow applies the same structure to OpenNeuro ds005123, with an optional friend > stranger GLM.",
    learn: [
      "How to turn lifespan aging into a social-neuroscience question",
      "Quantifying partner effects in trust-game behavior: friend, stranger, and computer",
      "Testing age-group-by-partner interactions with a transparent linear model",
      "Mapping BIDS event files into social regressors for nilearn",
      "Running one first-level fMRI GLM for a friend > stranger contrast",
    ],
    steps: [
      {
        n: 1,
        title: "Build the behavioral model",
        body: "Run a no-download trust-game demo, plot age group by partner type, and estimate partner plus age-by-partner effects with numpy, pandas, and scipy.",
      },
      {
        n: 2,
        title: "Apply it to OpenNeuro ds005123",
        body: "Download the social reward events, infer partner labels, summarize younger and older adults' trust behavior, and reuse the same model on real task files.",
      },
      {
        n: 3,
        title: "Run one social GLM",
        body: "Use BIDS events as regressors in nilearn and compute a simple friend > stranger contrast for one trust-task run.",
      },
    ],
    datasets: [
      { id: "social-reward-decision-making", name: "Social Reward Across the Lifespan" },
      { id: "hcp-aging-aabc", name: "HCP-Aging / AABC" },
      { id: "cam-can", name: "Cam-CAN" },
    ],
    dir: "social-reward-aging",
    notebook: "social_reward_tutorial.ipynb",
    files: [
      { label: "Notebook", path: "social_reward_tutorial.ipynb", kind: "Notebook" },
      { label: "Setup requirements", path: "requirements.txt", kind: "Requirements" },
      { label: "Social reward and trust workflow", path: "code/social_reward_trust.py", kind: "Python" },
    ],
  },
];

export function getTutorial(slug: string) {
  return TUTORIALS.find((tutorial) => tutorial.slug === slug);
}
