// Mod-tap turns a key in a dual-function mod-tap one.
//
// A mod-tap key can work in two modes:
//
// - Non-permissive requires waiting for the tapping term to pass before
//   activating the modifier.
// - Permissive activates the modifier as soon as another key is pressed.
//
// ## Flaws & limitations
//
// Mod-tap non-permissive keys require waiting for the tapping term to be over. This is
// cumbersome as the tapping term needs to be large enough to avoid accidental
// activation (above 100 ms).
//
// Mod-tap permissive keys spuriously activate during roll overs.
import {
  BasicManipulator,
  FromEvent,
  FromAndToKeyCode,
  FromModifierParam,
  KeyAlias,
  ModifierParam,
  ToEvent,
  getKeyWithAlias,
  map,
  parseFromModifierParams,
  parseModifierParam,
} from "karabiner.ts";

export class ModTapBuilder {
  private fromEvent!: FromEvent;
  private originalEvents: Array<ToEvent> = [];
  private isPermissive: boolean = false;
  private mods!: ToEvent;
  private tappingTermMs?: number;

  constructor() {}

  public build(): BasicManipulator[] {
    let m = map(this.fromEvent).toIfAlone(
      this.copyAndAddHaltToFirstToEvent(this.originalEvents),
    );

    if (this.isPermissive) {
      m.to({
        ...this.mods,
        lazy: true,
      });
    } else {
      m.toDelayedAction([], this.originalEvents).toIfHeldDown({
        ...this.mods,
        halt: true,
      });
    }

    if (this.tappingTermMs !== undefined) {
      m.parameters({
        "basic.to_if_held_down_threshold_milliseconds": this.tappingTermMs,
      });
    }

    return m.build();
  }

  public from(
    keyCodeAlias:
      | FromAndToKeyCode
      | KeyAlias
      | Array<FromAndToKeyCode | KeyAlias>,
    mandatoryModifiers?: FromModifierParam & ModifierParam,
    optionalModifiers?: FromModifierParam,
  ): this {
    if (Array.isArray(keyCodeAlias)) {
      const keyCodes = keyCodeAlias.map(function (keyCodeAlias) {
        return { key_code: getKeyWithAlias<FromAndToKeyCode>(keyCodeAlias) };
      });
      this.fromEvent = {
        simultaneous: keyCodes,
        simultaneous_options: { key_down_order: "strict" },
        modifiers: parseFromModifierParams(
          mandatoryModifiers,
          optionalModifiers,
        ),
      };
      this.originalEvents = keyCodes;
    } else {
      const keyCode = getKeyWithAlias<FromAndToKeyCode>(keyCodeAlias);
      this.fromEvent = {
        key_code: keyCode,
        modifiers: parseFromModifierParams(
          mandatoryModifiers,
          optionalModifiers,
        ),
      };
      this.originalEvents = [
        {
          key_code: keyCode,
          modifiers: parseModifierParam(mandatoryModifiers),
        },
      ];
    }
    return this;
  }

  /**
   * Sets the mod-tap key to be permissive or non-permissive.
   *
   * A permissive mod-tap key activates the modifier as soon as another key is pressed.
   * A non-permissive mod-tap key requires the tapping term to pass before activating.
   */
  public permissive(val: boolean): this {
    this.isPermissive = val;
    return this;
  }

  public modifiers(modifiers: ToEvent): this {
    this.mods = modifiers;
    return this;
  }

  /**
   * Sets the tapping term in milliseconds.
   *
   * The tapping term is the time in milliseconds that the key must be held
   * down in order to be fully active for non-permissive mod-tap keys.
   */
  public tappingTerm(tappingTermMs: number): this {
    this.tappingTermMs = tappingTermMs;
    return this;
  }

  private copyAndAddHaltToFirstToEvent(
    toEvents: Array<ToEvent>,
  ): Array<ToEvent> {
    if (toEvents.length === 0) {
      return [];
    }
    const firstEvent = toEvents[0];
    return [
      {
        ...firstEvent,
        halt: true,
      },
      ...toEvents.slice(1),
    ];
  }
}

export function modTap(): ModTapBuilder {
  return new ModTapBuilder();
}
