export interface TrailPhotoDto {
  photoUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
}

export interface TrailDto {
  trailId: number;
  trailName: string;
  description: string | null;
  shortDescription: string | null;
  latitude: number;
  longitude: number;
  currentStatus: 'Open' | 'Closed' | 'Caution';
  currentSource: string;
  currentReason: string | null;
  lastScrapedTime: string;
  photos?: TrailPhotoDto[];
  // These might not be in your current API - we can add them later
  rain24h?: number;
  currentTemp?: number;
}
