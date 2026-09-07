import { renderToString } from 'react-dom/server';
import { App } from './App';
import type { PageData } from './types';
export const render = (data: PageData) => renderToString(<App {...data} />);
