import { describe, expect, it } from "vitest";
import { expandNicknameAlias } from "../nicknameAliases";

describe("expandNicknameAlias", () => {
  it("resolves a known nickname case/whitespace-insensitively", () => {
    expect(expandNicknameAlias("icc")).toBe("Intercultural Center");
    expect(expandNicknameAlias("ICC")).toBe("Intercultural Center");
    expect(expandNicknameAlias("  Icc  ")).toBe("Intercultural Center");
  });

  it("returns null for anything not in the list", () => {
    expect(expandNicknameAlias("not a real nickname")).toBeNull();
    expect(expandNicknameAlias("")).toBeNull();
  });
});
