import { capsWord } from "../src/caps-word";

describe("CapsWordBuilder.escapePassthroughKey", () => {
  it("should add an escape passthrough key manipulator", () => {
    // The build method adds default escape keys, so we need to filter them out
    const rule = capsWord()
      .defaultEscapeKeys(false)
      .escapePassthroughKey("a")
      .build();
    const manipulator = rule.manipulators[0];

    expect(manipulator).toEqual({
      type: "basic",
      from: { key_code: "a" },
      to: [{ set_variable: { name: "caps-word", type: "unset" } }],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });
  });

  it("should handle modifiers", () => {
    const rule = capsWord()
      .defaultEscapeKeys(false)
      .escapePassthroughKey("b", "⌘", "any")
      .build();
    const manipulator = rule.manipulators[0];

    expect(manipulator).toEqual({
      type: "basic",
      from: {
        key_code: "b",
        modifiers: { mandatory: ["command"], optional: ["any"] },
      },
      to: [{ set_variable: { name: "caps-word", type: "unset" } }],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });
  });
});
