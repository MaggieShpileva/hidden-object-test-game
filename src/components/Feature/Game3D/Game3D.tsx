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
          maxDistance={500}
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
    // Используем более равномерное распределение для предотвращения наложений
    const orbitDataRef = useRef(
      (() => {
        // Используем ID планеты как seed для генерации детерминированных значений
        const seed = planetId;

        // Равномерное распределение радиуса по слоям для предотвращения наложений
        const radiusStep = 10; // Шаг между орбитами
        const minRadius = 40; // Минимальный радиус
        const radiusIndex = seed % 20; // Используем остаток для распределения по слоям
        const radius = minRadius + radiusIndex * radiusStep + (seed % 30); // Добавляем небольшую вариацию

        // Используем золотой угол для равномерного распределения по углам
        // Золотой угол обеспечивает оптимальное распределение точек на сфере
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.399963229728653 радиан
        const angleX = (seed * goldenAngle) % (Math.PI * 2);
        const angleY = (seed * 0.7 + Math.PI / 4) % (Math.PI * 2);

        // Скорость вращения с большим разнообразием
        const speedBase = 0.1 + (seed % 10) * 0.05; // От 0.1 до 0.55
        const speed = speedBase * (seed % 2 === 0 ? 1 : -1); // Чередуем направление

        return { radius, angleX, angleY, speed };
      })()
    );

    // Анимация вращения вокруг центра с фиксированным timestep для независимости от FPS
    const fixedTimeStep = 1 / 60; // Фиксированный шаг времени (60 FPS)
    const accumulatorRef = useRef(0);

    useFrame((_, delta) => {
      if (meshRef.current) {
        const orbitData = orbitDataRef.current;

        // Ограничиваем delta для предотвращения больших скачков при lag spikes
        const clampedDelta = Math.min(delta, 0.1); // Максимум 100ms
        accumulatorRef.current += clampedDelta;

        // Обновляем физику с фиксированным шагом времени для стабильности
        while (accumulatorRef.current >= fixedTimeStep) {
          orbitData.angleX += orbitData.speed * fixedTimeStep * 0.1;
          orbitData.angleY += orbitData.speed * fixedTimeStep * 0.05; // Медленнее по Y для эллиптической орбиты
          accumulatorRef.current -= fixedTimeStep;
        }

        // Вычисляем позицию на орбите вокруг центра (0, 0, 0)
        // Используем сферические координаты для круговой орбиты в 3D пространстве
        meshRef.current.position.x = Math.cos(orbitData.angleX) * orbitData.radius;
        meshRef.current.position.y = Math.sin(orbitData.angleY) * orbitData.radius * 0.3; // Вертикальная амплитуда
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
