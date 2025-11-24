//scene width: 1200px, height: 540px;
import PNG_image1 from '@assets/objects/girl.png';
import PNG_image2 from '@assets/objects/wood_log.png';
import PNG_image3 from '@assets/objects/box.png';
import PNG_image4 from '@assets/objects/castle.png';
import PNG_image5 from '@assets/objects/pot.png';

export type Object = {
  id: number;
  name: string;
  image: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
};

export const OBJECTS: Object[] = [
  {
    id: 1,
    name: 'girl',
    image: PNG_image1,
    position: {
      x: 210,
      y: 250,
    },
    size: {
      width: 80,
      height: 80,
    },
  },
  {
    id: 2,
    name: 'wood_log',
    image: PNG_image2,
    position: {
      x: 300,
      y: 380,
    },
    size: {
      width: 120,
      height: 50,
    },
  },
  {
    id: 3,
    name: 'box',
    image: PNG_image3,
    position: {
      x: 680,
      y: 370,
    },
    size: {
      width: 70,
      height: 40,
    },
  },
  {
    id: 4,
    name: 'castle',
    image: PNG_image4,
    position: {
      x: 980,
      y: 100,
    },
    size: {
      width: 70,
      height: 40,
    },
  },
  {
    id: 5,
    name: 'pot',
    image: PNG_image5,
    position: {
      x: 1120,
      y: 420,
    },
    size: {
      width: 35,
      height: 50,
    },
  },
];
