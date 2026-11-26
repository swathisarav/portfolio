/**
 * Content for the clickable objects in the 3D diorama (and the mobile cards).
 * PLACEHOLDER TEXT: replace titles, descriptions, tags and links with your own.
 * The `id` must match the object in DioramaScene.tsx; don't change ids.
 */

export type DioramaId = 'mountains' | 'van' | 'arch' | 'panel' | 'columns' | 'stones';

export interface DioramaItem {
  id: DioramaId;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  /** Swatch colour used on the mobile cards. */
  color: string;
  links?: { label: string; url: string }[];
}

export const DIORAMA_ITEMS: DioramaItem[] = [
  {
    id: 'mountains',
    title: 'Mountains',
    subtitle: 'Adventure & the outdoors',
    description:
      'Placeholder: what the mountains mean to you. Hikes, ski trips, the trails you keep going back to, and what being outside teaches you about planning, risk and patience.',
    tags: ['Hiking', 'Skiing'],
    color: '#C9C3BC',
  },
  {
    id: 'van',
    title: 'The Camper',
    subtitle: 'Road trips & travel',
    description:
      'Placeholder: places you have been, the trips that changed how you think, and where you want to go next.',
    tags: ['Travel'],
    color: '#E5E1DD',
  },
  {
    id: 'arch',
    title: 'The Archway',
    subtitle: 'Art & making',
    description:
      'Placeholder: the things you make with your hands. Sketches, crafts, models, and the side projects that are just for fun.',
    tags: ['Art', 'Making'],
    color: '#A58D66',
  },
  {
    id: 'panel',
    title: 'The Board',
    subtitle: 'Ideas & musings',
    description:
      'Placeholder: ideas you are chewing on, essays or notes you have written, and questions you have not answered yet.',
    tags: ['Writing', 'Ideas'],
    color: '#F4F2EF',
  },
  {
    id: 'columns',
    title: 'The Towers',
    subtitle: 'Business & strategy',
    description:
      'Placeholder: the markets and companies you study, the case work you have done, and what you are learning about how products win.',
    tags: ['Strategy', 'Markets'],
    color: '#407E8C',
  },
  {
    id: 'stones',
    title: 'Floating Stones',
    subtitle: 'Curiosities',
    description:
      'Placeholder: small rabbit holes. Books, podcasts, music, and odd questions that caught your attention.',
    tags: ['Books', 'Music'],
    color: '#C0D5D6',
  },
];
