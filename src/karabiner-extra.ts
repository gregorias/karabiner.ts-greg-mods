import {
  ArrowKeyCode,
  arrowKeyCodes,
  BasicManipulator,
  ControlOrSymbolKeyCode,
  controlOrSymbolKeyCodes,
  FromAndToKeyCode,
  FromKeyCode,
  FromKeyParam,
  FunctionKeyCode,
  functionKeyCodes,
  InternationalKeyCode,
  internationalKeyCodes,
  KeypadKeyCode,
  keypadKeyCodes,
  LetterKeyCode,
  letterKeyCodes,
  map,
  ModifierKeyCode,
  modifierKeyCodes,
  NumberKeyCode,
  numberKeyCodes,
  SideModifierAlias,
  ToKeyParam,
} from 'karabiner.ts';

export type FromAndToKeyParam = FromKeyParam & ToKeyParam;
export type BasicManipulatorBuilder = ReturnType<typeof map>;

export function isFromAndToKeyCode(key: string | number): key is FromAndToKeyCode {
  return modifierKeyCodes.includes(key as ModifierKeyCode) ||
    controlOrSymbolKeyCodes.includes(key as ControlOrSymbolKeyCode) ||
    arrowKeyCodes.includes(key as ArrowKeyCode) ||
    letterKeyCodes.includes(key as LetterKeyCode) ||
    numberKeyCodes.includes(key as NumberKeyCode) ||
    functionKeyCodes.includes(key as FunctionKeyCode) ||
    keypadKeyCodes.includes(key as KeypadKeyCode) ||
    internationalKeyCodes.includes(key as InternationalKeyCode);
}

export type Side = 'left' | 'right';

export function getSideOfMod(mod: SideModifierAlias): Side {
  if (mod.startsWith('left') || mod.startsWith('l') || mod.startsWith('<') || mod.startsWith('‹')) {
    return 'left';
  } else if (mod.startsWith('right') || mod.startsWith('r') || mod.startsWith('>') || mod.startsWith('›')) {
    return 'right';
  } else {
    throw new Error(`Invalid side modifier: ${mod}`);
  }
}

/**
 * Returns the from key code from a BasicManipulator or null if not found.
 */
export function getFromKeyCodeFromBasicManipulator(m: BasicManipulator): FromKeyCode | null {
  if (!('key_code' in m.from)) {
    return null;
  }
  if (typeof m.from.key_code === 'number') {
    return null
  }
  return m.from.key_code;
}
