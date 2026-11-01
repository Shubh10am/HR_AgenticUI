export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  /** On-page headline. */
  title: string;
  /** <title> tag: keyword-first, ideally under 60 characters. */
  seoTitle: string;
  /** Meta description and card summary: 140–160 characters. */
  description: string;
  author: string;
  authorRole: string;
  /** Display date, e.g. "June 28, 2025". */
  date: string;
  /** ISO dates for structured data and the sitemap. */
  datePublished: string;
  dateModified: string;
  category: string;
  keywords: string[];
  image: string;
  imageAlt: string;
  dataAiHint: string;
  /** Article HTML. Use <h2 id="..."> for sections: they build the table of contents. */
  content: string;
  faqs: BlogFaq[];
}
