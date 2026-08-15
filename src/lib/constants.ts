import type { Modality, Paradigm, Topic } from "./types";

/** Site-wide metadata. */
export const SITE = {
  name: "Social Neuroscience DataFinder",
  shortName: "DataFinder",
  description:
    "The most comprehensive, searchable, community-driven directory of datasets relevant to social neuroscience.",
  // Update this to your deployed URL (used for metadata / Open Graph).
  url: "https://social-neuroscience-datafinder.vercel.app",
  repo: "https://github.com/amberxuqianchen/social-neuroscience-datafinder",
};

/**
 * The dataset categories used for the home grid. `Naturalistic` is a paradigm
 * rather than a modality, so it is keyed off `paradigm` instead — see
 * `PARADIGMS` below.
 */
export const CATEGORIES: { modality: Modality; label: string; blurb: string }[] = [
  { modality: "fMRI", label: "fMRI", blurb: "Functional MRI of the social brain" },
  { modality: "EEG", label: "EEG", blurb: "Electroencephalography time series" },
  { modality: "MEG", label: "MEG", blurb: "Magnetoencephalography recordings" },
  { modality: "iEEG", label: "iEEG", blurb: "Intracranial / depth electrodes" },
  { modality: "fNIRS", label: "fNIRS", blurb: "Optical hemodynamic imaging" },
  { modality: "Behavioral", label: "Behavioral", blurb: "Tasks, surveys, ratings" },
  { modality: "Social Network", label: "Social Networks", blurb: "Relational & graph data" },
  { modality: "Structural MRI", label: "Structural MRI", blurb: "Anatomy & morphometry" },
  { modality: "Diffusion MRI", label: "Diffusion MRI", blurb: "White-matter tractography" },
  { modality: "Eye Tracking", label: "Eye Tracking", blurb: "Gaze & pupillometry" },
];

/** All modalities exposed as filters in the directory. */
export const MODALITIES: Modality[] = [
  "Neuroimaging (general)",
  "fMRI",
  "MRI",
  "EEG",
  "MEG",
  "iEEG",
  "fNIRS",
  "Psychophysiology",
  "Electrophysiology",
  "Calcium Imaging",
  "Connectomics",
  "Genotyping/Hormone/Neurotransmitter",
  "Eye Tracking",
  "Structural MRI",
  "Diffusion MRI",
  "Behavioral",
  "Social Network",
];

/** All paradigms exposed as filters in the directory. */
export const PARADIGMS: Paradigm[] = [
  "Naturalistic",
  "Task-based",
  "Resting-state",
  "Hyperscanning",
];

/** All topics exposed as filters in the directory. */
export const TOPICS: Topic[] = [
  "Social Cognition",
  "Close Relationship",
  "Social Networks",
  "Moral Judgment",
  "Intergroup Processes",
  "Competition",
  "Empathy",
  "Theory of Mind",
  "Impression Formation",
  "Self and Identity",
  "Culture",
  "Decision Making",
  "Communication",
  "Emotion",
  "Social Perception",
  "Social Interaction",
  "Memory",
  "Developmental Psychology",
  "Clinical Psychology",
  "Cognition",
  "Learning",
  "Public Health",
  "Reward",
  "Prosocial Behavior",
];

/** Sample-size buckets used by the directory's range filter. */
export const SAMPLE_SIZE_BUCKETS = [
  { id: "any", label: "Any size", min: 0, max: Infinity },
  { id: "lt50", label: "< 50", min: 0, max: 49 },
  { id: "50-200", label: "50 – 200", min: 50, max: 200 },
  { id: "200-1000", label: "200 – 1,000", min: 200, max: 1000 },
  { id: "gt1000", label: "> 1,000", min: 1001, max: Infinity },
] as const;
