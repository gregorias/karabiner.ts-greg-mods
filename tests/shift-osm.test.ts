import { shiftOsm, shiftOsmVarName } from "../src/shift-osm";
import {
  BasicManipulator,
  FromEvent,
  ifVar,
  toSetVar,
  toUnsetVar,
} from "karabiner.ts";
import { layerVarName } from "../src/karabiner-extra";

function fromHasKeyCode(from: FromEvent): from is { key_code: any } {
  return "key_code" in from;
}

describe("shiftOsm", () => {
  it("should create a basic shift OSM layer", () => {
    const rule = shiftOsm().build();
    expect(rule.description).toBe("⇧ OSM");
    // 26 letters + 10 numbers + 18 non-letters + 2 toggles
    expect(rule.manipulators).toHaveLength(56);
  });

  it("should set a custom description", () => {
    const rule = shiftOsm().description("My Shift OSM").build();
    expect(rule.description).toBe("My Shift OSM");
  });

  it("should create a shifted key manipulator for a letter", () => {
    const rule = shiftOsm().build();
    const manipulator = rule.manipulators.find((m) => {
      const from = (m as BasicManipulator).from;
      return from && fromHasKeyCode(from) && from.key_code === "a";
    }) as BasicManipulator;
    expect(manipulator).toBeDefined();
    expect(manipulator.from).toEqual({
      key_code: "a",
      modifiers: { optional: ["any"] },
    });
    expect(manipulator.to).toEqual([
      { key_code: "a", modifiers: ["left_shift"] },
      toUnsetVar(shiftOsmVarName()),
    ]);
    expect(manipulator.conditions).toEqual([
      { type: "variable_if", name: shiftOsmVarName(), value: 1 },
    ]);
  });

  it("should create a shifted key manipulator for a number", () => {
    const rule = shiftOsm().build();
    const manipulator = rule.manipulators.find((m) => {
      const from = (m as BasicManipulator).from;
      return from && fromHasKeyCode(from) && from.key_code === "1";
    }) as BasicManipulator;
    expect(manipulator).toBeDefined();
    expect(manipulator.from).toEqual({
      key_code: "1",
      modifiers: { optional: ["any"] },
    });
    expect(manipulator.to).toEqual([
      { key_code: "1", modifiers: ["left_shift"] },
      toUnsetVar(shiftOsmVarName()),
    ]);
    expect(manipulator.conditions).toEqual([
      { type: "variable_if", name: shiftOsmVarName(), value: 1 },
    ]);
  });

  it("should create toggle manipulators for shift keys", () => {
    const rule = shiftOsm().build();
    const leftShiftManipulator = rule.manipulators.find((m) => {
      const from = (m as BasicManipulator).from;
      return from && fromHasKeyCode(from) && from.key_code === "left_shift";
    }) as BasicManipulator;
    const rightShiftManipulator = rule.manipulators.find((m) => {
      const from = (m as BasicManipulator).from;
      return from && fromHasKeyCode(from) && from.key_code === "right_shift";
    }) as BasicManipulator;

    expect(leftShiftManipulator).toBeDefined();
    expect(rightShiftManipulator).toBeDefined();

    const ifOsm = ifVar(shiftOsmVarName());
    const unlessOsm = ifOsm.unless();
    const setOsm = toSetVar(shiftOsmVarName(), 1);
    const unsetOsm = toSetVar(shiftOsmVarName(), 0);

    expect(leftShiftManipulator.from).toEqual({
      key_code: "left_shift",
      modifiers: { optional: ["any"] },
    });
    expect(leftShiftManipulator.to).toEqual([{ key_code: "left_shift" }]);
    expect(leftShiftManipulator.to_if_alone).toEqual([
      { ...setOsm, conditions: [unlessOsm.build()] },
      { ...unsetOsm, conditions: [ifOsm.build()] },
    ]);
    expect(leftShiftManipulator.conditions).toEqual([
      { name: layerVarName, type: "variable_unless", value: 1 },
    ]);

    expect(rightShiftManipulator.from).toEqual({
      key_code: "right_shift",
      modifiers: { optional: ["any"] },
    });
    expect(rightShiftManipulator.to).toEqual([{ key_code: "right_shift" }]);
    expect(rightShiftManipulator.to_if_alone).toEqual([
      { ...setOsm, conditions: [unlessOsm.build()] },
      { ...unsetOsm, conditions: [ifOsm.build()] },
    ]);
    expect(rightShiftManipulator.conditions).toEqual([
      { name: layerVarName, type: "variable_unless", value: 1 },
    ]);
  });
});
