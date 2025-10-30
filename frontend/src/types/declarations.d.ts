declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const Component: ComponentType<any>;
  export default Component;
}

declare module '*.jpg';
declare module '*.png';
declare module '*.svg';
