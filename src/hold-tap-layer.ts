// A hold-tap layer is a modified karabiner.ts layer that mimics QMK hold-tap
// behavior.
//
// A hold-tap layer comes with the following features on top of the regular
// layer:
//
// - Permissive hold and hold on other key press behavior.
// - Replaying typed keys when the hold-behavior doesn’t trigger, e.g., roll
//   overs involving the layer key during normal typing do not lose keys.
// - hold-tap strategy can be configured individually per key.
//
// Some known flaws and drawbacks are as follows:
//
// - To avoid losing keys, you must configure each key that can be used
//   together with the layer key (e.g., during a roll over).
//
// ## Implementation
//
// The hold-tap layer is implemented as a Karabiner.ts layer but it adds a
// start variable to indicate that the hold-tap key has just been pressed. This
// variable is unset after the tapping term is over or when another key is
// pressed.
import assert from "assert";
import {
  BasicManipulator,
  ifVar,
  layer,
  map,
  toSetVar,
  withCondition,
  Manipulator,
  LayerKeyParam,
  Rule,
  FromEvent,
  Modifier,
  ModifierParam,
  parseModifierParam,
  ToKeyParam,
  ToEventOptions,
  ToEvent,
  Condition,
} from "karabiner.ts"
import { BasicManipulatorBuilder, FromAndToKeyParam, isFromAndToKeyCode } from "./karabiner-extra";

function applyConditionsToToEvent(e: ToEvent, ...conds: Array<Condition>): ToEvent {
  return {
    ...e,
    conditions: conds,
  } as unknown as ToEvent;
}

function applyConditionToToEvents(m: BasicManipulator, cond: Condition) {
  if (m.to) {
    m.to = m.to.map((e) => applyConditionsToToEvent(e, cond))
  }
  if (m.to_after_key_up) {
    m.to_after_key_up = m.to_after_key_up.map((e) => applyConditionsToToEvent(e, cond))
  }
  if (m.to_if_alone) {
    m.to_if_alone = m.to_if_alone.map((e) => applyConditionsToToEvent(e, cond))
  }
  if (m.to_if_held_down) {
    m.to_if_held_down = m.to_if_held_down.map((e) => applyConditionsToToEvent(e, cond))
  }
}

/**
 * The hold-tap layer builder.
 */
export class HoldTapLayerBuilder {
  private key: LayerKeyParam;
  private layer_builder: ReturnType<typeof layer>;
  private ruleDescription?: string;
  private configKeyOptionalMods?: Modifier[] | ['any'];
  private tappingTermMs?: number;

  constructor(key: LayerKeyParam) {
    this.key = key;
    this.layer_builder = layer(key).configKey(
      (v) => v
        // Set the start variable to prevent slow keys from acting with the modifier.
        .to(toSetVar(this.startVariable, 1))
        // Unset the start variable on hold.
        .toIfHeldDown(toSetVar(this.startVariable, 0))
        .toAfterKeyUp(toSetVar(this.startVariable, 0)),
      /*replaceToIfAlone*/false)
  }

  /**
   * Adds an event for the layer key is held down.
   *
   * It's useful for home-row mods.
   */
  public onHold(
    key: ToKeyParam,
    modifiers?: ModifierParam,
    options?: ToEventOptions
  ): this {
    this.layer_builder.configKey((v) => v.toIfHeldDown(key, modifiers, options))
    return this
  }

  /**
   * Sets optional modifiers for the layer key.
   */
  public optionalModifiers(mods: ModifierParam):
    this {
    this.configKeyOptionalMods = parseModifierParam(mods);
    return this
  }

  /**
   * Sets the description for the rule.
   */
  public description(description: string): this {
    this.ruleDescription = description;
    return this;
  }

  /**
   * Sets the tapping term in milliseconds.
   *
   * The tapping term is the time in milliseconds that the key must be held
   * down in order to be fully active.
   */
  public tappingTerm(tappingTermMs: number): this {
    this.tappingTermMs = tappingTermMs;
    return this;
  }

  public build(): Rule {
    if (this.ruleDescription) {
      this.layer_builder.description(this.ruleDescription);
    }

    let rule = this.layer_builder.build()
    assert(rule.manipulators.length > 0, "HoldTapLayerBuilder should have at least one manipulator.");
    let configManipulator: BasicManipulator = rule.manipulators[0] as BasicManipulator;

    if (this.configKeyOptionalMods) {
      this.setOptionalConfigKeyModifiers(configManipulator.from,
        this.configKeyOptionalMods);
    }
    this.setTappingTerm(configManipulator);

    return rule
  }

  /**
   * Adds a regular manipulator to the layer.
   *
   * A regular manipulator always triggers when the layer key is pressed.
   *
   * This form of hold-tap decision making is called "hold on other key press"
   * in QMK, hence the name.
   */
  public holdOnOtherKeyPressManipulator(manipulator: BasicManipulator | BasicManipulatorBuilder): this {
    this.layer_builder.manipulators([manipulator])
    return this
  }

  public holdOnOtherKeyPressManipulators(manipulators:
    Parameters<typeof this.layer_builder.manipulators>[0]): this {
    this.layer_builder.manipulators(manipulators)
    return this
  }

  /**
   * Adds an echo key.
   *
   * An echo key is just replayed back together with the layer key during the
   * tapping term.
   *
   * It's useful for keys that might be rolled over often.
   */
  public echoKey(echoKey: FromAndToKeyParam): this {
    this.holdOnOtherKeyPressManipulator(map(echoKey)
      .condition(ifVar(this.startVariable))
      .to(toSetVar(this.startVariable, 0))
      .to(this.key)
      .to(echoKey))
    return this;
  }

  public echoKeys(...echoKeys: FromAndToKeyParam[]): this {
    for (const echoKey of echoKeys) {
      this.echoKey(echoKey);
    }
    return this
  }

  /**
   * Adds a permissive hold manipulator.
   *
   * A permissive hold manipulator triggers either when the tapping term has
   * elapsed or the manipulator's trigger has been tapped while holding the
   * layer key.
   *
   * If neither of those things happened, the layer key and and the manipulator
   * trigger are replayed as normal keys.
   */
  public permissiveHoldManipulator(
    manipulator: BasicManipulator | BasicManipulatorBuilder
  ): this {
    // Validate input parameters.
    if ("build" in manipulator) {
      let manipulators = manipulator.build();
      if (manipulators.length !== 1) {
        throw new Error("permissiveHoldManipulator expects a single manipulator.");
      }
      manipulator = manipulators[0];
    }

    assert(
      "from" in manipulator && "key_code" in manipulator.from,
      "permissiveHoldManipulator expects a BasicManipulator with a 'from' key code."
    );

    const fromKeyCode = manipulator.from.key_code;
    if (!isFromAndToKeyCode(fromKeyCode)) {
      throw new Error("The 'from' key code must be a FromAndToKeyCode but is: " + fromKeyCode);
    }
    if (!isFromAndToKeyCode(this.key)) {
      throw new Error("The layer key must be a FromAndToKeyCode but is: " + this.key);
    }

    // Encode the permissive hold logic inside a manipulator.
    let ifLayerVariable = ifVar(this.layerVariable).build();
    let unlessLayerVariable = ifVar(this.layerVariable).unless().build();
    let phManipulator: BasicManipulator = {
      ...manipulator
    }
    // Only run the original logic on tap.
    applyConditionToToEvents(phManipulator, ifLayerVariable)
    let toEvents: ToEvent[] = phManipulator.to ?? []
    phManipulator.to_after_key_up =
      toEvents.concat(phManipulator.to_after_key_up ?? []);
    phManipulator.to = undefined;
    // If the layer became inactive (interleaved taps), replay the keys.
    phManipulator.to_after_key_up.push(
      {
        conditions: [unlessLayerVariable],
        key_code: this.key,
      } as unknown as ToEvent,
      {
        conditions: [unlessLayerVariable],
        key_code: fromKeyCode,
      } as unknown as ToEvent,
      // Unset the start variable. We have triggered the hold action, so we are
      // in.
      toSetVar(this.startVariable, 0),
    )

    let ifStartVariable = ifVar(this.startVariable);
    let unlessStartVariable = ifVar(this.startVariable).unless()
    let manipulators: Array<Manipulator> = [];
    manipulators.push(
      // If hold is active, run the manipulator.
      ...withCondition(unlessStartVariable)([manipulator]).build(),
      // Otherwise, run the permissive hold logic.
      ...withCondition(ifStartVariable)([phManipulator]).build(),
    )
    this.layer_builder.manipulators(manipulators);
    return this;
  }

  public permissiveHoldManipulators(
    ...manipulators: (BasicManipulator | BasicManipulatorBuilder)[]
  ): this {
    for (const manipulator of manipulators) {
      this.permissiveHoldManipulator(manipulator);
    }
    return this
  }

  /**
   * Adds a slow manipulator to the layer.
   *
   * A slow manipulator is a manipulator that only triggers when
   * the tapping term has elapsed.
   */
  public slowManipulator(manipulator: BasicManipulator | BasicManipulatorBuilder): this {
    // Validate input parameters.
    if ("build" in manipulator) {
      let manipulators = manipulator.build();
      if (manipulators.length !== 1) {
        throw new Error("slowManipulator expects a single manipulator.");
      }
      manipulator = manipulators[0];
    }

    assert(
      "from" in manipulator && "key_code" in manipulator.from,
      "slowManipulator expects a BasicManipulator with a 'from' key code."
    );

    const fromKeyCode = manipulator.from.key_code;
    if (!isFromAndToKeyCode(fromKeyCode)) {
      throw new Error("The 'from' key code must be a FromAndToKeyCode but is: " + fromKeyCode);
    }
    if (!isFromAndToKeyCode(this.key)) {
      throw new Error("The layer key must be a FromAndToKeyCode but is: " + this.key);
    }


    let ifStartVariable = ifVar(this.startVariable);
    let unlessStartVariable = ifVar(this.startVariable).unless()
    let unsetStartVariable = toSetVar(this.startVariable, 0);

    let manipulators: Array<Manipulator> = [];
    manipulators.push(
      // If hold is active, run the manipulator.
      ...withCondition(unlessStartVariable)([manipulator]).build(),
      ...withCondition(ifStartVariable)([
        map(fromKeyCode).to(this.key).to(fromKeyCode).to(unsetStartVariable)
      ]).build(),
    );
    this.layer_builder.manipulators(manipulators)
    return this
  }

  public slowManipulators(
    ...manipulators: (BasicManipulator | BasicManipulatorBuilder)[]
  ): this {
    for (const manipulator of manipulators) {
      this.slowManipulator(manipulator);
    }
    return this
  }

  private get layerVariable(): string {
    // This is internally used by Karabiner.ts’ layer.
    return "layer-" + this.key;
  }

  private get startVariable(): string {
    // Purposefully using a suffix to make sure this variable is grouped
    // together in Karabiner Event Viewer.
    return this.layerVariable + "-start";
  }

  private setOptionalConfigKeyModifiers(layerKey: FromEvent,
    mods: Modifier[] | ['any']): void {

    layerKey.modifiers = {
      optional: mods,
    }
  }

  private setTappingTerm(configManipulator: BasicManipulator): void {
    if (this.tappingTermMs) {
      configManipulator.parameters = configManipulator.parameters ?? {};
      configManipulator.parameters['basic.to_if_held_down_threshold_milliseconds'] = this.tappingTermMs;
    }
  }
}

/**
 * Creates a builder for the hold-tap layer.
 */
export function holdTapLayer(key: LayerKeyParam): HoldTapLayerBuilder {
  return new HoldTapLayerBuilder(key);
}
