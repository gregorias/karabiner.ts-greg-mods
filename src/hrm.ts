// Home row mods manipulator layer(s).
//
// Flaws & Limitations:
//
// * Can’t chain modifiers to get a chord. You need to press the mod keys
//   simultaneously to get two or three modifiers.
// * If you want to remap some chords such as `r⌥+r` to `⏎`, you need to
//   define them as a manipulator in the HRM builder and as a standalone
//   manipulator.
import {
  BasicManipulator,
  FromAndToKeyCode,
  FromKeyCode,
  KeyAlias,
  LayerKeyParam,
  Manipulator,
  Modifier,
  ModifierParam,
  parseModifierParam,
  SideModifierAlias,
  toKey,
  ToKeyParam,
  getKeyWithAlias,
} from "karabiner.ts";
import { modTap } from "./mod-tap";
import { modTapLayer } from "./mod-tap-layer";
import {
  BasicManipulatorBuilder,
  getFromKeyCodeFromBasicManipulator,
  getSideOfMod,
  getUnsidedMod,
  isFromAndToKeyCode,
  isSidedMod,
  Side,
  sides,
} from "./karabiner-extra";

/**
 * Generates all unique ordered pairs from an array or iterable.
 */
function getDoubles<T>(keys: Iterable<T>): Array<[T, T]> {
  const arr = Array.from(keys);
  const out: Array<[T, T]> = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j) {
        out.push([arr[i], arr[j]]);
      }
    }
  }
  return out;
}

/**
 * Generates all unique ordered triples from an array or iterable.
 */
function getTriples<T>(keys: Iterable<T>): Array<[T, T, T]> {
  const arr = Array.from(keys);
  const out: Array<[T, T, T]> = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      for (let k = 0; k < arr.length; k++) {
        if (i !== j && i !== k && j !== k) {
          out.push([arr[i], arr[j], arr[k]]);
        }
      }
    }
  }
  return out;
}

export declare type LeftModifierFlag = 'left' | 'l' | '<' | '‹';


export type HrmKey = (FromAndToKeyCode | KeyAlias);
export type HrmMod = SideModifierAlias & ToKeyParam;
export type HrmKeyParam = (FromAndToKeyCode | KeyAlias) & LayerKeyParam;

export class HrmKeyboardLayout {
  public readonly leftHandKeys: FromAndToKeyCode[];
  public readonly rightHandKeys: FromAndToKeyCode[];

  constructor(
    leftHandKeys: Array<FromAndToKeyCode | KeyAlias>,
    rightHandKeys: Array<FromAndToKeyCode | KeyAlias>
  ) {
    this.leftHandKeys = leftHandKeys.map(k => getKeyWithAlias<FromAndToKeyCode>(k));
    this.rightHandKeys = rightHandKeys.map(k => getKeyWithAlias<FromAndToKeyCode>(k));
  }
}

export type HoldTapStrategy = 'permissive-hold' | 'hold-on-other-key-press' | 'slow'

/**
 * Given a key and a keyboard layout, returns which side ('left' | 'right') the key is on,
 * or null if the key is not found in either hand.
 */
export function getSideOfKey(key: FromAndToKeyCode, layout: HrmKeyboardLayout): Side | null {
  if (layout.leftHandKeys.includes(key)) {
    return 'left';
  } else if (layout.rightHandKeys.includes(key)) {
    return 'right';
  } else {
    return null;
  }
}

class SmartModifierManipulatorMap {
  private smartManipulators: Map<Modifier, BasicManipulator[]> = new Map();

  public getSmartManipulators(modifierParam: ModifierParam): BasicManipulator[] {
    let modifiers = parseModifierParam(modifierParam);
    if (!modifiers || modifiers.length != 1) {
      throw new Error(`Expected a single modifier, but got ${JSON.stringify(modifierParam)}.`);
    }
    let modifier = modifiers[0];

    let manipulators = this.smartManipulators.get(modifier) ?? [];

    if (isSidedMod(modifier)) {
      const unsidedModifier = getUnsidedMod(modifier);
      manipulators = manipulators.concat(
        this.smartManipulators.get(unsidedModifier) ?? []
      );
    }

    return manipulators;
  };

  public addSmartManipulator(modifierParam: ModifierParam, manipulator: BasicManipulator): this {
    let modifiers = parseModifierParam(modifierParam);
    if (!modifiers || modifiers.length != 1) {
      throw new Error(`Expected a single modifier, but got ${JSON.stringify(modifierParam)}.`);
    }
    let modifier = modifiers[0];

    this.smartManipulators.set(
      modifier,
      (this.smartManipulators.get(modifier) ?? []).concat(manipulator)
    );
    return this;
  }
}

export class HrmBuilder {
  // A map of keys to their modifiers, e.g., a ⇒ ⌃, s ⇒ ⌥, d ⇒ ⇧.
  private readonly hrmKeys: Map<HrmKeyParam, HrmMod>;
  private readonly keyboardLayout: HrmKeyboardLayout;
  // Manipulators that override the default mod-tap behavior.
  private smartManipulatorMap: SmartModifierManipulatorMap =
    new SmartModifierManipulatorMap();
  private isLazy: boolean = false;
  private chosenHoldTapStrategy: HoldTapStrategy = 'permissive-hold'
  private isChordalHold: boolean = false;

  constructor(hrmKeys: Map<HrmKeyParam, HrmMod>,
    layout: HrmKeyboardLayout
  ) {
    this.hrmKeys = hrmKeys;
    this.keyboardLayout = layout;
  }

  /**
   * Sets whether the modifiers are lazy.
   */
  public lazy(isLazy: boolean): this {
    this.isLazy = isLazy;
    return this;
  }

  /**
   * Sets the hold tap strategy for the builder.
   */
  public holdTapStrategy(strategy: HoldTapStrategy): this {
    this.chosenHoldTapStrategy = strategy;
    return this;
  }

  /**
  * Enables or disables chordal hold.
  */
  public chordalHold(isChordalHold: boolean): this {
    this.isChordalHold = isChordalHold;
    return this;
  }

  public build(): Manipulator[] {
    // Tuple manipulators need to come first, so that a more generic condition
    // doesn't trigger first.
    let manipulators: Manipulator[] = this.tupleManipulators();
    manipulators = manipulators.concat(this.singleManipulators());

    return manipulators;
  }

  public smartManipulator(
    mod: ModifierParam,
    manipulator: BasicManipulator | BasicManipulatorBuilder
  ): this {
    if ('build' in manipulator) {
      for (const m of manipulator.build())
        this.smartManipulatorMap.addSmartManipulator(mod, m);
    } else {
      this.smartManipulatorMap.addSmartManipulator(mod, manipulator);
    }
    return this;
  }

  public smartManipulators(
    mod: ModifierParam,
    ...manipulators: (BasicManipulator | BasicManipulatorBuilder)[]
  ): this {
    for (const manipulator of manipulators) {
      this.smartManipulator(mod, manipulator);
    }
    return this;
  }

  /**
   * Creates all chorded modifiers for the home row mods.
   */
  private tupleManipulators(): Manipulator[] {
    const hrmKeys = this.hrmKeys;
    let manipulators: Manipulator[] = [];

    for (const side of sides) {
      const sideKeys: HrmKeyParam[] = Array.from(hrmKeys.keys())
        .filter(k => getSideOfMod(hrmKeys.get(k) as SideModifierAlias) === side);

      for (const [first, second, third] of getTriples(sideKeys)) {
        manipulators = manipulators.concat(modTap()
          .from([first, second, third], [], "any")
          .modifiers(toKey(hrmKeys.get(first) as ToKeyParam, [
            hrmKeys.get(second) as SideModifierAlias,
            hrmKeys.get(third) as SideModifierAlias]))
          .permissive(true)
          .build())
      }
      for (const [first, second] of getDoubles(sideKeys)) {
        manipulators = manipulators.concat(modTap()
          .from([first, second], [], "any")
          .modifiers(toKey(hrmKeys.get(first) as ToKeyParam, hrmKeys.get(second)))
          .permissive(true)
          .build())
      }
    }

    return manipulators;
  }

  private singleManipulators(): Manipulator[] {
    let manipulators: Manipulator[] = [];
    for (const [hrmKey, hrmMod] of this.hrmKeys.entries()) {
      manipulators = manipulators.concat(this.singleManipulatorLayer(hrmKey, hrmMod));
    }
    return manipulators;
  }

  private singleManipulatorLayer(hrmKey: HrmKeyParam, hrmMod: SideModifierAlias): Manipulator[] {
    const side: Side | null = getSideOfMod(hrmMod);
    if (side === null) {
      throw new Error(`Expected a sided modifier, but got ${JSON.stringify(hrmMod)}.`);
    }

    let smartManipulators: BasicManipulator[] = this.smartManipulatorMap.getSmartManipulators(hrmMod);

    let mtLayer = modTapLayer(hrmKey, hrmMod).lazy(this.isLazy)

    for (const sm of smartManipulators) {
      const smFrom = getFromKeyCodeFromBasicManipulator(sm);
      if (smFrom === null) {
        throw new Error(`Expected a from key code in a smart manipulator but got ${JSON.stringify(sm)}.`);
      }
      if (!isFromAndToKeyCode(smFrom)) {
        throw new Error(`Expected a from and to key code in a smart manipulator but got ${JSON.stringify(smFrom)}.`);
      }
      const smSide = getSideOfKey(smFrom, this.keyboardLayout);
      if (smSide === null) {
        throw new Error(`Could not determine the side of the smart manipulator key, ${JSON.stringify(smFrom)}.`);
      }

      if (this.isChordalHold && smSide === side) {
        mtLayer.slowManipulators(sm);
      } else {
        switch (this.chosenHoldTapStrategy) {
          case 'permissive-hold':
            mtLayer.permissiveHoldManipulators(sm);
            break;
          case 'hold-on-other-key-press':
            mtLayer.holdOnOtherKeyPressManipulator(sm);
            break;
          case 'slow':
            mtLayer.slowManipulators(sm);
            break;
          default:
            throw this.chosenHoldTapStrategy satisfies never;
        }

      }
    }

    let smartKeys = side === 'left' ? this.keyboardLayout.rightHandKeys : this.keyboardLayout.leftHandKeys;
    let slowKeys = side === 'left' ? this.keyboardLayout.leftHandKeys : this.keyboardLayout.rightHandKeys;

    switch (this.chosenHoldTapStrategy) {
      case 'permissive-hold':
        mtLayer.permissiveHoldKeys(...smartKeys);
        break;
      case 'hold-on-other-key-press':
        mtLayer.holdOnOtherKeyPressKeys(smartKeys);
        break;
      case 'slow':
        mtLayer.slowKeys(smartKeys);
        break;
      default:
        throw this.chosenHoldTapStrategy satisfies never;
    }

    if (this.isChordalHold) {
      mtLayer.slowKeys(slowKeys)
    } else {
      switch (this.chosenHoldTapStrategy) {
        case 'permissive-hold':
          mtLayer.permissiveHoldKeys(...slowKeys);
          break;
        case 'hold-on-other-key-press':
          mtLayer.holdOnOtherKeyPressKeys(slowKeys);
          break;
        case 'slow':
          mtLayer.slowKeys(slowKeys);
          break;
        default:
          throw this.chosenHoldTapStrategy satisfies never;
      }
    }

    return mtLayer.build().manipulators;
  }
}

export function hrm(
  hrmKeys: Map<HrmKeyParam, SideModifierAlias & ToKeyParam>,
  layout: HrmKeyboardLayout): HrmBuilder {
  return new HrmBuilder(hrmKeys, layout);
}
