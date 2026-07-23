export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Campus {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  mapRegion: MapRegion;
}
