export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const checkCollision = (pos1: Position, pos2: Position): boolean => {
  return (
    pos1.x < pos2.x + pos2.width &&
    pos1.x + pos1.width > pos2.x &&
    pos1.y < pos2.y + pos2.height &&
    pos1.y + pos1.height > pos2.y
  );
};

export const generateRandomPosition = (
  containerWidth: number,
  containerHeight: number,
  elementWidth: number,
  elementHeight: number,
  existingPositions: Position[],
  half: 'top' | 'bottom',
  maxAttempts: number = 100
): Position | null => {
  const padding = 10;
  const minX = padding;
  const maxX = containerWidth - elementWidth - padding;

  const halfHeight = containerHeight / 2;
  let minY: number;
  let maxY: number;

  if (half === 'top') {
    minY = padding;
    maxY = halfHeight - elementHeight - padding;
  } else {
    minY = halfHeight + padding;
    maxY = containerHeight - elementHeight - padding;
  }

  if (maxY <= minY) {
    return null;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;

    const newPosition: Position = { x, y, width: elementWidth, height: elementHeight };

    const hasCollision = existingPositions.some((existingPos) =>
      checkCollision(newPosition, existingPos)
    );

    if (!hasCollision) {
      return newPosition;
    }
  }

  return null;
};
