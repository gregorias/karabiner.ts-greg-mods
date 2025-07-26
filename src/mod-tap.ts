// Mod-tap is an implementation of mod-tap behavior.
//
// A mod-tap key can work in two modes:
//
// - Non-permissive requires waiting for the tapping term to pass before activating the modifier.
// - Permissive activates the modifier as soon as another key is pressed.
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
} from "karabiner.ts"

export class ModTapBuilder {
  private fromEvent!: FromEvent;
  private originalEvents: Array<ToEvent> = [];
  private isPermissive: boolean = false;
  private mods!: ToEvent;
  private timeout?: number;

  constructor() {
  }

  private copyAndAddHaltToFirstToEvent(toEvents: Array<ToEvent>): Array<ToEvent> {
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

  public build(): Array<BasicManipulator> {
    let cancelledAction = this.isPermissive ? this.mods : this.originalEvents;
    return map(this.fromEvent)
      .toIfAlone(this.copyAndAddHaltToFirstToEvent(this.originalEvents))
      .toIfHeldDown(this.mods)
      .toDelayedAction([], cancelledAction)
      .parameters({
        "basic.to_if_held_down_threshold_milliseconds": this.timeout,
      })
      .build();
  }

  public from(keyCodeAlias: FromAndToKeyCode | KeyAlias | Array<FromAndToKeyCode | KeyAlias>,
    mandatoryModifiers?: FromModifierParam & ModifierParam,
    optionalModifiers?: FromModifierParam): this {
    if (Array.isArray(keyCodeAlias)) {
      const keyCodes = keyCodeAlias.map(
        function(keyCodeAlias) {
          return { key_code: getKeyWithAlias<FromAndToKeyCode>(keyCodeAlias) };
        })
      this.fromEvent = {
        simultaneous: keyCodes,
        simultaneous_options: { key_down_order: "strict" },
        modifiers: parseFromModifierParams(mandatoryModifiers, optionalModifiers) };
      this.originalEvents = keyCodes;
    } else {
      const keyCode = getKeyWithAlias<FromAndToKeyCode>(keyCodeAlias)
      this.fromEvent = { key_code: keyCode, modifiers: parseFromModifierParams(mandatoryModifiers, optionalModifiers) };
      this.originalEvents = [{ key_code: keyCode, modifiers: parseModifierParam(mandatoryModifiers) }];
    }
    return this;
  }

  public permissive(val: boolean): this {
    this.isPermissive = val
    return this
  }

  public modifiers(modifiers: ToEvent): this {
    this.mods = modifiers;
    this.mods.halt = true;
    return this;
  }

  public heldTimeout(timeout: number): this {
    this.timeout = timeout;
    return this;
  }
}

export function modTap(): ModTapBuilder {
  return new ModTapBuilder();
}
