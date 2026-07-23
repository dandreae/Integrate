export interface Entrance {
  id: string;
  placeId: string;
  latitude: number;
  longitude: number;
  label: string;
  isAccessible: boolean;
  notes?: string;
}
