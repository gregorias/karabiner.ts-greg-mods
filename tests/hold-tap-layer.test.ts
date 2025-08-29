import { holdTapLayer, SlowManipulator } from "../src/hold-tap-layer";
import { ifVar, map } from "karabiner.ts";

describe("holdTapLayer", () => {
  it("should create a basic hold-tap layer", () => {
    const rule = holdTapLayer("a").description("Test Layer").build();
    expect(rule.description).toBe("Test Layer");
    expect(rule.manipulators).toHaveLength(1);
    const manipulator = rule.manipulators[0] as any;
    expect(manipulator.from).toEqual({ key_code: "a" });
    expect(manipulator.to).toEqual(
      expect.arrayContaining([
        { set_variable: { name: "layer-a-start", value: 1 } },
      ]),
    );
    expect(manipulator.to_if_held_down).toEqual([
      {
        set_variable: {
          name: "layer-a-start",
          value: 0,
        },
      },
    ]);
    expect(manipulator.to_after_key_up).toEqual(
      expect.arrayContaining([
        { set_variable: { name: "layer-a-start", value: 0 } },
      ]),
    );
  });

  it("should set a tapping term", () => {
    const rule = holdTapLayer("a").tappingTerm(200).build();
    const manipulator = rule.manipulators[0] as any;
    expect(manipulator.parameters).toEqual({
      "basic.to_if_held_down_threshold_milliseconds": 200,
    });
  });

  it("should set optional modifiers", () => {
    const rule = holdTapLayer("a")
      .optionalModifiers(["shift", "control"])
      .build();
    const manipulator = rule.manipulators[0] as any;
    expect(manipulator.from.modifiers).toEqual({
      optional: ["shift", "control"],
    });
  });

  it("should add an onHold event", () => {
    const rule = holdTapLayer("a").onHold("b").build();
    const manipulator = rule.manipulators[0] as any;
    // Using arrayContaining because the order of to_if_held_down is not guaranteed.
    expect(manipulator.to_if_held_down).toEqual(
      expect.arrayContaining([
        { set_variable: { name: "layer-a-start", value: 0 } },
        { key_code: "b" },
      ]),
    );
  });

  it("should add a holdOnOtherKeyPressManipulator", () => {
    const rule = holdTapLayer("a")
      .holdOnOtherKeyPressManipulator(map("b").to("c"))
      .build();
    expect(rule.manipulators).toHaveLength(2);
    const manipulator = rule.manipulators[1] as any;
    expect(manipulator.from).toEqual({ key_code: "b" });
    expect(manipulator.to).toEqual([{ key_code: "c" }]);
    expect(manipulator.conditions).toEqual([
      { type: "variable_if", name: "layer-a", value: 1 },
    ]);
  });

  it("should add an echoKey", () => {
    const rule = holdTapLayer("a").echoKey("b").build();
    expect(rule.manipulators).toHaveLength(2);
    const manipulator = rule.manipulators[1] as any;
    expect(manipulator.from).toEqual({ key_code: "b" });
    expect(manipulator.to).toEqual([
      { set_variable: { name: "layer-a-start", value: 0 } },
      { key_code: "a" },
      { key_code: "b" },
    ]);
    expect(manipulator.conditions).toEqual(
      expect.arrayContaining([
        { type: "variable_if", name: "layer-a", value: 1 },
        { type: "variable_if", name: "layer-a-start", value: 1 },
      ]),
    );
  });

  it("should add a slowManipulator", () => {
    const rule = holdTapLayer("a")
      .slowManipulator(map("b").to("c").build()[0] as SlowManipulator)
      .build();
    expect(rule.manipulators).toHaveLength(3); // config, unless, if

    const unlessManipulator = rule.manipulators[1] as any;
    expect(unlessManipulator.conditions).toEqual(
      expect.arrayContaining([
        { type: "variable_if", name: "layer-a", value: 1 },
        { type: "variable_unless", name: "layer-a-start", value: 1 },
      ]),
    );
    expect(unlessManipulator.from).toEqual({ key_code: "b" });
    expect(unlessManipulator.to).toEqual([{ key_code: "c" }]);

    const ifManipulator = rule.manipulators[2] as any;
    expect(ifManipulator.conditions).toEqual(
      expect.arrayContaining([
        { type: "variable_if", name: "layer-a", value: 1 },
        { type: "variable_if", name: "layer-a-start", value: 1 },
      ]),
    );
    expect(ifManipulator.from).toEqual({ key_code: "b" });
    expect(ifManipulator.to).toEqual([
      { key_code: "a" },
      { key_code: "b" },
      { set_variable: { name: "layer-a-start", value: 0 } },
    ]);
  });

  it("should add a permissiveHoldManipulator", () => {
    const rule = holdTapLayer("a")
      .permissiveHoldManipulator(map("b").to("c"))
      .build();
    expect(rule.manipulators).toHaveLength(3); // config, unless, if

    const unlessManipulator = rule.manipulators[1] as any;
    expect(unlessManipulator.conditions).toEqual(
      expect.arrayContaining([
        { type: "variable_if", name: "layer-a", value: 1 },
        { type: "variable_unless", name: "layer-a-start", value: 1 },
      ]),
    );
    expect(unlessManipulator.from).toEqual({ key_code: "b" });
    expect(unlessManipulator.to).toEqual([{ key_code: "c" }]);

    const ifManipulator = rule.manipulators[2] as any;
    expect(ifManipulator.conditions).toEqual(
      expect.arrayContaining([
        { type: "variable_if", name: "layer-a", value: 1 },
        { type: "variable_if", name: "layer-a-start", value: 1 },
      ]),
    );
    expect(ifManipulator.from).toEqual({ key_code: "b" });
    expect(ifManipulator.to).toBeUndefined();
    expect(ifManipulator.to_delayed_action).toEqual({
      to_if_invoked: [],
      to_if_canceled: [
        {
          conditions: [
            { type: "variable_unless", name: "layer-a", value: 1 },
            { type: "variable_if", name: "layer-a-replay", value: 1 },
          ],
          key_code: "a",
        },
        {
          conditions: [
            { type: "variable_unless", name: "layer-a", value: 1 },
            { type: "variable_if", name: "layer-a-replay", value: 1 },
          ],
          set_variable: { name: "layer-a-replay", value: 0 },
        },
        {
          conditions: [{ type: "variable_unless", name: "layer-a", value: 1 }],
          key_code: "b",
          halt: true,
        },
      ],
    });
    expect(ifManipulator.to_after_key_up).toEqual([
      {
        conditions: [{ type: "variable_if", name: "layer-a", value: 1 }],
        key_code: "c",
      },
      {
        conditions: [
          { type: "variable_unless", name: "layer-a", value: 1 },
          { type: "variable_if", name: "layer-a-replay", value: 1 },
        ],
        key_code: "a",
      },
      {
        conditions: [
          { type: "variable_unless", name: "layer-a", value: 1 },
          { type: "variable_if", name: "layer-a-replay", value: 1 },
        ],
        set_variable: { name: "layer-a-replay", value: 0 },
      },
      {
        conditions: [{ type: "variable_unless", name: "layer-a", value: 1 }],
        key_code: "b",
      },
      {
        set_variable: { name: "layer-a-start", value: 0 },
        halt: true,
      },
    ]);
  });

  it("should add rule-wide conditions", () => {
    const condition = ifVar("test_condition", 1);
    const rule = holdTapLayer("a")
      .condition(condition)
      .holdOnOtherKeyPressManipulator(map("b").to("c"))
      .build();

    expect(rule.manipulators).toHaveLength(2);

    const [configManipulator, bManipulator] = rule.manipulators as any[];

    expect(configManipulator.conditions).toEqual(
      expect.arrayContaining([condition.build()]),
    );

    expect(bManipulator.conditions).toEqual(
      expect.arrayContaining([
        condition.build(),
        { type: "variable_if", name: "layer-a", value: 1 },
      ]),
    );
    expect(bManipulator.conditions).toHaveLength(2);
  });
});
