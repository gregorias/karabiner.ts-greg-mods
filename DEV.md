# 🛠️ Developer documentation

This is the documentation file for developers.

## Dev environment setup

This section describes how to setup your development environment.

1. Install Lefthook:

    ```shell
    lefthook install
    ```

1. Initialize NPM:

    ```shell
    npm install
    ```

## Implementation

This diagram describes the high-level state transitions for a
permissive hold manipulator within a mod-tap layer.

```mermaid
---
title: Permissive hold with mod-tap
---
stateDiagram-v2
    direction TB

    [*] --> Idle : System Start

    state "Idle" as Idle
    Idle --> Deciding: layer ↓

    state "Deciding" as Deciding
    note right of Deciding
      [layer key,
       start = 1,
       replay = 1]
    end note
    Deciding --> TwoKeyPress: other ↓
    Deciding --> Hold: layer ⇓
    Deciding --> Idle: layer ↑

    state "Hold" as Hold
    note right of Hold
      [layer-key,
       start = 0,
       replay = 1]
    end note
    Hold --> Hold: any ↓ (→ mod-↓)
    Hold --> Idle: layer ↑

    state "Two Keys Pressed" as TwoKeyPress
    %% TODO: I think we should unset start in code.
    TwoKeyPress --> Hold: other ↑ (→ mod-other)
    TwoKeyPress --> Idle: l↑o↑ (→ replay)
```
