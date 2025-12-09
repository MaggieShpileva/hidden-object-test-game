import { Suspense, useMemo, useRef, useEffect, type FC } from 'react';
import styles from './Game3D.module.scss';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  TextureLoader,
  SphereGeometry,
  MeshStandardMaterial,
  InstancedMesh,
  Color,
  Matrix4,
} from 'three';
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
  const geometries = useMemo(() => {
    return {
      [SIZE_PLANET.SMALL]: new SphereGeometry(1, 16, 16),
      [SIZE_PLANET.MEDIUM]: new SphereGeometry(2, 20, 20),
      [SIZE_PLANET.LARGE]: new SphereGeometry(4, 24, 24),
    };
  }, []);

  // Группируем планеты по размерам
  const planetsBySize = useMemo(() => {
    const grouped: Record<string, Planet[]> = {
      [SIZE_PLANET.SMALL]: [],
      [SIZE_PLANET.MEDIUM]: [],
      [SIZE_PLANET.LARGE]: [],
    };
    PLANETS.forEach((planet) => {
      grouped[planet.size].push(planet);
    });
    return grouped;
  }, []);

  // Создаем базовые материалы для каждого размера (с текстурами)
  const baseMaterials = useMemo(() => {
    return {
      [SIZE_PLANET.SMALL]: new MeshStandardMaterial({
        map: textures[0],
        roughness: 0.9,
        metalness: 0.2,
      }),
      [SIZE_PLANET.MEDIUM]: new MeshStandardMaterial({
        map: textures[1],
        roughness: 0.9,
        metalness: 0.2,
      }),
      [SIZE_PLANET.LARGE]: new MeshStandardMaterial({
        map: textures[0],
        roughness: 0.9,
        metalness: 0.2,
      }),
    };
  }, [textures]);

  return (
    <>
      {(Object.keys(SIZE_PLANET) as Array<keyof typeof SIZE_PLANET>).map((sizeKey) => {
        const size = SIZE_PLANET[sizeKey];
        const planets = planetsBySize[size];
        if (planets.length === 0) return null;

        return (
          <PlanetsInstancedMesh
            key={size}
            planets={planets}
            geometry={geometries[size]}
            material={baseMaterials[size]}
          />
        );
      })}
    </>
  );
};

// Компонент для InstancedMesh планет одного размера
const PlanetsInstancedMesh = ({
  planets,
  geometry,
  material,
}: {
  planets: Planet[];
  geometry: SphereGeometry;
  material: MeshStandardMaterial;
}) => {
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const matrix = useMemo(() => new Matrix4(), []);
  const tempColor = useMemo(() => new Color(), []);

  // Инициализация данных орбит для каждой планеты
  const orbitDataRef = useRef(
    planets.map((planet) => {
      const seed = planet.id;
      const radiusStep = 10;
      const minRadius = 40;
      const radiusIndex = seed % 20;
      const radius = minRadius + radiusIndex * radiusStep + (seed % 30);

      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angleX = (seed * goldenAngle) % (Math.PI * 2);
      const angleY = (seed * 0.7 + Math.PI / 4) % (Math.PI * 2);

      const speedBase = 0.1 + (seed % 10) * 0.05;
      const speed = speedBase * (seed % 2 === 0 ? 1 : -1);

      return { radius, angleX, angleY, speed, color: planet.color };
    })
  );

  // Инициализация матриц и цветов
  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const orbitData = orbitDataRef.current;
    orbitData.forEach((data, index) => {
      // Устанавливаем начальную позицию
      const x = Math.cos(data.angleX) * data.radius;
      const y = Math.sin(data.angleY) * data.radius * 0.3;
      const z = Math.sin(data.angleX) * data.radius;

      matrix.setPosition(x, y, z);
      instancedMeshRef.current!.setMatrixAt(index, matrix);

      // Устанавливаем цвет для каждого инстанса
      tempColor.set(data.color);
      instancedMeshRef.current!.setColorAt(index, tempColor);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [matrix, tempColor]);

  // Анимация вращения
  const fixedTimeStep = 1 / 60;
  const accumulatorRef = useRef(0);

  useFrame((_, delta) => {
    if (!instancedMeshRef.current) return;

    const orbitData = orbitDataRef.current;
    const clampedDelta = Math.min(delta, 0.1);
    accumulatorRef.current += clampedDelta;

    while (accumulatorRef.current >= fixedTimeStep) {
      orbitData.forEach((data) => {
        data.angleX += data.speed * fixedTimeStep * 0.1;
        data.angleY += data.speed * fixedTimeStep * 0.05;
      });
      accumulatorRef.current -= fixedTimeStep;
    }

    // Обновляем позиции всех инстансов
    orbitData.forEach((data, index) => {
      const x = Math.cos(data.angleX) * data.radius;
      const y = Math.sin(data.angleY) * data.radius * 0.3;
      const z = Math.sin(data.angleX) * data.radius;

      matrix.setPosition(x, y, z);
      instancedMeshRef.current!.setMatrixAt(index, matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, planets.length]}
      castShadow
      receiveShadow
      frustumCulled
    />
  );
};
