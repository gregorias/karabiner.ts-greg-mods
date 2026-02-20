# ⌨️ Greg’s Karabiner.ts Mods

This TS package contains [Karabiner.ts][karabiner.ts] recipes for QMK-like
layers (namely:
hold-tap and mod-tap) with powerful QMK features:
[permissive-hold][permissive-hold], chordal hold, and hold on key press.
This package builds upon these layers to provide the first turn-key solution for
[home row mods](#home-row-mods) that works almost like on a QMK keyboard, i.e.,
it’s good.

Additional features:

- [Caps WORD](#caps-word)

## 🔧 Home row mods tutorial

This section provides a step-by-step guide to installing home row mods on your
mac.
I wrote it, so that it can be followed even if you are not a tech person.
You need to have basic familiarity with the command-line and have
[node](https://formulae.brew.sh/formula/node) and
[gh](https://formulae.brew.sh/formula/gh) installed.

1. [Install Karabiner.](https://karabiner-elements.pqrs.org/docs/getting-started/installation/)
2. [Install Karabiner.ts.](https://github.com/evan-liu/karabiner.ts?tab=readme-ov-file#using-nodejs)
   1. Open a terminal and in your home directory run `npx
      create-karabiner-config@latest`.
      This will create a `karabiner-config` directory.
3. Plug in Greg Mods to your `karabiner-config`.
   1. Change directory to `karabiner-config`.
   2. Add `karabiner.ts-greg-mods` to `package.json`:

      ```json
      {
        "name": "karabiner-config",
        "description": "karabiner config in karabiner.ts",
        "scripts": {
          "build": "tsx src/index.ts",
          "update": "npm update karabiner.ts"
        },
        "devDependencies": {
          "@types/node": "^20",
          "karabiner.ts": "latest",
          "karabiner.ts-greg-mods": "latest",
          "tsx": "^4",
          "typescript": "^5"
        }
      }
      ```

   3. Run `npm install`.

4. Configure HRM by adding them to the Karabiner.ts config in `src/index.ts`:

   ```typescript
   import { rule, writeToProfile } from "karabiner.ts";
   import { hrm } from "karabiner.ts-greg-mods";

   writeToProfile("Default profile", [
     rule("Home row mods").manipulators(
       hrm(
         new Map([
           ["a", "l⌃"],
           ["s", "l⌘"],
           ["d", "l⇧"],
           ["f", "l⌥"],
           ["k", "r⇧"],
           ["l", "r⌘"],
           [";", "r⌃"]
         ])
       ).build()
     )
   ]);
   ```

5. Install the new Karabiner.ts config in Karabiner with `npm run build`.

## 📦 Installation

### From source

1. Clone the repository next to your Karabiner.ts project:
   `gh repo clone gregorias/karabiner.ts-greg-mods`.
2. Install and build the repository with `npm install` and `npm run build`.
3. Add the repository as a dependency to your K.ts project (`package.json`):
   `"karabiner.ts-greg-mods":
   "file:../karabiner.ts-greg-mods",`.

### From NPM

1. Add the dependency with `npm install karabiner.ts-greg-mods`.
2. Import the mods in your `karabiner.ts` config:

   ```typescript
   import { hrm } from "karabiner.ts-greg-mods";
   ```

## Configuration

> [!WARNING]
> If your hold-tap keys lose character during fast typing with rolls, increase
> `to_if_held_down_threshold_milliseconds` (400 should be large enough).
> You may be witnessing
> [a bug in Karabiner](https://github.com/pqrs-org/Karabiner-Elements/issues/4407).

## 🚀 Usage

### Hold-tap layer

The hold-tap layer is a modified K.ts layer that mimics QMK hold-tap behavior.
In addition to the default, hold-on-key-press decision mode, you can also use
permissive-hold and the slow-mode (wait for the tapping term to elapse).

If you don’t activate the hold, e.g., you quickly roll over two keys during
writing, this layer replays the layer and the other key.
With this layer, you don’t lose your keystrokes during simple roll overs.

#### Example hold-tap configuration

```typescript
// A symbols layer activated with ␣.
let symbolsLayer: Rule = holdTapLayer("␣")
  // Allow having ⇧ and ⇪ on for the layer key.
  .optionalModifiers(["⇧", "⇪"])
  // Use permissive-hold logic for actuating the following manipulators.
  // I don’t want to activate the layer just when I quickly roll over with
  // a ␣.
  .permissiveHoldManipulators(
    // …
    // Some manipulators that trigger with any modifier, but transform
    // to the function key on ⇧.
    map("m", ["⇧"]).to("f1"),
    map("m", [], "any").to("1"),
    map(",", ["⇧"]).to("f2"),
    map(",", [], "any").to("2"),
    map(".", ["⇧"]).to("f3"),
    map(".", [], "any").to("3")
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
  // Trigger the sub-layer on press and hold.
  .holdOnOtherKeyPressManipulators([
    // Necessary: https://github.com/evan-liu/karabiner.ts/issues/171.
    map("l⇧").to(toSetVar("shift-mode", 1))
             .toAfterKeyUp(toSetVar("shift-mode", 0)),
    map("k")
      .to(toSetVar("shift-mode", 1))
      .toAfterKeyUp(toSetVar("shift-mode", 0)),
      // If we just rolled over the keys, replay them.
      .toIfAlone("␣")
      .toIfAlone("k")
  ])
  .permissiveHoldManipulators(
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
If you don’t want to lose the layer key during writing, you need to define any
keys it might roll over with either as a manipulator or as an echo key.
I just provide a list of all keys on my keyboard as echo keys.

Permissive-hold manipulators don’t work well with triple key roll over.

### Mod-tap

A `mod-tap` key is a dual-function key that acts as a normal key when tapped but
becomes a modifier when held down.
The `modTap` mod turns a key into a mod-tap key.

The `mod-tap` builder supports two main modes:

- **Non-permissive**:
  The modifier is only activated after the `tappingTerm` has elapsed.
  This is safer against accidental triggers during fast typing but can feel less
  responsive.
- **Permissive**:
  The modifier is activated as soon as another key is pressed, making it feel
  more immediate.
  However, this can sometimes lead to unintended modifier activation during
  quick key rolls.

This recipe lets you set up bare-bones HRM with modifier chaining.
It’s further described
[in my blog post](https://gregorias.github.io/posts/home-row-mods-karabiner-elements/).

#### Example mod-tap configuration

```typescript
const simpleHrm: BasicManipulator[] = [
  ...modTap().from(["a", "s"]).modifiers(toKey("l⌃", "l⌘")).build(),
  ...modTap().from(["s", "a"]).modifiers(toKey("l⌃", "l⌘")).build(),
  ...modTap().from("a").modifiers(toKey("l⌃")).build(),
  ...modTap().from("s").modifiers(toKey("l⌘")).build()
];
```

### Home row mods

`hrm` is a turn-key solution for configuring home row mods that utilizes the
features of [the hold-tap layer](#hold-tap-layer).
It provides quite snappy experience as it is responsive with permissive-hold and
chordal-hold strategies (both optional) while also not losing keys during
accidental roll overs (mostly).

#### Example HRM configuration

```typescript
const leftHandKeys = ["q" /*…*/, , "b"];
const rightHandKeys = ["y" /*…*/, , "/"];
let hrmRule: Manipulator[] = hrm(
  new Map([
    ["a", "l⌃"],
    ["s", "l⌘"],
    ["d", "l⇧"],
    ["f", "l⌥"],
    ["j", "r⇧"],
    ["k", "r⇧"],
    ["l", "r⌘"],
    [";", "r⌃"]
  ])
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
  .simultaneousThreshold(90)
  .tappingTerm(110)
  .build();
```

#### HRM limitations

- Same limitations as in the hold-tap layer.
- You can’t chain modifiers, e.g., you can’t press and hold l⌃ and then press
  and hold l⌘.
  You must press two modifiers simultaneously to have them available.
- Key replaying doesn’t work with modified keys.
  It is technically feasible, but I figured that such a capability is not worth
  additional rules.

### Caps WORD

[Caps WORD reference at QMK.](https://docs.qmk.fm/features/caps_word)

#### Caps WORD example configuration

```typescript
let capsWordRule: Rule = capsWord()
  .toggle(map("c", "Hyper").build()[0]) // ✦+C
  .build();

// Also deactivate Caps WORD with ␣ in the symbols layer and other keys in
// there.
let symbolsLayer = holdTapLayer("␣")
  .allowAnyModifiers()
  .onAlone(disableCapsWordEvents)
  .permissiveHoldManipulators(
    map("s", [], ["⇪"]).to("[").to(disableCapsWordEvents),
    map("x", [], ["⇪"]).to("]").to(disableCapsWordEvents)
  );
// …
```

#### Caps WORD limitations

- Caps WORD turns-on ⇪ when active.
  Your other manipulators should take that into account.

## 🔗 See also

- [How to simulate QMK home row mods in karabiner? (Karabiner#3559)](https://github.com/pqrs-org/Karabiner-Elements/issues/3559)
  — A feature request for Karabiner to enable HRM-capabilities.

[karabiner.ts]: https://karabiner.ts.evanliu.dev/
[permissive-hold]: https://docs.qmk.fm/tap_hold#:~:text=The%20%E2%80%9Cpermissive%20hold%E2%80%9D%20mode,select%20the%20tap%20action.
