//scene width: 1200px, height: 540px;
import PNG_image1 from '@assets/objects/image-1.png';
import PNG_image2 from '@assets/objects/image-2.png';
import PNG_image3 from '@assets/objects/image-3.png';
import PNG_image4 from '@assets/objects/image-4.png';
import PNG_image5 from '@assets/objects/image-5.png';
import PNG_image6 from '@assets/objects/image-6.png';
import PNG_image7 from '@assets/objects/image-7.png';
import PNG_image8 from '@assets/objects/image-8.png';
import PNG_image9 from '@assets/objects/image-9.png';

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
    name: 'a pan with eggs',
    image: PNG_image1,
    position: {
      x: 890,
      y: 185,
    },
    size: {
      width: 15,
      height: 30,
    },
  },
  {
    id: 2,
    name: 'wooden spoons',
    image: PNG_image2,
    position: {
      x: 250,
      y: 255,
    },
    size: {
      width: 50,
      height: 70,
    },
  },
  {
    id: 3,
    name: 'pie',
    image: PNG_image3,
    position: {
      x: 720,
      y: 232,
    },
    size: {
      width: 40,
      height: 20,
    },
  },
  {
    id: 4,
    name: 'orange',
    image: PNG_image4,
    position: {
      x: 1140,
      y: 330,
    },
    size: {
      width: 30,
      height: 30,
    },
  },
  {
    id: 5,
    name: 'eggs',
    image: PNG_image5,
    position: {
      x: 930,
      y: 237,
    },
    size: {
      width: 30,
      height: 15,
    },
  },
  {
    id: 6,
    name: 'gateleg table',
    image: PNG_image6,
    position: {
      x: 450,
      y: 293,
    },
    size: {
      width: 60,
      height: 55,
    },
  },
  {
    id: 7,
    name: 'flower vase',
    image: PNG_image7,
    position: {
      x: 530,
      y: 223,
    },
    size: {
      width: 45,
      height: 70,
    },
  },
  {
    id: 8,
    name: 'lamp ',
    image: PNG_image8,
    position: {
      x: 170,
      y: 228,
    },
    size: {
      width: 30,
      height: 70,
    },
  },
  {
    id: 9,
    name: 'flowers in vase',
    image: PNG_image9,
    position: {
      x: 700,
      y: 260,
    },
    size: {
      width: 40,
      height: 100,
    },
  },
];
