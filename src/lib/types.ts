export type PricingLineItem = {
  label: string;
  quantity: number;
  rate: number;
  taxable?: boolean;
};

export type PricingOption = {
  id: string;
  name: string;
  tagline?: string;
  recommended?: boolean;
  line_items: PricingLineItem[];
  includes?: string[];
  excludes?: string[];
  best_for?: string;
};

export type PricingOptionsBlock = {
  type: "pricing_options";
  currency: string;
  tax_rate: number;
  options: PricingOption[];
};

export type PricingBlock = {
  type: "pricing";
  currency: string;
  tax_rate: number;
  line_items: PricingLineItem[];
};

export type SignatureBlock = {
  type: "signature";
  required: boolean;
  select_pricing_option: boolean;
  signers: { role: string; name_placeholder: string }[];
};

export type MarkdownBlock = {
  type: "markdown";
  content: string;
};

export type ParsedBlock =
  | PricingBlock
  | PricingOptionsBlock
  | SignatureBlock
  | MarkdownBlock;

export type ProposalFrontmatter = {
  slug: string;
  title: string;
  client: { name: string; contact: string; email: string };
  author: { name: string; company: string; email: string };
  team?: { name: string; role: string }[];
  currency: string;
  expires_at: string;
};

export type ParsedProposal = {
  frontmatter: ProposalFrontmatter;
  blocks: ParsedBlock[];
  rawMarkdown: string;
  markdownHash: string;
};

export type SignatureData = {
  id: string;
  typedName: string;
  signaturePng: string;
  signatureSvg: string;
  selectedOptionId: string | null;
  selectedOptionSnapshot: PricingOption | null;
  selectedOptionTotal: number | null;
  signedAt: string;
  ip: string;
  userAgent: string;
  auditHash: string;
  auditPayload: string;
};
