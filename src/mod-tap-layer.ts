// A mod-tap layer is a hold-tap layer that activates a modifier on hold and
// adds a modifier to registered keys.
//
// Flaws:
//
// * You can’t add modifiers by holding one key after another.
import {
  BasicManipulator,
  map,
  LayerKeyParam,
  FromAndToKeyCode,
  SideModifierAlias,
  KeyAlias,
  Rule,
} from "karabiner.ts"
import { holdTapLayer, HoldTapLayerBuilder } from "./hold-tap-layer";
import { BasicManipulatorBuilder, FromAndToKeyParam } from "./karabiner-extra";

export class ModTapLayerBuilder {
  private mod: SideModifierAlias;
  private hold_tap_layer_builder: HoldTapLayerBuilder;
  private isLazy: boolean = false;

  constructor(key: LayerKeyParam, mod: SideModifierAlias) {
    this.mod = mod;
    this.hold_tap_layer_builder = holdTapLayer(key);
  }

  /**
   * Sets the description for the rule.
   */
  public description(description: string): this {
    this.hold_tap_layer_builder.description(description);
    return this;
  }

  /**
   * Sets the tapping term in milliseconds.
   *
   * The tapping term is the time in milliseconds that the key must be held
   * down in order to be fully active.
   */
  public tappingTerm(tappingTermMs: number): this {
    this.hold_tap_layer_builder.tappingTerm(tappingTermMs);
    return this;
  }

  /**
   * Sets whether the modifier should be sent lazily.
   */
  public lazy(val: boolean): this {
    this.isLazy = val;
    return this;
  }

  public build(): Rule {
    // The user has held down the mod-tap key so trigger the modifier.
    //
    // `.toIfHeldDown(mod)` needs to be last to ensure that Karabiner holds the modifier.
    // `toSetVar` would interrupt the hold action.
    //
    return this.hold_tap_layer_builder.onHold(this.mod, [], { lazy: this.isLazy })
      .build();
  }

  public holdOnOtherKeyPressManipulator(arg: Parameters<typeof this.hold_tap_layer_builder.holdOnOtherKeyPressManipulator>[0]): this {
    this.hold_tap_layer_builder.holdOnOtherKeyPressManipulator(arg)
    return this
  }

  public holdOnOtherKeyPressManipulators(arg: Parameters<typeof this.hold_tap_layer_builder.holdOnOtherKeyPressManipulators>[0]): this {
    this.hold_tap_layer_builder.holdOnOtherKeyPressManipulators(arg)
    return this
  }

  /**
   * Adds hold on other key press keys to the layer.
   *
   * HOOKP keys immediately send the key with the layer's modifier.
   */
  public holdOnOtherKeyPressKeys(keys: Array<FromAndToKeyCode | KeyAlias>): this {
    for (const key of keys) {
      this.holdOnOtherKeyPressManipulator(map(key).to(key, this.mod));
    }
    return this
  }

  public permissiveHoldManipulators(
    ...manipulators: (BasicManipulator  | BasicManipulatorBuilder)[]
  ): this {
    this.hold_tap_layer_builder.permissiveHoldManipulators(...manipulators);
    return this
  }

  /**
   * Adds a permissive hold key to the layer.
   */
  public permissiveHoldKey(from: FromAndToKeyParam): this {
    this.hold_tap_layer_builder.permissiveHoldManipulator(
      map(from).to(from, this.mod));
    return this
  }

  public permissiveHoldKeys(...keys: Array<FromAndToKeyParam>): this {
    for (const key of keys) {
      this.permissiveHoldKey(key);
    }
    return this
  }

  /**
   * Adds slow keys to the layer.
   *
   * Slow keys act as normal keys when tapped before the tapping term.
   *
   * Registering a slow key is necessary, because the if-held-down event can be
   * interrupted, e.g., by a permissive-hold key.
   */
  public slowKeys(keys: Array<FromAndToKeyParam>): this {
    for (const key of keys) {
      this.hold_tap_layer_builder.slowManipulators(...map(key).to(key, this.mod).build());
    }
    return this
  }

  public slowManipulators(...manipulators: BasicManipulator[]): this {
    this.hold_tap_layer_builder.slowManipulators(...manipulators);
    return this
  }
}

/**
 * Creates a builder for the mod-tap layer.
 */
export function modTapLayer(key: LayerKeyParam, mod: SideModifierAlias): ModTapLayerBuilder {
  return new ModTapLayerBuilder(key, mod);
}
