import { communication } from './communication';
import { gettingStarted } from './getting-started';
import { people } from './people';
import type { DocPage, DocSection } from './types';
import { workspace } from './workspace';

/** All documentation, in reading order. */
export const docSections: DocSection[] = [gettingStarted, communication, people, workspace];

export const flatDocPages: DocPage[] = docSections.flatMap((section) => section.pages);

/** Finds a guide by its slug, e.g. "recruitment". */
export function findDocPage(slug: string): DocPage | undefined {
  return flatDocPages.find((page) => page.slug === slug);
}
