import { expect } from "vitest";
import {
  receiptCreationPayments,
  createdAccount,
} from "test/mocks/receiptCreation";
export { receiptCreationPayments } from "test/mocks/receiptCreation";
import { receiptCreationData } from "test/mocks/receiptCreation";
export { receiptCreationData } from "test/mocks/receiptCreation";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  ReceiptCreationProvider,
  type ReceiptCreationData,
} from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";

export function ReceiptCreationTestProviders({
  children,
  data = receiptCreationData(),
}: {
  children: ReactNode;
  data?: ReceiptCreationData;
}) {
  return (
    <ConfirmDialogTestProviders>
      <ReceiptCreationProvider data={data}>{children}</ReceiptCreationProvider>
    </ConfirmDialogTestProviders>
  );
}

export async function submitReceiptCreationForm(
  kind: "merchant" | "account",
  name: string,
) {
  const field = await screen.findByLabelText(
    kind === "merchant" ? /商家名称/ : /账户名称/,
  );
  fireEvent.change(field, { target: { value: name } });
  if (kind === "account")
    fireEvent.click(screen.getByRole("radio", { name: "现金" }));
  fireEvent.submit(field.closest("form")!);
}

export async function submitReceiptCreation(
  kind: "merchant" | "account",
  name: string,
) {
  await submitReceiptCreationForm(kind, name);
  return screen.findByText(
    kind === "merchant"
      ? `已新增商家「${name}」并选中`
      : `已新增账户「${name}」并选中`,
  );
}

export function expectCreatedReceiptPayment(
  form: HTMLFormElement,
  row: number,
) {
  const data = new FormData(form);
  expect(data.getAll("paymentAccountId")).toEqual(
    receiptCreationPayments.map((payment, index) =>
      index === row - 1 ? createdAccount.id : payment.accountId,
    ),
  );
  expect(data.getAll("paymentAmount")).toEqual(
    receiptCreationPayments.map((payment) => payment.amount),
  );
  expect(data.getAll("itemAmount")).toEqual(["800"]);
}

export function waitMerchantDrawerClosed() {
  return waitFor(() =>
    expect(screen.queryByRole("heading", { name: "商家" })).toBeNull(),
  );
}
