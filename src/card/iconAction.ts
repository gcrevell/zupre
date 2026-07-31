import { IconAction } from 'types';

export const runIconAction = (action: IconAction) => {
  switch (action.type) {
    case 'navigate':
      window.location.hash = action.path;
      break;
    default:
      break;
  }
};
