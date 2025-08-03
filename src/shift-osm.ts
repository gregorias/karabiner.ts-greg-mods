// A shift one shot modifier layer.
import {
  BasicManipulator,
  Rule,
  ifVar,
  letterKeyCodes,
  map,
  toSetVar,
  rule,
  ToEvent,
  numberKeyCodes,
} from "karabiner.ts";
import { FromAndToKeyParam, layerVarName } from "./karabiner-extra";

const shiftableKeys: FromAndToKeyParam[] = [
  ...letterKeyCodes,
  ...numberKeyCodes,
  "⎋",
  "-",
  "=",
  "⌫",
  "⇥",
  "[",
  "]",
  "\\",
  ";",
  "'",
  ",",
  ".",
  "/",
  "⏎",
  "←",
  "↑",
  "↓",
  "→",
];

/**
 * Returns the variable that indicates shift OSM being active.
 */
export function shiftOsmVarName(): string {
  return "shift-osm";
}

export class ShiftOsmBuilder {
  private ruleDescription: string = "⇧ OSM";
  private layerManipulators: BasicManipulator[] = [];

  /**
   * Sets the description for the rule.
   */
  public description(description: string): this {
    this.ruleDescription = description;
    return this;
  }

  public shiftedKey(key: FromAndToKeyParam): this {
    const ifOsm = ifVar(shiftOsmVarName());
    this.layerManipulators.push(
      ...map(key, null, "any")
        .condition(ifOsm)
        .to(key, "l⇧")
        .toUnsetVar(shiftOsmVarName())
        .build(),
    );
    return this;
  }

  public manipulators(...manipulators: BasicManipulator[]): this {
    this.layerManipulators.push(...manipulators);
    return this;
  }

  public build(): Rule {
    shiftableKeys.forEach(this.shiftedKey.bind(this));

    const ifOsm = ifVar(shiftOsmVarName());
    const unlessOsm = ifOsm.unless();
    const unlessLayer = ifVar(layerVarName).unless();
    const setOsm: ToEvent = toSetVar(shiftOsmVarName(), 1);
    const unsetOsm: ToEvent = toSetVar(shiftOsmVarName(), 0);

    for (const toggleKey of ["l⇧", "r⇧"] as FromAndToKeyParam[]) {
      this.manipulators(
        ...map(toggleKey, null, "any")
          .condition(unlessLayer)
          .to(toggleKey)
          .toIfAlone({ ...setOsm, conditions: [unlessOsm.build()] })
          .toIfAlone({ ...unsetOsm, conditions: [ifOsm.build()] })
          .build(),
      );
    }

    return rule(this.ruleDescription)
      .manipulators(this.layerManipulators)
      .build();
  }
}

/**
 * Returns a builder for a shift one shot modifier layer.
 *
 * The layer toggles on and off with a tap on the left or right shift key.
 */
export function shiftOsm(): ShiftOsmBuilder {
  return new ShiftOsmBuilder();
}
