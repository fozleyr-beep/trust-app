import { describe, expect, it } from "vitest";
import {
  agentActionBaselines,
  getAgent,
  sakinahAgents,
  serviceStages,
} from "@/lib/agents/registry";

describe("Sakinah four-agent spine", () => {
  it("keeps exactly the four named service agents canonical", () => {
    expect(sakinahAgents.map((agent) => agent.id)).toEqual([
      "hafiz",
      "watim",
      "adil",
      "sabr",
    ]);
  });

  it("assigns every service stage to one of the four agents", () => {
    const ids = new Set(sakinahAgents.map((agent) => agent.id));
    for (const stage of serviceStages) {
      expect(ids.has(stage.agentId), stage.title).toBe(true);
      expect(getAgent(stage.agentId).name).toMatch(/Hafiz|Watim|Adil|Sabr/);
    }
  });

  it("starts every user ledger with at least one action per agent", () => {
    const covered = new Set(agentActionBaselines.map((item) => item.agentId));
    expect([...covered].sort()).toEqual(["adil", "hafiz", "sabr", "watim"]);
    expect(agentActionBaselines.every((item) => item.key.includes("."))).toBe(
      true,
    );
  });
});
