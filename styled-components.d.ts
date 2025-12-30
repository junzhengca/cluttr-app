import 'styled-components/native';
import type { Theme } from './src/theme/types';

declare module 'styled-components/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}

