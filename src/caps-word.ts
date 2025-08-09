// It's tricky that this mod relies on both the ⇪ modifier and a variable to
// track the Caps WORD mode, but I think I got all realistic cases covered.
//
// A previous version of this mod just registered all possible alphanumerics
// and added a shift to them, but that caused conflict with other layers, e.g.,
// HRM
// (https://github.com/gregorias/karabiner.ts-greg-mods/issues/3).
import {
  BasicManipulator,
  Rule,
  ifVar,
  map,
  toSetVar,
  FromModifierParam,
  rule,
  withCondition,
  ModifierParam,
  FromKeyParam,
  ToEvent,
  withModifier,
  toUnsetVar,
} from "karabiner.ts";
import { FromAndToKeyParam } from "./karabiner-extra";

export function capsWordVarName(): string {
  return "caps-word";
}

const ifCapsWord = ifVar(capsWordVarName(), 1);
const setCapsWordVar = toSetVar(capsWordVarName());
const unsetCapsWordVar = toUnsetVar(capsWordVarName());

function withCapsLock(manipulator: BasicManipulator): BasicManipulator[] {
  return withModifier("⇪")([manipulator]).build() as BasicManipulator[];
}

function withCapsWord(manipulator: BasicManipulator): BasicManipulator[] {
  return withCondition(ifCapsWord)([manipulator]).build() as BasicManipulator[];
}

const withCapsLockAndCapsWord = (manipulator: BasicManipulator) => {
  return withModifier("⇪")(
    withCondition(ifCapsWord)([manipulator]),
  ).build() as BasicManipulator[];
};

const capsLockToggleEvent: ToEvent = {
  key_code: "caps_lock",
  hold_down_milliseconds: 100,
};

/**
 * Turns the manipulator into a Caps WORD toggle.
 */
export function capsWordToggle(
  manipulator: BasicManipulator,
): BasicManipulator[] {
  const baseTo = manipulator.to ?? [];
  return [
    ...withCapsLockAndCapsWord({
      ...manipulator,
      to: [capsLockToggleEvent, unsetCapsWordVar].concat(baseTo),
    }),
    ...withCapsLock({ ...manipulator, to: [setCapsWordVar].concat(baseTo) }),
    {
      ...manipulator,
      to: [capsLockToggleEvent, setCapsWordVar].concat(baseTo),
    },
  ];
}

/**
 * Turns the manipulator into a Caps WORD off button.
 */
export function capsWordOff(manipulator: BasicManipulator): BasicManipulator[] {
  const baseTo = manipulator.to ?? [];
  return [
    ...withCapsLockAndCapsWord({
      ...manipulator,
      to: [capsLockToggleEvent, unsetCapsWordVar].concat(baseTo),
    }),
    ...withCapsWord({ ...manipulator, to: [unsetCapsWordVar].concat(baseTo) }),
  ];
}

export const disableCapsWordEvents: ToEvent[] = [
  {
    ...capsLockToggleEvent,
    // This is heuristic, we should only press ⇪ if ⇪ is on.
    // Hopefully, we never get into a state where ⇪ is off but the variable is
    // on.
    conditions: [ifCapsWord.build()],
  },
  unsetCapsWordVar,
];

export class CapsWordBuilder {
  private ruleDescription: string = "Caps WORD";
  private layerManipulators: BasicManipulator[] = [];
  private useDefaultEscapeKeys: boolean = true;

  /**
   * Sets the description for the rule.
   */
  public description(description: string): this {
    this.ruleDescription = description;
    return this;
  }

  /**
   * Adds a toggle.
   */
  public toggle(manipulator: BasicManipulator): this {
    this.layerManipulators.push(...capsWordToggle(manipulator));
    return this;
  }

  /**
   * Adds a key that deactivates the Caps WORD mode.
   */
  public escapeKey(
    key: FromAndToKeyParam,
    mandatoryModifiers?: (FromModifierParam | "" | null) & ModifierParam,
    optionalModifiers?: FromModifierParam,
  ): this {
    let escapeManipulator = map(key, mandatoryModifiers, optionalModifiers).to(
      key,
      mandatoryModifiers,
    );
    this.layerManipulators.push(...capsWordOff(escapeManipulator.build()[0]));
    return this;
  }

  /**
   * Adds an escape key without an echo.
   *
   * Useful for keys like ⎋, where the echo would often be spurious, i.e.,
   * we only want to exit the Caps WORD mode, not some external mode.
   */
  public escapePassthroughKey(
    key: FromKeyParam,
    mandatoryModifiers?: FromModifierParam | "" | null,
    optionalModifiers?: FromModifierParam,
  ): this {
    let escapeManipulator = map(key, mandatoryModifiers, optionalModifiers);
    this.layerManipulators.push(...capsWordOff(escapeManipulator.build()[0]));
    return this;
  }

  public defaultEscapeKeys(use: boolean): this {
    this.useDefaultEscapeKeys = use;
    return this;
  }

  public build(): Rule {
    // Deactivators
    if (this.useDefaultEscapeKeys) {
      this.escapePassthroughKey("⎋")
        // It's important the ⇪ turns off the variable as well. Otherwise,
        // we might inadvertedly reenable ⇪ in some cases.
        .escapePassthroughKey("⇪")
        .escapeKey("⏎", undefined, "any")
        .escapeKey("␣")
        .escapeKey("l⇧", undefined, "any")
        .escapeKey("r⇧", undefined, "any")
        .escapeKey("0", "⇧", "any")
        .escapeKey("close_bracket", undefined, "any")
        .escapeKey(";", undefined, "any")
        .escapeKey("'", undefined, "any")
        .escapeKey(",", undefined, "any")
        .escapeKey(".", undefined, "any")
        .escapeKey("/", undefined, "any");
    }

    return rule(this.ruleDescription)
      .manipulators([...this.layerManipulators])
      .build();
  }
}

/**
 * A caps-word layer turns on capitalizing letters until an escape key (⎋, ␣, etc.) is pressed.
 *
 * This layer works by turning on ⇪ under the hood and registering escape keys.
 */
export function capsWord(): CapsWordBuilder {
  return new CapsWordBuilder();
}
