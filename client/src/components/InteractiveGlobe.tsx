"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Color, Vector3, Group } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Object3DNode, Canvas, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import countries from "@/data/globe.json";

// Extend ThreeGlobe for React Three Fiber
declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: Object3DNode<ThreeGlobe, typeof ThreeGlobe>;
  }
}

extend({ ThreeGlobe });

// City data with coordinates and timezones
interface City {
  name: string;
  timezone: string;
  lat: number;
  lng: number;
  country: string;
  color: string;
}

const cities: City[] = [
  // UK (Home)
  { name: "Aberdeen", timezone: "Europe/London", lat: 57.15, lng: -2.09, country: "UK", color: "#ffffff" },
  { name: "London", timezone: "Europe/London", lat: 51.51, lng: -0.13, country: "UK", color: "#3b82f6" },
  // Pakistan
  { name: "Karachi", timezone: "Asia/Karachi", lat: 24.86, lng: 67.01, country: "Pakistan", color: "#22c55e" },
  { name: "Islamabad", timezone: "Asia/Karachi", lat: 33.69, lng: 73.06, country: "Pakistan", color: "#22c55e" },
  // India
  { name: "Mumbai", timezone: "Asia/Kolkata", lat: 19.08, lng: 72.88, country: "India", color: "#f59e0b" },
  { name: "Delhi", timezone: "Asia/Kolkata", lat: 28.61, lng: 77.21, country: "India", color: "#f59e0b" },
  // USA
  { name: "New York", timezone: "America/New_York", lat: 40.71, lng: -74.01, country: "USA", color: "#ef4444" },
  { name: "San Francisco", timezone: "America/Los_Angeles", lat: 37.77, lng: -122.42, country: "USA", color: "#ef4444" },
  // UAE
  { name: "Dubai", timezone: "Asia/Dubai", lat: 25.2048, lng: 55.2708, country: "UAE", color: "#8b5cf6" },
  // Australia
  { name: "Sydney", timezone: "Australia/Sydney", lat: -33.87, lng: 151.21, country: "Australia", color: "#06b6d4" },
];

// Aberdeen (user's location)
const aberdeenCity = cities.find(c => c.name === "Aberdeen")!;

// Globe configuration
const GLOBE_CONFIG = {
  pointSize: 4,
  globeColor: "#1a1a2e",
  showAtmosphere: true,
  atmosphereColor: "#ffffff",
  atmosphereAltitude: 0.15,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 2000,
  arcLength: 0.9,
};

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new Vector3(x, y, z);
}

// Generate arc data between Aberdeen and selected city
function generateArcToAberdeen(city: City) {
  if (city.name === "Aberdeen") return null;

  return {
    startLat: city.lat,
    startLng: city.lng,
    endLat: aberdeenCity.lat,
    endLng: aberdeenCity.lng,
    arcAlt: 0.2 + Math.random() * 0.15,
    color: "#22d3ee",
  };
}

// City marker component
interface CityMarkerProps {
  city: City;
  radius: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (city: City | null) => void;
  onHover: (city: City | null) => void;
}

function CityMarker({ city, radius, isSelected, isHovered, onSelect, onHover }: CityMarkerProps) {
  const pos = latLngToVector3(city.lat, city.lng, radius * 1.02);
  const isAberdeen = city.name === "Aberdeen";

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* City dot */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : city);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(city);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[isAberdeen ? 3 : 2, 16, 16]} />
        <meshBasicMaterial
          color={isAberdeen ? "#ffffff" : isSelected ? "#22d3ee" : city.color}
          transparent
          opacity={isSelected || isHovered || isAberdeen ? 1 : 0.8}
        />
      </mesh>

      {/* Pulsing ring for Aberdeen */}
      {isAberdeen && (
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[4, 5, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* City label on hover/select */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, 8, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium shadow-lg backdrop-blur-sm ${
            isAberdeen
              ? "bg-white text-gray-900"
              : "bg-cyan-500 text-white"
          }`}>
            {city.name}
            {isAberdeen && <span className="ml-1 opacity-70">(You)</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// Globe component
interface GlobeProps {
  selectedCity: City | null;
  hoveredCity: City | null;
  onCitySelect: (city: City | null) => void;
  onCityHover: (city: City | null) => void;
}

function Globe({ selectedCity, hoveredCity, onCitySelect, onCityHover }: GlobeProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef<Group>(null);

  // Generate arc when city is selected
  const arcData = useMemo(() => {
    if (!selectedCity || selectedCity.name === "Aberdeen") return [];
    const arc = generateArcToAberdeen(selectedCity);
    return arc ? [arc] : [];
  }, [selectedCity]);

  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;

    // Build globe material
    const globeMaterial = globe.globeMaterial() as any;
    globeMaterial.color = new Color(GLOBE_CONFIG.globeColor);
    globeMaterial.emissive = new Color(GLOBE_CONFIG.emissive);
    globeMaterial.emissiveIntensity = GLOBE_CONFIG.emissiveIntensity;
    globeMaterial.shininess = GLOBE_CONFIG.shininess;

    // Setup polygons (countries)
    globe
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(GLOBE_CONFIG.showAtmosphere)
      .atmosphereColor(GLOBE_CONFIG.atmosphereColor)
      .atmosphereAltitude(GLOBE_CONFIG.atmosphereAltitude)
      .hexPolygonColor(() => GLOBE_CONFIG.polygonColor);
  }, []);

  // Update arcs when selection changes
  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;

    // Setup arcs
    globe
      .arcsData(arcData)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor(() => "#22d3ee")
      .arcAltitude((d: any) => d.arcAlt)
      .arcStroke(() => 0.8)
      .arcDashLength(GLOBE_CONFIG.arcLength)
      .arcDashGap(15)
      .arcDashAnimateTime(() => GLOBE_CONFIG.arcTime);
  }, [arcData]);

  // Slow rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  // Globe radius (three-globe uses 100 as default radius)
  const radius = 100;

  return (
    <group ref={groupRef}>
      <threeGlobe ref={globeRef} />

      {/* City markers */}
      {cities.map((city) => (
        <CityMarker
          key={city.name}
          city={city}
          radius={radius}
          isSelected={selectedCity?.name === city.name}
          isHovered={hoveredCity?.name === city.name}
          onSelect={onCitySelect}
          onHover={onCityHover}
        />
      ))}
    </group>
  );
}

// WebGL Renderer config
function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x000000, 0);
  }, [gl, size]);

  return null;
}

// Time display component
function TimeDisplay({ city }: { city: City }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: city.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
      setTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [city.timezone]);

  return (
    <div className="absolute top-4 right-4 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-gray-200/50 dark:border-neutral-700/50 rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-400">
            {city.country}
          </span>
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
          {city.name}
        </div>
        <div className="text-lg font-mono font-light text-cyan-500">
          {time}
        </div>
      </div>
    </div>
  );
}

// Main Interactive Globe component
export default function InteractiveGlobe() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCitySelect = useCallback((city: City | null) => {
    setSelectedCity(city);
  }, []);

  const handleCityHover = useCallback((city: City | null) => {
    setHoveredCity(city);
  }, []);

  if (!mounted) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 dark:border-neutral-700 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 300], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <WebGLRendererConfig />
        <ambientLight color={GLOBE_CONFIG.ambientLight} intensity={0.6} />
        <directionalLight
          color={GLOBE_CONFIG.directionalLeftLight}
          position={[-400, 100, 400]}
        />
        <directionalLight
          color={GLOBE_CONFIG.directionalTopLight}
          position={[-200, 500, 200]}
        />
        <pointLight
          color={GLOBE_CONFIG.pointLight}
          position={[-200, 500, 200]}
          intensity={0.8}
        />
        <Globe
          selectedCity={selectedCity}
          hoveredCity={hoveredCity}
          onCitySelect={handleCitySelect}
          onCityHover={handleCityHover}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minDistance={300}
          maxDistance={300}
          autoRotateSpeed={0.5}
          autoRotate={true}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI - Math.PI / 3}
        />
      </Canvas>

      {/* Time display when city selected */}
      {selectedCity && <TimeDisplay city={selectedCity} />}
    </div>
  );
}
