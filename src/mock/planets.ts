export const SIZE_PLANET = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type SizePlanet = (typeof SIZE_PLANET)[keyof typeof SIZE_PLANET];

export type Planet = {
  id: number;
  name: string;
  color: string;
  size: SizePlanet;
};

export const PLANETS: Planet[] = [
  {
    id: 1,
    name: 'Earth',
    color: '#010183',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 2,
    name: 'Mars',
    color: '#c81134',
    size: SIZE_PLANET.SMALL,
  },
  {
    id: 3,
    name: 'Jupiter',
    color: 'yellow',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 4,
    name: 'Saturn',
    color: 'gray',
    size: SIZE_PLANET.SMALL,
  },
  {
    id: 5,
    name: 'Uranus',
    color: 'lightblue',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 6,
    name: 'Neptune',
    color: 'darkblue',
    size: SIZE_PLANET.LARGE,
  },
  {
    id: 7,
    name: 'Pluto',
    color: 'brown',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 8,
    name: 'Eris',
    color: '#585858',
    size: SIZE_PLANET.SMALL,
  },
  {
    id: 9,
    name: 'Haumea',
    color: '#9bbedd',
    size: SIZE_PLANET.LARGE,
  },
  {
    id: 10,
    name: 'Makemake',
    color: '#9bbedd',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 11,
    name: 'Ceres',
    color: '#9bbedd',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 12,
    name: 'Haumea',
    color: '#9bbedd',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 13,
    name: 'Haumea',
    color: '#9bbedd',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 14,
    name: 'Haumea',
    color: '#9b54dd',
    size: SIZE_PLANET.MEDIUM,
  },
  {
    id: 15,
    name: 'Haumea',
    color: '#923edd',
    size: SIZE_PLANET.MEDIUM,
  },
  // Генерируем еще 100 планет с разными цветами
  ...Array.from({ length: 100 }, (_, i) => {
    const id = i + 16;
    // Генерируем случайный цвет в HEX формате
    const r = Math.floor(Math.random() * 200) + 20; // 20-220 для избежания слишком темных/светлых
    const g = Math.floor(Math.random() * 200) + 20;
    const b = Math.floor(Math.random() * 200) + 20;
    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    // Случайный размер
    const sizes = [SIZE_PLANET.SMALL, SIZE_PLANET.MEDIUM, SIZE_PLANET.LARGE];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    return {
      id,
      name: `Planet-${id}`,
      color,
      size,
    };
  }),
];
