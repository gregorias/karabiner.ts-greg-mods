# ⌨️ Greg’s Karabiner.ts Mods

This TS package contains [Karabiner.ts][karabiner.ts] recipes for QMK-like
layers (hold-tap, mod-tap) with powerful features
([permissive-hold][permissive-hold], chordal hold, hold on key press).
This package builds upon these layers to provide the first turn-key solution
for home row mods that doesn’t suck.

## 📦 Installation

TODO: Instructions from working with the source.

## 🚀 Usage

### Hold-tap layer

The hold-tap layer is a modified K.ts layer that mimics QMK hold-tap behavior.
In addition to the default, hold-on-key-press decision mode, you can also use
permissive-hold and the slow-mode (wait for the tapping term to elapse).

If you don’t activate the hold, e.g., you quickly roll over two keys during
writing. This layer replays the layer and the other key, so you no longer
lose your keystrokes accidentally.

```typescript
// A symbols layer activated with ␣.
let symbolsBisLayer: Rule = holdTapLayer("␣")
  // Allow having ⇧ and ⇪ on.
  .optionalModifiers(["⇧", "⇪"])
  // Use permissive-hold logic for actuating the following manipulators.
  // I don’t want to activate the layer just when I quickly roll over with
  // a ␣.
  .permissiveHoldManipulators(
    // …
    map("m").to("1"),
    map(",").to("2"),
    map(".").to("3"),
    // ...
  )
  // I don’t roll over on these keys, so use the more aggressive strategy.
  .holdOnOtherKeyPressManipulators([
    map("[").to("-"),
    map("]").to("="),
  ])
  // For any key not defined above, we’ll replay them.
  // If we don’t define a key in manipulators or echo keys, they get lost.
  .echoKeys(...allKeys)
  // How long to wait before activating the manipulators for certain.
  // Important for permissive-hold and slow manipulators.
  .tappingTerm(120 /*ms*/)
  .description("Symbols layer")
```

You can define sub-layers like so:

```typescript
  .permissiveHoldManipulators(
    // Necessary: https://github.com/evan-liu/karabiner.ts/issues/171.
    map("l⇧").to(toSetVar("shift-mode", 1)).toAfterKeyUp(toSetVar("shift-mode", 0)),
    ...withCondition(ifVar("shift-mode"))([
      // …
      map("m").to("!"),
      map(",").to("@"),
      map(".").to("# ),
      // …
    ]) as BasicManipulator[],
    // …
    map("m").to("1"),
    // …
```

#### Limitations

The ability to replay keys doesn’t come for free.
If you don’t want to lose the layer key during writing,
you need to define any keys it might roll over with either as a manipulator or
as an echo key. I just provide a list of all keys on my keyboard as echo keys.

### Home row mods

TODO: Describe HRM

[karabiner.ts]: https://karabiner.ts.evanliu.dev/
[permissive-hold]: https://docs.qmk.fm/tap_hold#:~:text=The%20%E2%80%9Cpermissive%20hold%E2%80%9D%20mode,select%20the%20tap%20action.
