import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { describe, expect, it, vi } from "vitest";
import { theme } from "theme/theme";
import { expectEditTransactionActionButton } from "test/editTransactionActionButton";
import { EditTransactionActionButton } from "./EditTransactionActionButton";

describe("EditTransactionActionButton", () => {
  it("填充和危险描边共用尺寸规则并保留提交与点击行为", () => {
    const onDelete = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <EditTransactionActionButton type="submit">
          保存修改
        </EditTransactionActionButton>
        <EditTransactionActionButton
          color="error"
          variant="outlined"
          onClick={onDelete}
        >
          删除
        </EditTransactionActionButton>
      </ThemeProvider>,
    );
    const save = screen.getByRole("button", { name: "保存修改" });
    const remove = screen.getByRole("button", { name: "删除" });
    for (const button of [save, remove]) {
      expectEditTransactionActionButton(button);
    }
    expect(save).toHaveAttribute("type", "submit");
    expect(save).toHaveClass("MuiButton-contained");
    expect(remove).toHaveClass("MuiButton-outlined", "MuiButton-colorError");
    fireEvent.click(remove);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("保存中保留加载指示并禁止点击，禁用条件可透传", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <EditTransactionActionButton loading onClick={onClick}>
        保存修改
      </EditTransactionActionButton>,
    );
    const button = screen.getByRole("button", { name: "保存修改" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <EditTransactionActionButton disabled>
        保存修改
      </EditTransactionActionButton>,
    );
    expect(button).toBeDisabled();
  });
});
