import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  transactionErrorCodes,
  transactionPaymentValidationErrorMessages,
} from "internal/transaction";

import { TransactionPaymentFields } from "./TransactionPaymentFields";
import {
  createPaymentFieldsProps,
  createPaymentRows,
} from "./transactionPaymentFields.testUtils";

const meta = {
  title: "Organisms/Transactions/TransactionPaymentFields",
  component: TransactionPaymentFields,
  args: createPaymentFieldsProps({}),
} satisfies Meta<typeof TransactionPaymentFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleAccount: Story = {
  name: "单账户（默认）",
};

export const MultiAccountBalanced: Story = {
  name: "多账户平衡",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["2000", "1500"]),
  }),
};

export const MultiAccountUnbalanced: Story = {
  name: "多账户不平衡",
  args: createPaymentFieldsProps({ payments: createPaymentRows(["2000", ""]) }),
};

export const MultiAccountWithZeroAmount: Story = {
  name: "含 0 金额行",
  args: createPaymentFieldsProps({
    payments: createPaymentRows(["3500", "0"]),
  }),
};

export const MultiAccountWithIncomeItem: Story = {
  name: "多账户后又加了收入明细",
  args: createPaymentFieldsProps({
    canAddPayment: false,
    fieldError:
      transactionPaymentValidationErrorMessages[
        transactionErrorCodes.paymentMultiAccountNotAllowed
      ],
    payments: createPaymentRows(["2000", "1500"]),
  }),
};
