import { Suspense, useMemo, memo, useRef, type FC } from 'react';
import styles from './Game3D.module.scss';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TextureLoader, SphereGeometry, MeshStandardMaterial, Mesh } from 'three';
import Texture_Planet from '@assets/texture.webp';
import Texture_Planet_2 from '@assets/texture-2.jpg';
import { PLANETS, type Planet, SIZE_PLANET } from '@/mock/planets';

const Game3D: FC = () => {
  return (
    <div className={styles.game3d}>
      <Canvas
        camera={{ position: [0, 50, 100] }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        shadows
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          panSpeed={1}
          zoomSpeed={1}
          maxDistance={300}
          rotateSpeed={0.5}
        />
        <directionalLight
          position={[0, 200, 200]}
          intensity={5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={500}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />

        <ambientLight intensity={0.3} />
        <Suspense fallback={null}>
          {/* <ModelGalaxy scale={[100, 100, 100]} /> */}
          <PlanetsGroup />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Game3D;

// Компонент для создания общих ресурсов (геометрии и материалы)
const PlanetsGroup = () => {
  // Загружаем обе текстуры
  const textures = useLoader(TextureLoader, [Texture_Planet, Texture_Planet_2]);

  // Создаем геометрии один раз для каждого размера
  // Уменьшаем количество сегментов для оптимизации (было 32x32, стало 16x16)
  const geometries = useMemo(() => {
    return {
      [SIZE_PLANET.SMALL]: new SphereGeometry(1, 16, 16),
      [SIZE_PLANET.MEDIUM]: new SphereGeometry(2, 20, 20),
      [SIZE_PLANET.LARGE]: new SphereGeometry(4, 24, 24),
    };
  }, []);

  // Создаем материалы для каждой планеты с детерминированным выбором текстуры
  const planetMaterials = useMemo(() => {
    return PLANETS.map((planet) => {
      // Детерминированный выбор текстуры на основе ID планеты
      const textureIndex = planet.id % textures.length;
      const selectedTexture = textures[textureIndex];
      return new MeshStandardMaterial({
        map: selectedTexture,
        color: planet.color,
        roughness: 0.9,
        metalness: 0.2,
      });
    });
  }, [textures]);

  return (
    <>
      {PLANETS.map((planet, index) => (
        <Planet
          key={planet.id}
          planetId={planet.id}
          geometry={geometries[planet.size]}
          material={planetMaterials[index]}
        />
      ))}
    </>
  );
};

const Planet = memo(
  ({
    planetId,
    geometry,
    material,
  }: {
    planetId: number;
    geometry: SphereGeometry;
    material: MeshStandardMaterial;
  }) => {
    const meshRef = useRef<Mesh>(null);

    // Начальная позиция на орбите (детерминированная на основе ID планеты)
    const orbitDataRef = useRef(
      (() => {
        // Используем ID планеты как seed для генерации детерминированных значений
        const seed = planetId * 0.1;
        const radius = Math.sin(seed) * 50 + 50 + 50; // Радиус орбиты от 50 до 150
        const angleX = (Math.cos(seed) * Math.PI * 2) % (Math.PI * 2);
        const angleY = (Math.sin(seed * 2) * Math.PI * 2) % (Math.PI * 2);
        const speed = (Math.sin(seed * 3) * 0.5 + 0.1) * (Math.cos(seed) > 0 ? 1 : -1);
        return { radius, angleX, angleY, speed };
      })()
    );

    // Анимация вращения вокруг центра
    useFrame((_, delta) => {
      if (meshRef.current) {
        const orbitData = orbitDataRef.current;
        orbitData.angleX += orbitData.speed * delta * 0.1;
        orbitData.angleY += orbitData.speed * delta * 0.1;

        // Вычисляем позицию на орбите
        meshRef.current.position.x = Math.cos(orbitData.angleX) * orbitData.radius;
        meshRef.current.position.y = Math.sin(orbitData.angleY) * orbitData.radius * 0.5;
        meshRef.current.position.z = Math.sin(orbitData.angleX) * orbitData.radius;
      }
    });

    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        frustumCulled
      />
    );
  }
);

Planet.displayName = 'Planet';
