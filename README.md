# ⌨️ Greg’s Karabiner.ts Mods

This TS package contains [Karabiner.ts][karabiner.ts] recipes for QMK-like
layers (namely: hold-tap and mod-tap) with powerful QMK features:
[permissive-hold][permissive-hold], chordal hold, and hold on key press.
This package builds upon these layers to provide the first turn-key solution
for home row mods that works almost like on a QMK keyboard, i.e., it’s good.

## 📦 Installation

### From source

1. Clone the repository next to your Karabiner.ts project:
   `gh repo clone gregorias/karabiner.ts-greg-mods`.
2. Install and build the repository with `npm install` and `npm run build`.
3. Add the repository as a dependency to your K.ts project (`package.json`):
   `"karabiner.ts-greg-mods": "file:../karabiner.ts-greg-mods",`.

### From NPM

TODO

## 🚀 Usage

### Hold-tap layer

The hold-tap layer is a modified K.ts layer that mimics QMK hold-tap behavior.
In addition to the default, hold-on-key-press decision mode, you can also use
permissive-hold and the slow-mode (wait for the tapping term to elapse).

If you don’t activate the hold, e.g., you quickly roll over two keys during
writing, this layer replays the layer and the other key.
With this layer, you don’t lose your keystrokes during simple roll overs.

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
    map(".").to("3")
    // ...
  )
  // I don’t roll over on these keys, so use the more aggressive strategy.
  .holdOnOtherKeyPressManipulators([map("[").to("-"), map("]").to("=")])
  // For any key not defined above, we’ll replay them.
  // If we don’t define a key in manipulators or echo keys, they get lost.
  .echoKeys(...allKeys)
  // How long to wait before activating the manipulators for certain.
  // Important for permissive-hold and slow manipulators.
  .tappingTerm(120 /*ms*/)
  .description("Symbols layer");
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

#### Hold-tap limitations

The ability to replay keys doesn’t come for free.
If you don’t want to lose the layer key during writing,
you need to define any keys it might roll over with either as a manipulator or
as an echo key. I just provide a list of all keys on my keyboard as echo keys.

### Home row mods

`hrm` is turn-key solution for configuring home row mods that utilizes
the features of the hold-tap layer. It provides quite snappy experience as
it provides responsiveness with permissive-hold and chordal-hold strategies
(both optional) while also not losing keys during accidental roll overs (mostly).

```typescript
const leftHandKeys = ["q" /*…*/, , "b"];
const rightHandKeys = ["y" /*…*/, , "/"];
let hrmRule: Manipulator[] = hrm(
  new Map([
    ["a", "l⌃"],
    ["s", "l⌘"],
    ["d", "l⇧"],
    ["f", "l⌥"],
    ["p", "r⇧"],
    ["k", "r⇧"],
    ["l", "r⌘"],
    [";", "r⌃"]
  ]),
  new HrmKeyboardLayout(leftHandKeys, rightHandKeys)
)
  .lazy(true)
  .holdTapStrategy("permissive-hold")
  .chordalHold(true)
  // Some overrides for modded keys:
  .smartManipulators(
    "l⌃",
    map("h").to("⌫"),
    // In Chrome, L⌃ + I/O navigate history.
    map("i").to("→", "l⌘").condition(ifApp("Chrome")),
    map("o").to("←", "l⌘").condition(ifApp("Chrome")),
    // L⌃ + N/P navigate dropdowns.
    map("n").to("↓").condition(unlessKitty),
    map("p").to("↑").condition(unlessKitty)
  )
  .smartManipulators(
    "⌃",
    // ⌃W deletes a word.
    map("w").to("⌫", "l⌥").condition(unlessKitty)
  )
  .smartManipulators("l⌥", ...commaPeriodMoveChromeTabs)
  // I press this combo a lot nad it’s hard to roll over it, so use a more
  // responsive strategy.
  .keys("l⌥", ["w", "q"], "hold-on-other-key-press")
  .build();
```

#### HRM limitations

- Same limitations as in the hold-tap layer.
- You can’t chain modifiers, e.g., you can’t press and hold l⌃ and then press
  and hold l⌘. You must press two modifiers simultaneously to have them
  available.

[karabiner.ts]: https://karabiner.ts.evanliu.dev/
[permissive-hold]: https://docs.qmk.fm/tap_hold#:~:text=The%20%E2%80%9Cpermissive%20hold%E2%80%9D%20mode,select%20the%20tap%20action.
