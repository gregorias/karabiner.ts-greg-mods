import {
  isFromAndToKeyCode,
  getSideOfMod,
  getFromKeyCodeFromBasicManipulator,
} from '../src/karabiner-extra';
import {
  BasicManipulator,
  SideModifierAlias,
} from 'karabiner.ts';

describe('isFromAndToKeyCode', () => {
  it('should return true for valid key codes', () => {
    expect(isFromAndToKeyCode('spacebar')).toBe(true);
    expect(isFromAndToKeyCode('left_shift')).toBe(true);
    expect(isFromAndToKeyCode('a')).toBe(true);
    expect(isFromAndToKeyCode('1')).toBe(true);
    expect(isFromAndToKeyCode('f1')).toBe(true);
    expect(isFromAndToKeyCode('keypad_1')).toBe(true);
    expect(isFromAndToKeyCode('international1')).toBe(true);
  });

  it('should return false for invalid key codes', () => {
    expect(isFromAndToKeyCode('not_a_key')).toBe(false);
    expect(isFromAndToKeyCode(123)).toBe(false);
    expect(isFromAndToKeyCode('shift')).toBe(false);
  });
});

describe('getSideOfMod', () => {
  it('should return the correct side for sided modifiers', () => {
    expect(getSideOfMod('left_shift')).toBe('left');
    expect(getSideOfMod('right_control')).toBe('right');
    expect(getSideOfMod('<⇧')).toBe('left');
    expect(getSideOfMod('>⌃')).toBe('right');
    expect(getSideOfMod('l⌥')).toBe('left');
    expect(getSideOfMod('r⌥')).toBe('right');
  });

  it('should return null for non-sided modifiers', () => {
    expect(getSideOfMod('shift')).toBe(null);
    expect(getSideOfMod('any' as SideModifierAlias)).toBe(null);
  });
});

describe('getFromKeyCodeFromBasicManipulator', () => {
  it('should return the key code from a manipulator', () => {
    const manipulator: BasicManipulator = {
      type: 'basic',
      from: { key_code: 'a' },
    };
    expect(getFromKeyCodeFromBasicManipulator(manipulator)).toBe('a');
  });

  it('should return null if from does not have key_code', () => {
    const manipulator: BasicManipulator = {
      type: 'basic',
      from: { consumer_key_code: 'rewind' },
    };
    expect(getFromKeyCodeFromBasicManipulator(manipulator)).toBe(null);
  });

  it('should return null if key_code is a number', () => {
    const manipulator: BasicManipulator = {
      type: 'basic',
      from: { key_code: 123 },
    };
    expect(getFromKeyCodeFromBasicManipulator(manipulator)).toBe(null);
  });
});
