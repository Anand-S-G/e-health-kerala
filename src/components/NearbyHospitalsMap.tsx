'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const libraries: "places"[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem'
};

const defaultCenter = {
  lat: 10.8505, // Kerala center latitude
  lng: 76.2711  // Kerala center longitude
};

export default function NearbyHospitalsMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [hospitals, setHospitals] = useState<google.maps.places.PlaceResult[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<google.maps.places.PlaceResult | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const findNearbyHospitals = useCallback((location: google.maps.LatLngLiteral, mapInstance: google.maps.Map) => {
    if (!window.google) return;
    
    const service = new window.google.maps.places.PlacesService(mapInstance);
    const request = {
      location,
      radius: 5000, // 5km radius
      type: 'hospital'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setHospitals(results);
      }
    });
  }, []);

  const getUserLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(newPos);
        setIsLocating(false);
        if (map) {
          findNearbyHospitals(newPos, map);
        }
      },
      () => {
        setLocationError('Unable to retrieve your location. Please check browser permissions.');
        setIsLocating(false);
      }
    );
  };

  // Initially try to get location when map loads
  useEffect(() => {
    if (isLoaded && map) {
      // Just use the default center initially to fetch hospitals there if geolocation fails
      findNearbyHospitals(center, map);
    }
  }, [isLoaded, map]);

  if (loadError) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3">
        <MapPin className="w-5 h-5" />
        <p>Error loading Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-center items-center h-[450px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-500" />
            Nearby Hospitals
          </h2>
          <p className="text-slate-500 text-sm mt-1">Find healthcare facilities around you</p>
        </div>
        
        <button 
          onClick={getUserLocation}
          disabled={isLocating}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          Find Near Me
        </button>
      </div>

      {locationError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {locationError}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-slate-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          {/* User Location Marker */}
          <Marker 
            position={center} 
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
            }}
          />

          {/* Hospital Markers */}
          {hospitals.map((hospital) => (
            <Marker
              key={hospital.place_id}
              position={hospital.geometry?.location as google.maps.LatLng}
              onClick={() => setSelectedHospital(hospital)}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }}
            />
          ))}

          {/* Info Window for Selected Hospital */}
          {selectedHospital && selectedHospital.geometry?.location && (
            <InfoWindow
              position={selectedHospital.geometry.location}
              onCloseClick={() => setSelectedHospital(null)}
            >
              <div className="p-2 max-w-[200px]">
                <h3 className="font-semibold text-slate-900 mb-1">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-600 mb-2">{selectedHospital.vicinity}</p>
                {selectedHospital.rating && (
                  <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                    ⭐ {selectedHospital.rating} ({selectedHospital.user_ratings_total} reviews)
                  </div>
                )}
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.geometry.location.lat()},${selectedHospital.geometry.location.lng()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center bg-blue-600 text-white text-xs py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
