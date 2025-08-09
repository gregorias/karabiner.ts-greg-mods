// A caps-word layer turns on capitalizing letters until an escape key (⎋ or ␣) is pressed.
import {
  BasicManipulator,
  Rule,
  ifVar,
  letterKeyCodes,
  map,
  toSetVar,
  FromModifierParam,
  rule,
  LetterKeyCode,
  withCondition,
  ModifierParam,
  FromKeyParam,
} from "karabiner.ts";
import { FromAndToKeyParam } from "./karabiner-extra";

/**
 * Returns the variable that indicates Caps WORD being active.
 */
export function capsWordVarName(): string {
  return "caps-word";
}

export class CapsWordBuilder {
  private ruleDescription: string = "Caps WORD";
  private layerManipulators: BasicManipulator[] = [];
  private useDefaultEscapeKeys: boolean = true;

  public activator(manipulator: BasicManipulator): this {
    this.layerManipulators.push(
      ...(withCondition(ifVar(capsWordVarName()).unless())([
        {
          ...manipulator,
          to: [toSetVar(capsWordVarName(), 1)],
        },
      ]) as BasicManipulator[]),
    );
    return this;
  }

  /**
   * Sets the description for the rule.
   */
  public description(description: string): this {
    this.ruleDescription = description;
    return this;
  }

  public shiftedKey(key: LetterKeyCode): this {
    const ifCapsWord = ifVar(capsWordVarName());
    this.layerManipulators.push(
      ...map(key, null, "any").condition(ifCapsWord).to(key, "l⇧").build(),
    );
    return this;
  }

  public escapeKey(
    key: FromAndToKeyParam,
    mandatoryModifiers?: (FromModifierParam | "" | null) & ModifierParam,
    optionalModifiers?: FromModifierParam,
  ): this {
    this.layerManipulators.push(
      ...map(key, mandatoryModifiers, optionalModifiers)
        .condition(ifVar(capsWordVarName()))
        .toUnsetVar(capsWordVarName())
        .to(key, mandatoryModifiers)
        .build(),
    );
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
    this.layerManipulators.push(
      ...map(key, mandatoryModifiers, optionalModifiers)
        .condition(ifVar(capsWordVarName()))
        .toUnsetVar(capsWordVarName())
        .build(),
    );
    return this;
  }

  public manipulators(manipulators: BasicManipulator[]): this {
    this.layerManipulators.push(
      ...(withCondition(ifVar(capsWordVarName()))(
        manipulators,
      ) as BasicManipulator[]),
    );
    return this;
  }

  public defaultEscapeKeys(use: boolean): this {
    this.useDefaultEscapeKeys = use;
    return this;
  }

  public build(): Rule {
    // Capitalized letters
    letterKeyCodes.forEach((key) => {
      this.shiftedKey(key);
    });

    // Deactivators
    if (this.useDefaultEscapeKeys) {
      this.escapePassthroughKey("⎋")
        .escapeKey("⏎", undefined, "any")
        .escapeKey("␣")
        .escapeKey("l⇧", undefined, "any")
        .escapeKey("r⇧", undefined, "any")
        .escapeKey(",")
        .escapeKey(".")
        .escapeKey("/", "⇧");
    }

    return rule(this.ruleDescription)
      .manipulators([...this.layerManipulators])
      .build();
  }
}

export function capsWord(): CapsWordBuilder {
  return new CapsWordBuilder();
}
