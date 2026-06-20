/**
 * Core data model for the Social Neuroscience Dataset Directory.
 *
 * Every dataset in the catalog is a plain JSON file in `data/datasets/`
 * that conforms to the `Dataset` interface below. Keeping the shape in one
 * place means the loader, the search UI, and any future API all agree on the
 * schema. See `data/schema.json` for the machine-readable JSON Schema used to
 * validate community contributions in CI.
 */

/** Acquisition / data categories supported by the directory. */
export type Modality =
  | "fMRI"
  | "EEG"
  | "MEG"
  | "iEEG"
  | "fNIRS"
  | "Behavioral"
  | "Social Network"
  | "Multimodal"
  | "Developmental"
  | "Naturalistic"
  | "Electrophysiology"
  | "Calcium Imaging"
  | "Connectomics"
  | "Genetics"
  | "Eye Tracking"
  | "Structural MRI"
  | "Diffusion MRI";

/** Social-neuroscience research topics a dataset can be tagged with. */
export type Topic =
  | "social cognition"
  | "friendship"
  | "social networks"
  | "moral judgment"
  | "cooperation"
  | "competition"
  | "empathy"
  | "theory of mind"
  | "impression formation"
  | "social learning"
  | "group behavior"
  | "identity"
  | "culture"
  | "decision making"
  | "communication"
  | "collective behavior"
  | "emotion"
  | "face perception"
  | "social interaction"
  | "naturalistic viewing"
  | "memory"
  | "development"
  | "aging"
  | "mental health";

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
