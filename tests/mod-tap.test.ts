import { modTap } from '../src/mod-tap';
import { toKey } from 'karabiner.ts';

describe('modTap', () => {
  it('should create a basic non-permissive mod-tap manipulator', () => {
    const manipulators = modTap()
      .from('a')
      .modifiers(toKey('left_shift'))
      .build();

    expect(manipulators).toHaveLength(1);
    const manipulator = manipulators[0] as any;

    expect(manipulator.from).toEqual({ key_code: 'a' });
    expect(manipulator.to_if_alone).toEqual([{ key_code: 'a', halt: true }]);
    expect(manipulator.to_if_held_down).toEqual([{ key_code: 'left_shift', halt: true }]);
    expect(manipulator.to_delayed_action.to_if_invoked).toEqual([]);
    expect(manipulator.to_delayed_action.to_if_canceled).toEqual([{ key_code: 'a' }]);
  });

  it('should create a permissive mod-tap manipulator', () => {
    const manipulators = modTap()
      .from('a')
      .modifiers(toKey('left_shift'))
      .permissive(true)
      .build();

    expect(manipulators).toHaveLength(1);
    const manipulator = manipulators[0] as any;

    expect(manipulator.from).toEqual({ key_code: 'a' });
    expect(manipulator.to_if_alone).toEqual([{ key_code: 'a', halt: true }]);
    expect(manipulator.to_if_held_down).toEqual([{ key_code: 'left_shift', halt: true }]);
    expect(manipulator.to_delayed_action.to_if_invoked).toEqual([]);
    expect(manipulator.to_delayed_action.to_if_canceled).toEqual([{
      key_code: 'left_shift',
      halt: true,
    }]);
  });

  it('should set a tapping term', () => {
    const manipulators = modTap()
      .from('a')
      .modifiers(toKey('left_shift'))
      .tappingTerm(200)
      .build();

    expect(manipulators).toHaveLength(1);
    const manipulator = manipulators[0] as any;
    expect(manipulator.parameters).toEqual({ 'basic.to_if_held_down_threshold_milliseconds': 200 });
  });

  it('should create a mod-tap for simultaneous keys', () => {
    const manipulators = modTap()
      .from(['a', 'b'])
      .modifiers(toKey('left_shift'))
      .build();

    expect(manipulators).toHaveLength(1);
    const manipulator = manipulators[0] as any;

    expect(manipulator.from).toEqual({
      simultaneous: [{ key_code: 'a' }, { key_code: 'b' }],
      simultaneous_options: { key_down_order: 'strict' },
    });
    expect(manipulator.to_if_alone).toEqual([
      { key_code: 'a', halt: true },
      { key_code: 'b' },
    ]);
    expect(manipulator.to_if_held_down).toEqual([{ key_code: 'left_shift', halt: true }]);
  });

  it('should create a mod-tap with from-modifiers', () => {
    const manipulators = modTap()
      .from('a', ['command'], ['option'])
      .modifiers(toKey('left_shift'))
      .build();

    expect(manipulators).toHaveLength(1);
    const manipulator = manipulators[0] as any;

    expect(manipulator.from).toEqual({
      key_code: 'a',
      modifiers: { mandatory: ['command'], optional: ['option'] },
    });
    expect(manipulator.to_if_alone).toEqual([{ key_code: 'a', halt: true, modifiers: ['command'] }]);
    expect(manipulator.to_if_held_down).toEqual([{ key_code: 'left_shift', halt: true }]);
  });
});
