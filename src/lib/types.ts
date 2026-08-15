/**
 * Core data model for the Social Neuroscience Dataset Directory.
 *
 * Every dataset in the catalog is a plain JSON file in `data/datasets/`
 * that conforms to the `Dataset` interface below. Keeping the shape in one
 * place means the loader, the search UI, and any future API all agree on the
 * schema. See `data/schema.json` for the machine-readable JSON Schema used to
 * validate community contributions in CI.
 */

/**
 * How the data were measured. Measurement method only — the stimulus design
 * lives in `Paradigm` and the study population in `Topic`, so a movie-watching
 * fMRI study is `modality: ["fMRI"]` + `paradigm: ["Naturalistic"]`.
 */
export type Modality =
  | "Neuroimaging (general)"
  | "fMRI"
  | "MRI"
  | "EEG"
  | "MEG"
  | "iEEG"
  | "fNIRS"
  | "Psychophysiology"
  | "Electrophysiology"
  | "Calcium Imaging"
  | "Connectomics"
  | "Genotyping/Hormone/Neurotransmitter"
  | "Eye Tracking"
  | "Structural MRI"
  | "Diffusion MRI"
  | "Behavioral"
  | "Social Network";

/** Stimulus / task design used to acquire the data. Orthogonal to `Modality`. */
export type Paradigm =
  | "Naturalistic"
  | "Task-based"
  | "Resting-state"
  | "Hyperscanning";

/** Social-neuroscience research topics a dataset can be tagged with. */
export type Topic =
  | "Social Cognition"
  | "Close Relationship"
  | "Social Networks"
  | "Moral Judgment"
  | "Intergroup Processes"
  | "Competition"
  | "Empathy"
  | "Theory of Mind"
  | "Impression Formation"
  | "Self and Identity"
  | "Culture"
  | "Decision Making"
  | "Communication"
  | "Emotion"
  | "Social Perception"
  | "Social Interaction"
  | "Memory"
  | "Developmental Psychology"
  | "Clinical Psychology"
  | "Cognition"
  | "Learning"
  | "Public Health"
  | "Reward"
  | "Prosocial Behavior";

/** How a researcher can obtain the data. */
export type AccessType = "open" | "registered" | "restricted";

/** A linked publication associated with a dataset. */
export interface Publication {
  title: string;
  url: string;
  year?: number;
}

/**
 * A single dataset entry. The starter fields from the project brief
 * (name, description, modality, topics, sampleSize, species, longitudinal,
 * openAccess, url, citation, year) are all required; the remaining fields are
 * optional enrichments that the UI uses when present.
 */
export interface Dataset {
  /** URL-safe unique identifier, e.g. "human-connectome-project". */
  id: string;
  name: string;
  /** Optional short label used in dense UI (e.g. "HCP", "ABCD"). */
  shortName?: string;
  description: string;
  modality: Modality[];
  topics: Topic[];
  /** Stimulus / task design, e.g. ["Naturalistic"]. Absent when unclassified. */
  paradigm?: Paradigm[];
  sampleSize: number;
  /** Free-text species, e.g. "Human", "Mouse". */
  species: string;
  longitudinal: boolean;
  openAccess: boolean;
  /** Finer-grained access model; defaults to derive from openAccess. */
  accessType?: AccessType;
  /** Whether the dataset includes explicit social-network / relational data. */
  socialNetworkData?: boolean;
  /** Primary landing page for the dataset. */
  url: string;
  /** Direct download / repository location, if different from `url`. */
  downloadUrl?: string;
  /** Hosting repository, e.g. "OpenNeuro", "DANDI". */
  repository?: string;
  citation: string;
  doi?: string;
  year: number;
  publications?: Publication[];
  /** Free-form keyword tags for keyword search. */
  tags?: string[];
  /** Marks an entry for the homepage "Featured" rail. */
  featured?: boolean;
}

/** Aggregate statistics computed from the catalog for the homepage. */
export interface CatalogStats {
  total: number;
  openAccess: number;
  longitudinal: number;
  modalities: number;
  topics: number;
  totalParticipants: number;
  species: number;
}
