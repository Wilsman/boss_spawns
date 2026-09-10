import "leaflet";

declare module "leaflet" {
  interface MapOptions {
    gestureHandling?: boolean;
  }
}
