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
  KeyAlias,
  LayerKeyParam,
  Manipulator,
  SideModifierAlias,
  toKey,
  ToKeyParam,
} from "karabiner.ts";
import { modTap } from "./mod-tap";
import { modTapLayer } from "./mod-tap-layer";
import {
  BasicManipulatorBuilder,
  getSideOfMod,
  Side,
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
export type HrmKeyboardLayout = {
  leftHandKeys: HrmKey[];
  rightHandKeys: HrmKey[];
}

export type HoldTapStrategy = 'permissive-hold' | 'hold-on-other-key-press' | 'slow'

export class HrmBuilder {
  // A map of keys to their modifiers, e.g., a ⇒ ⌃, s ⇒ ⌥, d ⇒ ⇧.
  private readonly hrmKeys: Map<HrmKeyParam, HrmMod>;
  private readonly keyboardLayout: HrmKeyboardLayout;
  private extraPermissiveManipulators:
    Map<HrmMod, (Manipulator | BasicManipulatorBuilder)[]> = new Map();
  private extraSlowManipulators: Map<HrmMod, BasicManipulator[]> = new Map();
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

  public smartManipulators(hrmMod: HrmMod, ...newManipulators: Array<Manipulator | BasicManipulatorBuilder>): this {
    let existingManipulators = this.extraPermissiveManipulators.get(hrmMod) ?? [];
    this.extraPermissiveManipulators.set(hrmMod, existingManipulators.concat(newManipulators));
    return this;
  }

  public slowManipulators(hrmMod: HrmMod, ...newManipulators: BasicManipulator[]): this {
    let existingManipulators = this.extraSlowManipulators.get(hrmMod) ?? [];
    this.extraSlowManipulators.set(hrmMod, existingManipulators.concat(newManipulators));
    return this;
  }

  /**
   * Creates all chorded modifiers for the home row mods.
   */
  private tupleManipulators(): Manipulator[] {
    const hrmKeys = this.hrmKeys;
    let manipulators: Manipulator[] = [];

    for (const [first, second, third] of getTriples(hrmKeys.keys())) {
      manipulators = manipulators.concat(modTap()
        .from([first, second, third], [], "any")
        .modifiers(toKey(hrmKeys.get(first) as ToKeyParam, [
          hrmKeys.get(second) as SideModifierAlias,
          hrmKeys.get(third) as SideModifierAlias]))
        .permissive(true)
        .build())
    }
    for (const [first, second] of getDoubles(hrmKeys.keys())) {
      manipulators = manipulators.concat(modTap()
        .from([first, second], [], "any")
        .modifiers(toKey(hrmKeys.get(first) as ToKeyParam, hrmKeys.get(second)))
        .permissive(true)
        .build())
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

  private singleManipulatorLayer(hrmKey: HrmKeyParam, hrmMod: SideModifierAlias & ToKeyParam): Manipulator[] {
    const side: Side = getSideOfMod(hrmMod);

    let permissiveManipulators: ((Manipulator | BasicManipulatorBuilder)[]) =
      this.extraPermissiveManipulators.get(hrmMod) ?? [];
    let slowManipulators: BasicManipulator[] =
      this.extraSlowManipulators.get(hrmMod) ?? [];

    // Making the key lazy works for my workflow. I never want just to have to press
    // the modifier standalone. Also, I sometimes remap combos, e.g.,
    // r⌥+r to ⏎, and having r⌥ show up as a press, ruins HRM.
    let mtLayer = modTapLayer(hrmKey, hrmMod);
    mtLayer
      .lazy(this.isLazy)
      // TODO: Add permissiveHoldManipulators
      .holdOnOtherKeyPressManipulators(permissiveManipulators)
      .slowManipulators(...slowManipulators)

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
        const _: never = this.chosenHoldTapStrategy;
        throw new Error(`Unknown hold tap strategy: ${_}`);
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
          const _: never = this.chosenHoldTapStrategy;
          throw new Error(`Unknown hold tap strategy: ${_}`);
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
