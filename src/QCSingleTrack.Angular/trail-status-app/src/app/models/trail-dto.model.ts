export interface TrailPhotoDto {
  photoUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
}

export type TrailStatus = 'Open' | 'Closed' | 'Caution' | 'Freeze/Thaw';

export interface TrailDto {
  trailId: number;
  trailName: string;
  description: string | null;
  shortDescription: string | null;
  latitude: number;
  longitude: number;
  /** Null for trails FORC doesn't report on; those are treated as always open. */
  currentStatus?: TrailStatus | null;
  currentSource: string | null;
  currentReason: string | null;
  /** UTC time the status last changed (the scraper only writes it on a change). */
  lastScrapedTime: string | null;
  photos?: TrailPhotoDto[];
}
