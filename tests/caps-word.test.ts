import { capsWord } from "../src/caps-word";
import { BasicManipulator, map } from "karabiner.ts";

describe("CapsWordBuilder.toggle", () => {
  it("should add a toggle manipulator", () => {
    const rule = capsWord()
      .defaultEscapeKeys(false)
      .toggle(map("a").build()[0])
      .build();

    expect(rule.manipulators).toHaveLength(3);

    const [m1, m2, m3] = rule.manipulators as BasicManipulator[];

    expect(m1).toEqual({
      type: "basic",
      from: { key_code: "a", modifiers: { mandatory: ["caps_lock"] } },
      to: [
        { key_code: "caps_lock", hold_down_milliseconds: 100 },
        { set_variable: { name: "caps-word", type: "unset" } },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });

    expect(m2).toEqual({
      type: "basic",
      from: { key_code: "a", modifiers: { mandatory: ["caps_lock"] } },
      to: [{ set_variable: { name: "caps-word", value: 1 } }],
    });

    expect(m3).toEqual({
      type: "basic",
      from: { key_code: "a" },
      to: [
        { key_code: "caps_lock", hold_down_milliseconds: 100 },
        { set_variable: { name: "caps-word", value: 1 } },
      ],
    });
  });
});

describe("CapsWordBuilder.escapeKey", () => {
  it("should add an escape key manipulator", () => {
    const rule = capsWord().defaultEscapeKeys(false).escapeKey("a").build();

    expect(rule.manipulators).toHaveLength(2);

    const [m1, m2] = rule.manipulators as BasicManipulator[];

    expect(m1).toEqual({
      type: "basic",
      from: { key_code: "a", modifiers: { mandatory: ["caps_lock"] } },
      to: [
        { key_code: "caps_lock", hold_down_milliseconds: 100 },
        { set_variable: { name: "caps-word", type: "unset" } },
        { key_code: "a" },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });

    expect(m2).toEqual({
      type: "basic",
      from: { key_code: "a" },
      to: [
        { set_variable: { name: "caps-word", type: "unset" } },
        { key_code: "a" },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });
  });

  it("should handle modifiers", () => {
    const rule = capsWord()
      .defaultEscapeKeys(false)
      .escapeKey("b", "⌘", "any")
      .build();

    expect(rule.manipulators).toHaveLength(2);
    const [m1, m2] = rule.manipulators as BasicManipulator[];

    expect(m1).toEqual({
      type: "basic",
      from: {
        key_code: "b",
        modifiers: {
          mandatory: expect.arrayContaining(["command", "caps_lock"]),
          optional: ["any"],
        },
      },
      to: [
        { key_code: "caps_lock", hold_down_milliseconds: 100 },
        { set_variable: { name: "caps-word", type: "unset" } },
        { key_code: "b", modifiers: ["command"] },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });
    if (!m1.from || !("key_code" in m1.from) || !m1.from.modifiers) {
      fail("m1.from is not as expected");
    }
    expect(m1.from.modifiers.mandatory).toHaveLength(2);

    expect(m2).toEqual({
      type: "basic",
      from: {
        key_code: "b",
        modifiers: { mandatory: ["command"], optional: ["any"] },
      },
      to: [
        { set_variable: { name: "caps-word", type: "unset" } },
        { key_code: "b", modifiers: ["command"] },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });
  });
});

describe("CapsWordBuilder.escapePassthroughKey", () => {
  it("should add an escape passthrough key manipulator", () => {
    // The build method adds default escape keys, so we need to filter them out
    const rule = capsWord()
      .defaultEscapeKeys(false)
      .escapePassthroughKey("a")
      .build();

    expect(rule.manipulators).toHaveLength(2);
    const [m1, m2] = rule.manipulators as BasicManipulator[];

    expect(m1).toEqual({
      type: "basic",
      from: { key_code: "a", modifiers: { mandatory: ["caps_lock"] } },
      to: [
        { key_code: "caps_lock", hold_down_milliseconds: 100 },
        { set_variable: { name: "caps-word", type: "unset" } },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });

    expect(m2).toEqual({
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

    expect(rule.manipulators).toHaveLength(2);
    const [m1, m2] = rule.manipulators as BasicManipulator[];

    expect(m1).toEqual({
      type: "basic",
      from: {
        key_code: "b",
        modifiers: {
          mandatory: expect.arrayContaining(["command", "caps_lock"]),
          optional: ["any"],
        },
      },
      to: [
        { key_code: "caps_lock", hold_down_milliseconds: 100 },
        { set_variable: { name: "caps-word", type: "unset" } },
      ],
      conditions: [{ type: "variable_if", name: "caps-word", value: 1 }],
    });
    if (!m1.from || !("key_code" in m1.from) || !m1.from.modifiers) {
      fail("m1.from is not as expected");
    }
    expect(m1.from.modifiers.mandatory).toHaveLength(2);

    expect(m2).toEqual({
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
