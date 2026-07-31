import Button from "@mui/material/Button";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FormActions } from "./FormActions";

afterEach(() => {
  cleanup();
});

describe("FormActions", () => {
  it("显示操作按钮", () => {
    const { container } = render(
      <FormActions>
        <Button>保存</Button>
      </FormActions>,
    );

    expect(
      within(container).getByRole("button", { name: "保存" }),
    ).toBeInTheDocument();
  });
});
