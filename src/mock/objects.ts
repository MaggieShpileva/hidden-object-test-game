//scene width: 1200px, height: 540px;
import WEBP_image1 from '@assets/objects/bike-yellow.webp';
import WEBP_image2 from '@assets/objects/boke-green.webp';
import PNG_Lipstick from '@assets/lipstick.png';

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
  bonus: {
    name: string;
    imageUrl: string;
    link: string;
  } | null;
};

export const OBJECTS: Object[] = [
  {
    id: 1,
    name: 'yellow bike',
    image: WEBP_image1,
    position: {
      x: 12,
      y: 249,
    },
    size: {
      width: 126,
      height: 72,
    },
    bonus: {
      name: 'Помада',
      imageUrl: PNG_Lipstick,
      link: '#',
    },
  },
  {
    id: 2,
    name: 'green bike',
    image: WEBP_image2,
    position: {
      x: 725,
      y: 250,
    },
    size: {
      width: 132,
      height: 75,
    },
    bonus: {
      name: 'Помада',
      imageUrl: PNG_Lipstick,
      link: '#',
    },
  },
  // {
  //   id: 3,
  //   name: 'pie',
  //   image: PNG_image3,
  //   position: {
  //     x: 720,
  //     y: 232,
  //   },
  //   size: {
  //     width: 40,
  //     height: 20,
  //   },
  //   isTarget: true,
  // },
  // {
  //   id: 4,
  //   name: 'orange',
  //   image: PNG_image4,
  //   position: {
  //     x: 1140,
  //     y: 330,
  //   },
  //   size: {
  //     width: 30,
  //     height: 30,
  //   },
  //   isTarget: true,
  // },
  // {
  //   id: 5,
  //   name: 'eggs',
  //   image: PNG_image5,
  //   position: {
  //     x: 930,
  //     y: 237,
  //   },
  //   size: {
  //     width: 30,
  //     height: 15,
  //   },
  //   isTarget: false,
  // },
  // {
  //   id: 6,
  //   name: 'gateleg table',
  //   image: PNG_image6,
  //   position: {
  //     x: 450,
  //     y: 293,
  //   },
  //   size: {
  //     width: 60,
  //     height: 55,
  //   },
  //   isTarget: true,
  // },
  // {
  //   id: 7,
  //   name: 'flower vase',
  //   image: PNG_image7,
  //   position: {
  //     x: 530,
  //     y: 223,
  //   },
  //   size: {
  //     width: 45,
  //     height: 70,
  //   },
  //   isTarget: false,
  // },
  // {
  //   id: 8,
  //   name: 'lamp ',
  //   image: PNG_image8,
  //   position: {
  //     x: 170,
  //     y: 228,
  //   },
  //   size: {
  //     width: 30,
  //     height: 70,
  //   },
  //   isTarget: false,
  // },
  // {
  //   id: 9,
  //   name: 'flowers in vase',
  //   image: PNG_image9,
  //   position: {
  //     x: 700,
  //     y: 260,
  //   },
  //   size: {
  //     width: 40,
  //     height: 100,
  //   },
  //   isTarget: false,
  // },
];
