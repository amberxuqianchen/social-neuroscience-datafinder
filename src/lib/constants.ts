import type { Modality, Topic } from "./types";

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

/** The ten dataset categories from the project brief, used for the home grid. */
export const CATEGORIES: { modality: Modality; label: string; blurb: string }[] = [
  { modality: "fMRI", label: "fMRI", blurb: "Functional MRI of the social brain" },
  { modality: "EEG", label: "EEG", blurb: "Electroencephalography time series" },
  { modality: "MEG", label: "MEG", blurb: "Magnetoencephalography recordings" },
  { modality: "iEEG", label: "iEEG", blurb: "Intracranial / depth electrodes" },
  { modality: "fNIRS", label: "fNIRS", blurb: "Optical hemodynamic imaging" },
  { modality: "Behavioral", label: "Behavioral", blurb: "Tasks, surveys, ratings" },
  { modality: "Social Network", label: "Social Networks", blurb: "Relational & graph data" },
  { modality: "Multimodal", label: "Multimodal", blurb: "Combined acquisition methods" },
  { modality: "Developmental", label: "Developmental", blurb: "Children & adolescents" },
  { modality: "Naturalistic", label: "Naturalistic", blurb: "Movies, narratives, real life" },
];

/** All modalities exposed as filters in the directory. */
export const MODALITIES: Modality[] = [
  "fMRI",
  "EEG",
  "MEG",
  "iEEG",
  "fNIRS",
  "Behavioral",
  "Social Network",
  "Multimodal",
  "Developmental",
  "Naturalistic",
  "Electrophysiology",
  "Calcium Imaging",
  "Connectomics",
  "Structural MRI",
  "Diffusion MRI",
  "Genetics",
  "Eye Tracking",
];

/** All topics exposed as filters in the directory. */
export const TOPICS: Topic[] = [
  "social cognition",
  "friendship",
  "social networks",
  "moral judgment",
  "cooperation",
  "competition",
  "empathy",
  "theory of mind",
  "impression formation",
  "social learning",
  "group behavior",
  "identity",
  "culture",
  "decision making",
  "communication",
  "collective behavior",
  "emotion",
  "face perception",
  "social interaction",
  "naturalistic viewing",
  "memory",
  "development",
  "aging",
  "mental health",
];

/** Sample-size buckets used by the directory's range filter. */
export const SAMPLE_SIZE_BUCKETS = [
  { id: "any", label: "Any size", min: 0, max: Infinity },
  { id: "lt50", label: "< 50", min: 0, max: 49 },
  { id: "50-200", label: "50 – 200", min: 50, max: 200 },
  { id: "200-1000", label: "200 – 1,000", min: 200, max: 1000 },
  { id: "gt1000", label: "> 1,000", min: 1001, max: Infinity },
] as const;
