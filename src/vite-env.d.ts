/// <reference types="vite/client" />

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

declare module '*.svg?react' {
  import * as React from 'react';

  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default ReactComponent;
}

declare module '*.json?url' {
  const url: string;
  export default url;
}

declare module '*.png?url' {
  const url: string;
  export default url;
}

declare module '*.jpg?url' {
  const url: string;
  export default url;
}

declare module '*.jpeg?url' {
  const url: string;
  export default url;
}

declare module '*.webp?url' {
  const url: string;
  export default url;
}

declare module '*.jsx' {
  import type { ComponentType } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component: ComponentType<any>;
  export default Component;
}
