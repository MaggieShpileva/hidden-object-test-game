import PNG_image1 from '@assets/objects/image-1.png';
import PNG_image2 from '@assets/objects/image-2.png';
import PNG_image3 from '@assets/objects/image-3.png';
import PNG_image4 from '@assets/objects/image-4.png';
import PNG_image5 from '@assets/objects/image-5.png';
import PNG_image6 from '@assets/objects/image-6.png';
import PNG_image7 from '@assets/objects/image-7.png';
import PNG_image8 from '@assets/objects/image-8.png';
import PNG_image9 from '@assets/objects/image-9.png';
import PNG_image10 from '@assets/objects/image-10.png';

export type Object = {
  id: number;
  name: string;
  image: string;
  half: 'top' | 'bottom';
  width: number;
};

export const OBJECTS: Object[] = [
  {
    id: 1,
    name: 'Кот',
    image: PNG_image1,
    half: 'bottom',
    width: 10,
  },
  {
    id: 2,
    name: 'Звезда',
    image: PNG_image2,
    half: 'top',
    width: 4,
  },
  {
    id: 3,
    name: 'Печенье',
    image: PNG_image3,
    half: 'bottom',
    width: 6,
  },
  {
    id: 4,
    name: 'Дерево',
    image: PNG_image4,
    half: 'bottom',
    width: 7,
  },
  {
    id: 5,
    name: 'Роберт Паттинсон',
    image: PNG_image5,
    half: 'top',
    width: 6,
  },
  {
    id: 6,
    name: 'Птичка',
    image: PNG_image6,
    half: 'bottom',
    width: 5,
  },
  {
    id: 7,
    name: 'Телефон',
    image: PNG_image7,
    half: 'bottom',
    width: 5,
  },
  {
    id: 8,
    name: 'Кристалл',
    image: PNG_image8,
    half: 'bottom',
    width: 5,
  },
  {
    id: 9,
    name: 'Попугай',
    image: PNG_image9,
    half: 'top',
    width: 8,
  },
  {
    id: 10,
    name: 'Гриб',
    image: PNG_image10,
    half: 'bottom',
    width: 7,
  },
];

export const getRandomObject = (): Object => {
  const randomIndex = Math.floor(Math.random() * OBJECTS.length);
  return OBJECTS[randomIndex];
};

export const getRandomObjectExcluding = (excludedIds: number[]): Object | null => {
  const availableObjects = OBJECTS.filter((obj) => !excludedIds.includes(obj.id));
  if (availableObjects.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * availableObjects.length);
  return availableObjects[randomIndex];
};
